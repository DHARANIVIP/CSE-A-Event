import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { mockDB } from "@/lib/supabase-server";
import { exportToCSV } from "@/lib/csv";
import { formatInIST } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const filterTeam = searchParams.get("teamId")?.toUpperCase();

  // Calculate wrong attempts per team to flag > 15 wrong
  const wrongCounts = new Map<string, number>();
  for (const s of mockDB.submissions) {
    if (!s.is_correct) {
      wrongCounts.set(s.team_id, (wrongCounts.get(s.team_id) || 0) + 1);
    }
  }

  let list = [...mockDB.submissions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (filterTeam) {
    list = list.filter((s) => s.team_id === filterTeam);
  }

  const enriched = list.map((s) => ({
    id: s.id,
    teamId: s.team_id,
    teamName: mockDB.teams.get(s.team_id)?.name || s.team_id,
    isCorrect: s.is_correct,
    createdAt: s.created_at,
    createdAtFormatted: formatInIST(s.created_at, { includeMillis: true }),
    attemptHashShort: s.attempt_hash ? s.attempt_hash.slice(0, 8) : null,
    ipHashShort: s.ip_hash ? s.ip_hash.slice(0, 8) : null,
    isSuspicious: (wrongCounts.get(s.team_id) || 0) >= 15,
    wrongAttemptsCount: wrongCounts.get(s.team_id) || 0,
  }));

  if (format === "csv") {
    const csvContent = exportToCSV(
      ["id", "team_id", "is_correct", "server_timestamp_ist", "attempt_hash_short", "ip_hash_short"],
      enriched.map((s) => [
        s.id,
        s.teamId,
        s.isCorrect ? "CORRECT" : "WRONG",
        s.createdAtFormatted,
        s.attemptHashShort,
        s.ipHashShort,
      ])
    );
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="submissions-audit.csv"',
      },
    });
  }

  return NextResponse.json({ submissions: enriched });
}
