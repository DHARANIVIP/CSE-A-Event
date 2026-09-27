import { describe, it, expect, beforeEach } from "vitest";
import { GET as getLeaderboard, POST as postLeaderboard } from "@/app/api/leaderboard/route";
import { mockDB } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

describe("Question Verification & Mock Leaderboard System", () => {
  beforeEach(() => {
    // Reset mockDB submissions and team checkpoints before each test
    mockDB.submissions = [];
    if (mockDB.teamCheckpoints) {
      mockDB.teamCheckpoints.clear();
    }
  });

  it("fresh leaderboard initializes with all teams unranked and 0 questions solved", async () => {
    const req = new NextRequest("http://localhost:3000/api/leaderboard");
    const res = await getLeaderboard(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.rows.length).toBeGreaterThan(0);

    // Every team should have 0 questions solved and null rank initially
    for (const row of json.rows) {
      expect(row.questionsSolved).toBe(0);
      expect(row.rank).toBeNull();
      expect(row.solved).toBe(false);
      expect(row.boxSolved).toBe(false);
    }
  });

  it("ranks team #1 when they solve the first question, and preserves first-solver advantage on tie", async () => {
    // Team DTX-01 solves Q1 at 10:00:10
    const timeT1 = new Date(Date.now() - 60000).toISOString();
    mockDB.teamCheckpoints.set("DTX-01", {
      clearedQuestions: { q1: true },
      unlockedChars: { q1: "C" },
      answers: { q1: "C" },
      solvedCount: 1,
      lastSolvedAt: timeT1,
      attempts: 1,
    });

    const req1 = new NextRequest("http://localhost:3000/api/leaderboard");
    const res1 = await getLeaderboard(req1);
    const json1 = await res1.json();

    const dtx01Row = json1.rows.find((r: { teamId: string }) => r.teamId === "DTX-01");
    expect(dtx01Row).toBeDefined();
    expect(dtx01Row.rank).toBe(1);
    expect(dtx01Row.questionsSolved).toBe(1);

    // Team DTX-02 also solves Q1, but later at 10:00:30
    const timeT2 = new Date(Date.now() - 30000).toISOString();
    mockDB.teamCheckpoints.set("DTX-02", {
      clearedQuestions: { q1: true },
      unlockedChars: { q1: "C" },
      answers: { q1: "C" },
      solvedCount: 1,
      lastSolvedAt: timeT2,
      attempts: 1,
    });

    const req2 = new NextRequest("http://localhost:3000/api/leaderboard");
    const res2 = await getLeaderboard(req2);
    const json2 = await res2.json();

    const row1 = json2.rows.find((r: { teamId: string }) => r.teamId === "DTX-01");
    const row2 = json2.rows.find((r: { teamId: string }) => r.teamId === "DTX-02");

    // DTX-01 solved it first, so DTX-01 MUST remain #1 and DTX-02 is #2
    expect(row1.rank).toBe(1);
    expect(row2.rank).toBe(2);
  });

  it("team takes the lead (#1) when they solve more questions than the previous leader", async () => {
    // DTX-01 solved 1 question earlier
    const timeT1 = new Date(Date.now() - 60000).toISOString();
    mockDB.teamCheckpoints.set("DTX-01", {
      clearedQuestions: { q1: true },
      unlockedChars: { q1: "C" },
      answers: { q1: "C" },
      solvedCount: 1,
      lastSolvedAt: timeT1,
      attempts: 1,
    });

    // DTX-02 solves 2 questions (Q1 and Q2)
    const timeT3 = new Date(Date.now() - 10000).toISOString();
    mockDB.teamCheckpoints.set("DTX-02", {
      clearedQuestions: { q1: true, q2: true },
      unlockedChars: { q1: "C", q2: "A" },
      answers: { q1: "C", q2: "A" },
      solvedCount: 2,
      lastSolvedAt: timeT3,
      attempts: 2,
    });

    const req = new NextRequest("http://localhost:3000/api/leaderboard");
    const res = await getLeaderboard(req);
    const json = await res.json();

    const dtx02Row = json.rows.find((r: { teamId: string }) => r.teamId === "DTX-02");
    const dtx01Row = json.rows.find((r: { teamId: string }) => r.teamId === "DTX-01");

    // DTX-02 solved 2 questions, taking the lead (#1) over DTX-01 (#2)
    expect(dtx02Row.rank).toBe(1);
    expect(dtx02Row.questionsSolved).toBe(2);

    expect(dtx01Row.rank).toBe(2);
    expect(dtx01Row.questionsSolved).toBe(1);
  });

  it("zero answer leakage: answers and unlocked characters are never exposed in leaderboard payload", async () => {
    mockDB.teamCheckpoints.set("DTX-01", {
      clearedQuestions: { q1: true, q3: true },
      unlockedChars: { q1: "C", q3: "5" },
      answers: { q1: "C", q3: "52604" },
      solvedCount: 2,
      lastSolvedAt: new Date().toISOString(),
      attempts: 2,
    });

    const req = new NextRequest("http://localhost:3000/api/leaderboard");
    const res = await getLeaderboard(req);
    const json = await res.json();

    const dtx01Row = json.rows.find((r: { teamId: string }) => r.teamId === "DTX-01");
    expect(dtx01Row).toBeDefined();

    // Verify properties on row
    expect(dtx01Row.unlockedChars).toBeUndefined();
    expect(dtx01Row.answers).toBeUndefined();
    expect(dtx01Row.clearedQuestions).toBeUndefined();

    // Stringify entire payload to guarantee no secret answers appear anywhere
    const rawString = JSON.stringify(json);
    expect(rawString.includes("52604")).toBe(false);
  });

  it("resets mock leaderboard fresh via POST /api/leaderboard { action: 'reset' }", async () => {
    // Add progress
    mockDB.teamCheckpoints.set("DTX-01", {
      clearedQuestions: { q1: true },
      unlockedChars: { q1: "C" },
      answers: { q1: "C" },
      solvedCount: 1,
      lastSolvedAt: new Date().toISOString(),
      attempts: 1,
    });

    // Reset via POST
    const resetReq = new NextRequest("http://localhost:3000/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const resetRes = await postLeaderboard(resetReq);
    expect(resetRes.status).toBe(200);

    const resetData = await resetRes.json();
    expect(resetData.success).toBe(true);

    // Verify leaderboard is fresh again
    const lbReq = new NextRequest("http://localhost:3000/api/leaderboard");
    const lbRes = await getLeaderboard(lbReq);
    const lbData = await lbRes.json();

    const dtx01Row = lbData.rows.find((r: { teamId: string }) => r.teamId === "DTX-01");
    expect(dtx01Row.questionsSolved).toBe(0);
    expect(dtx01Row.rank).toBeNull();
  });
});
