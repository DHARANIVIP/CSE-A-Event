import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRF } from "@/lib/csrf";
import { env } from "@/lib/env";
import { hashWithScrypt, timingSafeEqualString } from "@/lib/hash";
import { signAdminToken, ADMIN_COOKIE_NAME, ADMIN_SESSION_TTL_SECONDS } from "@/lib/auth";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/rate-limit";
import { mockDB } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

const adminLoginSchema = z
  .object({
    password: z.string().min(6),
  })
  .strict();

export async function POST(req: NextRequest) {
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  const forwardedFor = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIp = forwardedFor.split(",")[0].trim();
  const scope = `admin:${clientIp}`;

  // Rate limit: 5 attempts per 5 minutes
  const limit = checkLoginRateLimit(scope);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Admin login rate-limited. Retry in ${limit.retryAfterSeconds}s.`,
          retryAfterSeconds: limit.retryAfterSeconds,
        },
      },
      { status: 429 }
    );
  }

  let body: z.infer<typeof adminLoginSchema>;
  try {
    body = adminLoginSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Password is required." } },
      { status: 400 }
    );
  }

  // Admin password verification via scrypt
  const parts = env.ADMIN_PASSWORD_HASH.split(":");
  const salt = parts[0];
  const expectedHash = parts[1] || "";

  const computedHash = hashWithScrypt(body.password, salt);
  const isValid = timingSafeEqualString(computedHash, expectedHash);

  if (!isValid) {
    recordLoginAttempt(scope, false);
    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "anonymous",
      action: "ADMIN_LOGIN_FAILED",
      detail: { ip: clientIp },
    });
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Invalid administrator password." } },
      { status: 401 }
    );
  }

  recordLoginAttempt(scope, true);

  // Sign Admin JWT Token (S7)
  const token = await signAdminToken();

  mockDB.auditLogs.push({
    id: Date.now(),
    at: new Date().toISOString(),
    actor: "admin",
    action: "ADMIN_LOGIN_SUCCESS",
    detail: { ip: clientIp },
  });

  safeLog("Admin session established", { ip: clientIp });

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}
