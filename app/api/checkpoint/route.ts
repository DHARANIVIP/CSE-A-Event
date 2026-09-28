import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { hashWithScrypt, timingSafeEqualString } from "@/lib/hash";
import { eventConfig } from "@/config/event.config";
import { mockDB } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const checkpointSchema = z
  .object({
    stageId: z.string().min(1).max(20).optional(),
    answer: z.string().min(1).max(50).optional(),
    action: z.string().optional(),
    reset: z.boolean().optional(),
  })
  .strict();

// Cryptographic salts & hashes for all 10 questions (Q01 - Q10)
// Exact Answers:
// Q01: C
// Q02: A
// Q03: 52604
// Q04: DEV-0604
// Q05: TXN00019280
// Q06: TXN00038209
// Q07: TXN00006801
// Q08: DEV-0604
// Q09: TXN00019280
// Q10: 52604
const RAW_CHECKPOINTS: Record<string, { answer: string; salt: string }> = {
  q1: { answer: "C", salt: "Q1_SALT_16B" },
  q2: { answer: "A", salt: "Q2_SALT_16B" },
  q3: { answer: "52604", salt: "Q3_SALT_16B" },
  q4: { answer: "DEV-0604", salt: "Q4_SALT_16B" },
  q5: { answer: "TXN00019280", salt: "Q5_SALT_16B" },
  q6: { answer: "TXN00038209", salt: "Q6_SALT_16B" },
  q7: { answer: "TXN00006801", salt: "Q7_SALT_16B" },
  q8: { answer: "DEV-0604", salt: "Q8_SALT_16B" },
  q9: { answer: "TXN00019280", salt: "Q9_SALT_16B" },
  q10: { answer: "52604", salt: "Q10_SALT_16B" },
};

// Build hashed definitions supporting aliases (q1, q01, stage1, etc.)
const CHECKPOINT_DEFINITIONS: Record<
  string,
  { canonicalId: string; salt: string; hash: string; firstChar: string }
> = {};

Object.entries(RAW_CHECKPOINTS).forEach(([key, item]) => {
  const num = key.replace("q", "");
  const numPadded = num.padStart(2, "0");
  const hash = hashWithScrypt(item.answer.toUpperCase(), item.salt);
  const firstChar = item.answer.trim().charAt(0).toUpperCase();

  const aliases = [
    `q${num}`,
    `q${numPadded}`,
    `stage${num}`,
    `stage${numPadded}`,
    `question${num}`,
    `question${numPadded}`,
  ];

  aliases.forEach((alias) => {
    CHECKPOINT_DEFINITIONS[alias.toLowerCase()] = {
      canonicalId: key,
      salt: item.salt,
      hash,
      firstChar,
    };
  });
});

/**
 * GET /api/checkpoint
 * Returns verified question status and unlocked chars ONLY for the current authenticated team.
 * Zero information from any other team is ever leaked.
 */
export async function GET(req: NextRequest) {
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team login required." } },
      { status: 401 }
    );
  }

  const progress = mockDB.teamCheckpoints?.get(session.teamId);

  return NextResponse.json({
    teamId: session.teamId,
    clearedQuestions: progress?.clearedQuestions || {},
    unlockedChars: progress?.unlockedChars || {},
    answers: progress?.answers || {},
    solvedCount: progress?.solvedCount || 0,
    lastSolvedAt: progress?.lastSolvedAt || null,
  });
}

/**
 * POST /api/checkpoint
 * Verifies answer or resets progress for the current team.
 */
export async function POST(req: NextRequest) {
  if (!eventConfig.features.checkpointsEnabled) {
    return NextResponse.json(
      { error: { code: "DISABLED", message: "Checkpoints are disabled." } },
      { status: 403 }
    );
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team login required." } },
      { status: 401 }
    );
  }

  let body: z.infer<typeof checkpointSchema>;
  try {
    const raw = await req.json();
    body = checkpointSchema.parse(raw);
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid question answer submission format." } },
      { status: 400 }
    );
  }

  // Handle per-team reset request
  if (body.action === "reset" || body.reset === true) {
    if (mockDB.teamCheckpoints) {
      mockDB.teamCheckpoints.delete(session.teamId);
    }
    return NextResponse.json({
      success: true,
      message: `Question verification state reset fresh for team ${session.teamName}.`,
      clearedQuestions: {},
      unlockedChars: {},
      solvedCount: 0,
    });
  }

  if (!body.stageId || !body.answer) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "stageId and answer are required." } },
      { status: 400 }
    );
  }

  const lookupKey = body.stageId.toLowerCase().trim();
  const def = CHECKPOINT_DEFINITIONS[lookupKey];
  if (!def) {
    return NextResponse.json({ correct: false, stageId: body.stageId }, { status: 200 });
  }

  // Retrieve or initialize per-team checkpoint progress
  if (!mockDB.teamCheckpoints) {
    mockDB.teamCheckpoints = new Map();
  }

  let progress = mockDB.teamCheckpoints.get(session.teamId);
  if (!progress) {
    progress = {
      clearedQuestions: {},
      unlockedChars: {},
      answers: {},
      solvedCount: 0,
      lastSolvedAt: null,
      attempts: 0,
    };
    mockDB.teamCheckpoints.set(session.teamId, progress);
  }

  progress.attempts += 1;

  const normalized = body.answer.trim().toUpperCase();
  const computed = hashWithScrypt(normalized, def.salt);
  const correct = timingSafeEqualString(computed, def.hash);

  if (correct) {
    progress.clearedQuestions[def.canonicalId] = true;
    progress.unlockedChars[def.canonicalId] = def.firstChar;
    progress.answers[def.canonicalId] = normalized;
    progress.solvedCount = Object.keys(progress.clearedQuestions).length;
    progress.lastSolvedAt = new Date().toISOString();

    return NextResponse.json({
      correct: true,
      stageId: def.canonicalId,
      unlockedChar: def.firstChar,
      solvedCount: progress.solvedCount,
      clearedQuestions: progress.clearedQuestions,
      unlockedChars: progress.unlockedChars,
    });
  }

  return NextResponse.json({
    correct: false,
    stageId: def.canonicalId,
    unlockedChar: null,
  });
}

/**
 * DELETE /api/checkpoint
 * Resets the question answers for the currently authenticated team.
 */
export async function DELETE(req: NextRequest) {
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team login required." } },
      { status: 401 }
    );
  }

  if (mockDB.teamCheckpoints) {
    mockDB.teamCheckpoints.delete(session.teamId);
  }

  return NextResponse.json({
    success: true,
    message: `Question verification state reset fresh for team ${session.teamName}.`,
    clearedQuestions: {},
    unlockedChars: {},
    solvedCount: 0,
  });
}
