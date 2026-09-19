import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { mockDB } from "@/lib/supabase-server";
import { formatInIST } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const serverNow = new Date().toISOString();

  // Aggregate leaderboard rows
  const correctSubmissions = mockDB.submissions
    .filter((s) => s.is_correct)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const solvedMap = new Map<string, { solvedAt: string; rank: number }>();
  correctSubmissions.forEach((sub, idx) => {
    solvedMap.set(sub.team_id, {
      solvedAt: sub.created_at,
      rank: idx + 1,
    });
  });

  // Count attempts per team
  const attemptsCount = new Map<string, number>();
  for (const sub of mockDB.submissions) {
    attemptsCount.set(sub.team_id, (attemptsCount.get(sub.team_id) || 0) + 1);
  }

  const rows = Array.from(mockDB.teams.values())
    .filter((t) => !t.disabled)
    .map((t) => {
      const solved = solvedMap.get(t.id);
      return {
        teamId: t.id,
        teamName: t.name,
        solved: Boolean(solved),
        rank: solved ? solved.rank : null,
        solvedAt: solved ? solved.solvedAt : null,
        solvedAtFormatted: solved
          ? formatInIST(solved.solvedAt, { includeMillis: true })
          : null,
        attempts: attemptsCount.get(t.id) || 0,
      };
    })
    .sort((a, b) => {
      // Solved teams ranked by rank ascending; unsolved teams by attempts descending
      if (a.solved && b.solved) return (a.rank || 0) - (b.rank || 0);
      if (a.solved && !b.solved) return -1;
      if (!a.solved && b.solved) return 1;
      return b.attempts - a.attempts;
    });

  const payload = {
    serverNow,
    rows,
  };

  // ETag is computed on the actual data rows so identical rows return 304
  const dataSignature = crypto.createHash("md5").update(JSON.stringify(rows)).digest("hex");
  const etag = `"${dataSignature}"`;

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  }

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": "no-cache",
    },
  });
}
