import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { mockDB, getSupabaseAdmin, isSupabaseConnected } from "@/lib/supabase-server";
import { formatInIST } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const serverNow = new Date().toISOString();
  let rows: Array<{
    teamId: string;
    teamName: string;
    solved: boolean;
    rank: number | null;
    solvedAt: string | null;
    solvedAtFormatted: string | null;
    attempts: number;
  }> = [];

  const connected = await isSupabaseConnected();
  if (connected) {
    try {
      const sb = getSupabaseAdmin();
      const { data: dbRows, error } = await sb.from("leaderboard").select("*");
      if (!error && dbRows) {
        rows = dbRows.map((r: { team_id: string; team_name: string; solved_at: string | null; rank: number | null; attempts: number }) => ({
          teamId: r.team_id,
          teamName: r.team_name,
          solved: Boolean(r.solved_at),
          rank: r.rank ? Number(r.rank) : null,
          solvedAt: r.solved_at,
          solvedAtFormatted: r.solved_at ? formatInIST(r.solved_at, { includeMillis: true }) : null,
          attempts: Number(r.attempts) || 0,
        })).sort((a: { solved: boolean; rank: number | null; attempts: number }, b: { solved: boolean; rank: number | null; attempts: number }) => {
          if (a.solved && b.solved) return (a.rank || 0) - (b.rank || 0);
          if (a.solved && !b.solved) return -1;
          if (!a.solved && b.solved) return 1;
          return b.attempts - a.attempts;
        });
      }
    } catch {
      // Fallback to mockDB
    }
  }

  if (rows.length === 0) {
    // Aggregate leaderboard rows from mockDB
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

    const attemptsCount = new Map<string, number>();
    for (const sub of mockDB.submissions) {
      attemptsCount.set(sub.team_id, (attemptsCount.get(sub.team_id) || 0) + 1);
    }

    rows = Array.from(mockDB.teams.values())
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
        if (a.solved && b.solved) return (a.rank || 0) - (b.rank || 0);
        if (a.solved && !b.solved) return -1;
        if (!a.solved && b.solved) return 1;
        return b.attempts - a.attempts;
      });
  }

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
