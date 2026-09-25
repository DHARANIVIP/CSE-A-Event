import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRF } from "@/lib/csrf";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/rate-limit";
import { hashWithScrypt, timingSafeEqualString } from "@/lib/hash";
import { signTeamToken, TEAM_COOKIE_NAME, TEAM_SESSION_TTL_SECONDS } from "@/lib/auth";
import { mockDB, getSupabaseAdmin, isSupabaseConnected } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

const loginSchema = z
  .object({
    teamId: z.string().min(2).max(100),
    pin: z.string().min(4).max(100),
  })
  .strict();

export async function POST(req: NextRequest) {
  // 1. CSRF & Content-Type validation (S9)
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  // 2. IP Hash calculation for rate limiting
  const forwardedFor = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIp = forwardedFor.split(",")[0].trim();
  const ipScope = `ip:${clientIp}`;

  // 3. Body Parsing & Zod validation (S12)
  let body: z.infer<typeof loginSchema>;
  try {
    const raw = await req.json();
    body = loginSchema.parse(raw);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Student Roll No (or Email / Team ID) and Password are required.",
        },
      },
      { status: 400 }
    );
  }

  const rawIdentifier = body.teamId.trim();
  const normalizedTeamId = rawIdentifier.toUpperCase();
  const teamScope = `team:${normalizedTeamId}`;

  // 4. Rate Limiting Check (5 attempts / 5 min per IP + Team ID, S8)
  const ipLimit = checkLoginRateLimit(ipScope);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many login attempts. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
      },
      { status: 429 }
    );
  }

  const teamLimit = checkLoginRateLimit(teamScope);
  if (!teamLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many login attempts for this account. Try again in ${teamLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: teamLimit.retryAfterSeconds,
        },
      },
      { status: 429 }
    );
  }

  // 5. Look up team in database (Live Supabase with mockDB fallback)
  let team: {
    id: string;
    name: string;
    members: string[];
    pin_hash: string;
    disabled: boolean;
  } | null = null;

  if (await isSupabaseConnected()) {
    try {
      const sb = getSupabaseAdmin();
      // Look up by Team ID, Leader Register No / Roll No, or Leader Email
      let { data, error } = await sb
        .from("teams")
        .select("id, name, members, pin_hash, disabled, leader_reg_no, leader_email")
        .or(`id.eq.${normalizedTeamId},leader_reg_no.eq.${rawIdentifier},leader_email.ilike.${rawIdentifier}`)
        .limit(1)
        .maybeSingle();

      // If not found yet, check if any squad member's register number matches
      if (!data) {
        const { data: memberTeam } = await sb
          .from("teams")
          .select("id, name, members, pin_hash, disabled, leader_reg_no, leader_email")
          .filter("members::text", "ilike", `%"${rawIdentifier}"%`)
          .limit(1)
          .maybeSingle();

        if (memberTeam) {
          data = memberTeam;
        }
      }

      if (!error && data) {
        let parsedMembers: string[] = [];
        if (Array.isArray(data.members)) {
          parsedMembers = data.members.map((m: any) =>
            typeof m === "string"
              ? m
              : m.name
              ? `${m.name}${m.reg_no ? ` (${m.reg_no})` : ""}`
              : String(m)
          );
        }
        team = {
          id: data.id,
          name: data.name,
          members: parsedMembers,
          pin_hash: data.pin_hash,
          disabled: Boolean(data.disabled),
        };
      }
    } catch {
      team = null;
    }
  }

  // Fallback to mockDB if not found or offline
  if (!team) {
    for (const t of mockDB.teams.values()) {
      const idMatch = t.id.toUpperCase() === normalizedTeamId;
      const regMatch = (t as any).leader_reg_no === rawIdentifier;
      const emailMatch = (t as any).leader_email?.toLowerCase() === rawIdentifier.toLowerCase();
      const memberMatch = Array.isArray(t.members) && t.members.some((m: any) =>
        typeof m === "string" ? m.includes(rawIdentifier) : m.reg_no === rawIdentifier
      );
      if (idMatch || regMatch || emailMatch || memberMatch) {
        team = t;
        break;
      }
    }
  }

  // Constant-time execution: always perform scrypt hash verification (S8)
  const saltToUse = team ? team.pin_hash.split(":")[0] : "CONST_TIME_DUMMY_SALT_16B";
  const expectedHash = team ? team.pin_hash.split(":")[1] : "DUMMY_HASH_TIMING_SAFE_PROFILE_VAL";

  const computedHash = hashWithScrypt(body.pin, saltToUse);
  const isValidPin = timingSafeEqualString(computedHash, expectedHash);

  if (!team || !isValidPin) {
    recordLoginAttempt(ipScope, false);
    recordLoginAttempt(teamScope, false);
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid Team ID or 6-digit PIN.",
        },
      },
      { status: 401 }
    );
  }

  if (team.disabled) {
    return NextResponse.json(
      {
        error: {
          code: "TEAM_DISABLED",
          message: "THIS TEAM IS SUSPENDED. SEE AN ORGANISER.",
        },
      },
      { status: 403 }
    );
  }

  // 6. Record success in rate limiter
  recordLoginAttempt(ipScope, true);
  recordLoginAttempt(teamScope, true);

  // 7. Sign JWT Session Token (S7)
  const token = await signTeamToken({
    teamId: team.id,
    teamName: team.name,
    members: team.members,
  });

  safeLog("Team authenticated successfully", { teamId: team.id });

  // 8. Return response with httpOnly SameSite=Strict cookie
  const response = NextResponse.json(
    {
      team: {
        id: team.id,
        name: team.name,
        members: team.members,
      },
    },
    { status: 200 }
  );

  response.cookies.set({
    name: TEAM_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TEAM_SESSION_TTL_SECONDS,
  });

  return response;
}
