import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { mockDB } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

const resetSchema = z
  .object({
    confirmation: z.literal("RESET"),
    target: z.enum(["SUBMISSIONS", "EVENT"]),
  })
  .strict();

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  let body: z.infer<typeof resetSchema>;
  try {
    body = resetSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_CONFIRMATION", message: 'You must type "RESET" to confirm.' } },
      { status: 400 }
    );
  }

  if (body.target === "SUBMISSIONS") {
    const clearedCount = mockDB.submissions.length;
    mockDB.submissions = [];

    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "admin",
      action: "RESET_SUBMISSIONS",
      detail: { clearedCount },
    });

    safeLog("Admin reset all submissions", { clearedCount });
    return NextResponse.json({ success: true, message: `Cleared ${clearedCount} submissions.` });
  }

  if (body.target === "EVENT") {
    mockDB.submissions = [];
    mockDB.eventState = {
      id: 1,
      start_at: null,
      end_at: null,
      force_status: null,
      case_released: false,
      case_sha256: null,
      updated_at: new Date().toISOString(),
    };

    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "admin",
      action: "RESET_EVENT_COMPLETE",
      detail: {},
    });

    safeLog("Admin completely reset event state");
    return NextResponse.json({ success: true, message: "Event reset to pre-event state." });
  }

  return NextResponse.json({ error: { code: "INVALID_TARGET" } }, { status: 400 });
}
