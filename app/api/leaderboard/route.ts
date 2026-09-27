import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { mockDB, getSupabaseAdmin, isSupabaseConnected } from "@/lib/supabase-server";
import { formatInIST } from "@/lib/time";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export interface LeaderboardRowItem {
  teamId: string;
  teamName: string;
  leaderName?: string | null;
  solved: boolean;
  boxSolved: boolean;
  questionsSolved: number;
  totalQuestions: number;
  rank: number | null;
  solvedAt: string | null;
  solvedAtFormatted: string | null;
  attempts: number;
}

export async function GET(req: NextRequest) {
  const serverNow = new Date().toISOString();
  let rows: LeaderboardRowItem[] = [];

  const connected = await isSupabaseConnected();
  if (connected) {
    try {
      const sb = getSupabaseAdmin();
      const { data: dbRows, error } = await sb.from("leaderboard").select("*");
      if (!error && dbRows) {
        rows = dbRows
          .filter((r: { team_id: string }) => r.team_id !== "TEAM-01" && r.team_id !== "TEAM-02")
          .map(
            (r: {
              team_id: string;
              team_name: string;
              solved_at: string | null;
              rank: number | null;
              attempts: number;
            }) => ({
              teamId: r.team_id,
              teamName: r.team_name,
              leaderName: null,
              solved: Boolean(r.solved_at),
              boxSolved: Boolean(r.solved_at),
              questionsSolved: r.solved_at ? 10 : 0,
              totalQuestions: 10,
              rank: r.rank ? Number(r.rank) : null,
              solvedAt: r.solved_at,
              solvedAtFormatted: r.solved_at
                ? formatInIST(r.solved_at, { includeMillis: true })
                : null,
              attempts: Number(r.attempts) || 0,
            })
          )
          .sort((a, b) => {
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
    // 1. Map of teams who cracked the final mystery box
    const correctSubmissions = mockDB.submissions
      .filter((s) => s.is_correct)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const boxSolvedMap = new Map<string, { solvedAt: string; rank: number }>();
    correctSubmissions.forEach((sub, idx) => {
      if (!boxSolvedMap.has(sub.team_id)) {
        boxSolvedMap.set(sub.team_id, {
          solvedAt: sub.created_at,
          rank: idx + 1,
        });
      }
    });

    const attemptsCount = new Map<string, number>();
    for (const sub of mockDB.submissions) {
      attemptsCount.set(sub.team_id, (attemptsCount.get(sub.team_id) || 0) + 1);
    }

    // 2. Aggregate question progress and box progress per team
    const activeTeams = Array.from(mockDB.teams.values()).filter(
      (t) => !t.disabled && t.id !== "TEAM-01" && t.id !== "TEAM-02"
    );

    const teamEntries = activeTeams.map((t) => {
      const boxSolved = boxSolvedMap.get(t.id);
      const cpProgress = mockDB.teamCheckpoints?.get(t.id);
      const questionsSolved = cpProgress?.solvedCount || (boxSolved ? 10 : 0);
      const lastSolvedAt = boxSolved ? boxSolved.solvedAt : cpProgress?.lastSolvedAt || null;
      const totalAttempts = (attemptsCount.get(t.id) || 0) + (cpProgress?.attempts || 0);

      return {
        teamId: t.id,
        teamName: t.name,
        leaderName: t.leader_name || null,
        boxSolved: Boolean(boxSolved),
        solved: Boolean(boxSolved || questionsSolved === 10),
        questionsSolved,
        totalQuestions: 10,
        solvedAt: lastSolvedAt,
        solvedAtFormatted: lastSolvedAt
          ? formatInIST(lastSolvedAt, { includeMillis: true })
          : null,
        attempts: totalAttempts,
      };
    });

    // 3. Competitive Sorting Logic:
    // Whoever solves the questions first and takes the lead is ranked first!
    // Priority 1: Box solved (top tier)
    // Priority 2: Highest questions solved (e.g. 5 questions beats 4 questions)
    // Priority 3: Earliest timestamp of reaching current questions solved
    // Priority 4: Lowest attempts (efficiency tie-breaker)
    teamEntries.sort((a, b) => {
      if (a.boxSolved && !b.boxSolved) return -1;
      if (!a.boxSolved && b.boxSolved) return 1;

      if (a.boxSolved && b.boxSolved) {
        return new Date(a.solvedAt || 0).getTime() - new Date(b.solvedAt || 0).getTime();
      }

      if (a.questionsSolved !== b.questionsSolved) {
        return b.questionsSolved - a.questionsSolved;
      }

      if (a.questionsSolved > 0 && b.questionsSolved > 0) {
        const timeA = new Date(a.solvedAt || 0).getTime();
        const timeB = new Date(b.solvedAt || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
      }

      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts;
      }

      return a.teamName.localeCompare(b.teamName);
    });

    // 4. Assign authoritative sequential ranks 1, 2, 3... to all teams with verified progress
    let currentRank = 1;
    rows = teamEntries.map((item) => {
      if (item.questionsSolved > 0 || item.boxSolved) {
        return {
          ...item,
          rank: currentRank++,
        };
      }
      return {
        ...item,
        rank: null,
      };
    });
  }

  const payload = {
    serverNow,
    rows,
  };

  // ETag computation on rows
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

/**
 * POST /api/leaderboard
 * Allows resetting all mock leaderboard data for testing and verification.
 */
export async function POST(req: NextRequest) {
  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  if (body.action === "reset") {
    // Reset mock submissions and checkpoints
    mockDB.submissions = [];
    if (mockDB.teamCheckpoints) {
      mockDB.teamCheckpoints.clear();
    }

    return NextResponse.json({
      success: true,
      message: "Mock leaderboard and question progress successfully reset fresh.",
    });
  }

  return NextResponse.json({ error: { message: "Invalid action" } }, { status: 400 });
}
