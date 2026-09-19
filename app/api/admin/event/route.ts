import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { mockDB } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

const updateEventSchema = z
  .object({
    action: z.enum([
      "START_NOW",
      "PAUSE",
      "RESUME",
      "END_NOW",
      "EXTEND_10M",
      "SET_TIMES",
      "TOGGLE_CASE_RELEASE",
      "SET_SHA256",
    ]),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    caseReleased: z.boolean().optional(),
    caseSha256: z.string().optional(),
  })
  .strict();

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  return NextResponse.json({
    eventState: mockDB.eventState,
    serverNow: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  let body: z.infer<typeof updateEventSchema>;
  try {
    body = updateEventSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", detail: String(e) } }, { status: 400 });
  }

  const now = new Date();
  const state = mockDB.eventState;

  switch (body.action) {
    case "START_NOW":
      state.start_at = now.toISOString();
      state.end_at = new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(); // 2h 30m
      state.force_status = "live";
      break;

    case "PAUSE":
      state.force_status = "paused";
      break;

    case "RESUME":
      state.force_status = "live";
      break;

    case "END_NOW":
      state.end_at = now.toISOString();
      state.force_status = "ended";
      break;

    case "EXTEND_10M": {
      const currentEnd = state.end_at ? new Date(state.end_at).getTime() : now.getTime();
      state.end_at = new Date(currentEnd + 10 * 60 * 1000).toISOString();
      if (state.force_status === "ended") state.force_status = "live";
      break;
    }

    case "SET_TIMES":
      if (body.startAt !== undefined) state.start_at = body.startAt;
      if (body.endAt !== undefined) state.end_at = body.endAt;
      break;

    case "TOGGLE_CASE_RELEASE":
      state.case_released = body.caseReleased !== undefined ? body.caseReleased : !state.case_released;
      break;

    case "SET_SHA256":
      if (body.caseSha256) state.case_sha256 = body.caseSha256.trim();
      break;
  }

  state.updated_at = now.toISOString();

  // Audit log action
  mockDB.auditLogs.push({
    id: Date.now(),
    at: now.toISOString(),
    actor: "admin",
    action: `EVENT_MODIFIED_${body.action}`,
    detail: { action: body.action },
  });

  safeLog("Admin modified event state", { action: body.action });

  return NextResponse.json({ success: true, eventState: state });
}
