import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { mockDB } from "@/lib/supabase-server";
import { formatInIST } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  // Authoritative re-query of all correct submissions ordered by created_at
  const correctSubmissions = mockDB.submissions
    .filter((s) => s.is_correct)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const topSolvers = correctSubmissions.map((sub, idx) => {
    const team = mockDB.teams.get(sub.team_id);
    return {
      rank: idx + 1,
      teamId: sub.team_id,
      teamName: team?.name || sub.team_id,
      members: team?.members || [],
      solvedAt: sub.created_at,
      solvedAtFormatted: formatInIST(sub.created_at, { includeMillis: true }),
      id: sub.id,
    };
  });

  const winner = topSolvers.length > 0 ? topSolvers[0] : null;

  return NextResponse.json({
    winner,
    topSolvers: topSolvers.slice(0, 5),
    verifiedAt: new Date().toISOString(),
  });
}
