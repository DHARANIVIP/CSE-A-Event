import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { parseTeamsCSV, exportToCSV, generateRandomPin } from "@/lib/csv";
import { hashWithScrypt, generateSalt } from "@/lib/hash";
import { mockDB } from "@/lib/supabase-server";
import { safeLog } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  const teamsList = Array.from(mockDB.teams.values()).map((t) => ({
    id: t.id,
    name: t.name,
    members: t.members,
    disabled: t.disabled,
    createdAt: t.created_at,
  }));

  // CSV export without PINs (Section 11.3)
  if (format === "csv") {
    const csvContent = exportToCSV(
      ["team_id", "team_name", "members", "disabled", "created_at"],
      teamsList.map((t) => [t.id, t.name, t.members.join(";"), t.disabled, t.createdAt])
    );
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="teams-export.csv"',
      },
    });
  }

  return NextResponse.json({ teams: teamsList });
}

const teamMutationSchema = z
  .object({
    action: z.enum(["IMPORT_CSV", "CREATE", "UPDATE", "TOGGLE_DISABLE", "REGENERATE_PIN"]),
    csvContent: z.string().optional(),
    teamId: z.string().optional(),
    name: z.string().optional(),
    members: z.array(z.string()).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  let body: z.infer<typeof teamMutationSchema>;
  try {
    body = teamMutationSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  }

  // 1. CSV Import Action
  if (body.action === "IMPORT_CSV" && body.csvContent) {
    const { teams, errors } = parseTeamsCSV(body.csvContent);
    if (errors.length > 0 && teams.length === 0) {
      return NextResponse.json({ error: { code: "CSV_ERRORS", details: errors } }, { status: 400 });
    }

    const importedSummary: Array<{ id: string; name: string; pin: string }> = [];

    for (const t of teams) {
      const salt = generateSalt(16);
      const pinHash = `${salt}:${hashWithScrypt(t.pin, salt)}`;

      mockDB.teams.set(t.team_id, {
        id: t.team_id,
        name: t.team_name,
        members: t.members,
        pin_hash: pinHash,
        disabled: false,
        created_at: new Date().toISOString(),
      });

      importedSummary.push({ id: t.team_id, name: t.team_name, pin: t.pin });
    }

    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "admin",
      action: "TEAMS_IMPORTED",
      detail: { count: teams.length },
    });

    safeLog("Admin imported teams via CSV", { count: teams.length });

    return NextResponse.json({
      success: true,
      importedCount: teams.length,
      errors,
      teamsWithPins: importedSummary, // Returned once for immediate printing
    });
  }

  // 2. Regenerate PIN Action
  if (body.action === "REGENERATE_PIN" && body.teamId) {
    const team = mockDB.teams.get(body.teamId);
    if (!team) {
      return NextResponse.json({ error: { code: "TEAM_NOT_FOUND" } }, { status: 404 });
    }

    const newPin = generateRandomPin();
    const salt = generateSalt(16);
    team.pin_hash = `${salt}:${hashWithScrypt(newPin, salt)}`;

    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "admin",
      action: "PIN_REGENERATED",
      detail: { teamId: body.teamId },
    });

    return NextResponse.json({ success: true, teamId: body.teamId, newPin });
  }

  // 3. Toggle Disable Action
  if (body.action === "TOGGLE_DISABLE" && body.teamId) {
    const team = mockDB.teams.get(body.teamId);
    if (!team) {
      return NextResponse.json({ error: { code: "TEAM_NOT_FOUND" } }, { status: 404 });
    }

    team.disabled = !team.disabled;

    mockDB.auditLogs.push({
      id: Date.now(),
      at: new Date().toISOString(),
      actor: "admin",
      action: "TEAM_STATUS_TOGGLED",
      detail: { teamId: body.teamId, disabled: team.disabled },
    });

    return NextResponse.json({ success: true, teamId: body.teamId, disabled: team.disabled });
  }

  return NextResponse.json({ error: { code: "UNHANDLED_ACTION" } }, { status: 400 });
}
