// Authentication & Session Management adhering to Rule S7
// Implements separate HS256 JWTs via 'jose' with distinct audiences, cookies, and TTLs.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

export const TEAM_COOKIE_NAME = "mb_team_token";
export const ADMIN_COOKIE_NAME = "mb_admin_token";

export const TEAM_AUDIENCE = "mystery-team";
export const ADMIN_AUDIENCE = "mystery-admin";

export const TEAM_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
export const ADMIN_SESSION_TTL_SECONDS = 4 * 60 * 60; // 4 hours

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

export interface TeamSessionPayload {
  teamId: string;
  teamName: string;
  members: string[];
}

export interface AdminSessionPayload {
  role: "admin";
  authenticatedAt: string;
}

/**
 * Signs a JWT session token for a team.
 */
export async function signTeamToken(payload: TeamSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.SITE_ORIGIN)
    .setAudience(TEAM_AUDIENCE)
    .setExpirationTime(`${TEAM_SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Signs a JWT session token for an admin.
 */
export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin", authenticatedAt: new Date().toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.SITE_ORIGIN)
    .setAudience(ADMIN_AUDIENCE)
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a team session token. Returns payload or null.
 */
export async function verifyTeamToken(token: string): Promise<TeamSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      audience: TEAM_AUDIENCE,
      issuer: env.SITE_ORIGIN,
    });
    return {
      teamId: payload.teamId as string,
      teamName: payload.teamName as string,
      members: (payload.members as string[]) || [],
    };
  } catch {
    return null;
  }
}

/**
 * Verifies an admin session token. Returns boolean.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey, {
      audience: ADMIN_AUDIENCE,
      issuer: env.SITE_ORIGIN,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves the verified team session from the incoming request cookies.
 */
export async function getTeamSession(): Promise<TeamSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEAM_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyTeamToken(token);
}

/**
 * Retrieves the verified admin session from the incoming request cookies.
 */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null as unknown as boolean;
  return verifyAdminToken(token);
}
