import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { env } from "@/lib/env";
import {
  hashWithScrypt,
  timingSafeEqualString,
  hashAttempt,
  executeConstantWorkDummy,
} from "@/lib/hash";
import {
  checkSubmissionRateLimit,
  recordSubmissionOutcome,
} from "@/lib/rate-limit";
import { calculateEventStatus, formatInIST } from "@/lib/time";
import { executeRecordSubmission, mockDB } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

const submitSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((c) => c.toUpperCase())
      .refine((c) => /^[A-Z0-9]{5}$/.test(c), {
        message: "Code must be exactly 5 alphanumeric characters [A-Z0-9].",
      }),
    requestId: z.string().min(10).max(64),
  })
  .strict();

export async function POST(req: NextRequest) {
  // 1. Enforce max body size 2 KB (S12)
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 2048) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Request payload exceeds 2 KB limit." } },
      { status: 413 }
    );
  }

  // 2. CSRF & Content-Type validation (S9)
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  // 3. Team Authentication Verification (S7)
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team session required. Please log in." } },
      { status: 401 }
    );
  }

  // 4. IP Hash computation
  const forwardedFor = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIp = forwardedFor.split(",")[0].trim();
  const ipHash = hashAttempt(clientIp, env.SESSION_SECRET);

  // 5. Parse body with strict Zod schema (S12)
  let body: z.infer<typeof submitSchema>;
  try {
    const raw = await req.json();
    body = submitSchema.parse(raw);
  } catch {
    // Constant work execution to equalize timing profile (S5)
    executeConstantWorkDummy();
    return NextResponse.json(
      { error: { code: "INVALID_FORMAT", message: "Code must be 5 alphanumeric characters." } },
      { status: 400 }
    );
  }

  // 6. Check Event Status (must be LIVE)
  const eventStatus = calculateEventStatus({
    startAt: mockDB.eventState.start_at,
    endAt: mockDB.eventState.end_at,
    forceStatus: mockDB.eventState.force_status,
    caseReleased: mockDB.eventState.case_released,
  });

  if (!eventStatus.isLive) {
    executeConstantWorkDummy();
    return NextResponse.json(
      {
        error: {
          code: "EVENT_NOT_LIVE",
          message:
            eventStatus.status === "paused"
              ? "THE CASE IS PAUSED."
              : eventStatus.status === "ended"
              ? "THE CASE IS CLOSED."
              : "THE CASE HAS NOT STARTED YET.",
        },
      },
      { status: 409 }
    );
  }

  // 7. Check if Team has already solved
  const priorCorrect = mockDB.submissions.find(
    (s) => s.team_id === session.teamId && s.is_correct
  );
  if (priorCorrect) {
    const correctRank =
      mockDB.submissions
        .filter((s) => s.is_correct)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .findIndex((s) => s.id === priorCorrect.id) + 1;

    return NextResponse.json({
      result: "already_solved",
      rank: correctRank,
      solvedAt: priorCorrect.created_at,
      solvedAtFormatted: formatInIST(priorCorrect.created_at, { includeMillis: true }),
      message: "YOUR TEAM HAS ALREADY CRACKED THIS CASE.",
    });
  }

  // 8. Rate Limiting & Cooldown Check (Section 10.5)
  const rateLimit = checkSubmissionRateLimit(session.teamId, ipHash);
  if (!rateLimit.allowed) {
    // S5: Constant-work execution even when rate-limited
    executeConstantWorkDummy();
    return NextResponse.json(
      {
        error: {
          code: rateLimit.isHardRateLimited ? "RATE_LIMITED" : "COOLDOWN_ACTIVE",
          message: rateLimit.isHardRateLimited
            ? `Submission rate limit exceeded. Retry in ${rateLimit.retryAfterSeconds}s.`
            : `Cooldown in effect. Try again in ${rateLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      },
      { status: 429 }
    );
  }

  // 9. Cryptographic Hash Comparison (S2 & S5)
  // Scrypt N=32768, timingSafeEqual against env.CODE_HASH
  const computedHash = hashWithScrypt(body.code, env.CODE_SALT);
  const isCorrect = timingSafeEqualString(computedHash, env.CODE_HASH);

  // S11: Truncated HMAC-SHA256 attempt hash for wrong codes
  const attemptHash = isCorrect ? null : hashAttempt(body.code, env.SESSION_SECRET);

  // 10. Atomic Database Record Submission (S3, S6)
  const { createdAt, rank } = await executeRecordSubmission({
    teamId: session.teamId,
    isCorrect,
    attemptHash,
    requestId: body.requestId,
    ipHash,
  });

  // 11. Update Rate Limiting Outcomes & Cooldowns
  const outcome = recordSubmissionOutcome(session.teamId, ipHash, isCorrect);

  // 12. Safe Audit Logging (S13)
  safeLog("Submission processed", {
    teamId: session.teamId,
    isCorrect,
    rank: rank || null,
  });

  // 13. Return Minimal Jitter-Free Binary Response (S4, S5)
  if (isCorrect) {
    const isFirst = rank === 1;
    return NextResponse.json({
      result: "correct",
      rank,
      isFirst,
      solvedAt: createdAt,
      solvedAtFormatted: formatInIST(createdAt, { includeMillis: true }),
    });
  }

  return NextResponse.json({
    result: "incorrect",
    attemptsBeforeCooldown: outcome.attemptsBeforeCooldown,
    cooldownSeconds: outcome.cooldownSeconds,
    cooldownApplied: outcome.cooldownApplied,
  });
}
