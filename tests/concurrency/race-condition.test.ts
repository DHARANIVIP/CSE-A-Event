import { describe, it, expect } from "vitest";
import { executeRecordSubmission, mockDB } from "@/lib/supabase-server";

describe("Concurrency & Race-Condition Safety (tests/concurrency)", () => {
  it("guarantees strictly one rank 1 and unique sequential ranks under N=30 parallel submissions", async () => {
    // Reset submissions for this test
    mockDB.submissions = [];

    const numTeams = 30;
    const submissionPromises = Array.from({ length: numTeams }).map((_, i) => {
      const teamId = `CONCURRENT_TEAM_${i + 1}`;
      return executeRecordSubmission({
        teamId,
        isCorrect: true,
        attemptHash: null,
        requestId: `req_concurrency_${i + 1}`,
        ipHash: `ip_hash_${i + 1}`,
      });
    });

    const results = await Promise.all(submissionPromises);

    // 1. Verify every submission succeeded
    expect(results).toHaveLength(numTeams);

    // 2. Extract ranks
    const ranks = results.map((r) => r.rank).filter((r): r is number => r !== null);
    expect(ranks).toHaveLength(numTeams);

    // 3. Exactly one team got rank 1
    const rank1Count = ranks.filter((r) => r === 1).length;
    expect(rank1Count).toBe(1);

    // 4. Ranks are 1..N unique
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(numTeams);

    for (let i = 1; i <= numTeams; i++) {
      expect(uniqueRanks.has(i)).toBe(true);
    }

    // 5. Verify ordering matches created_at chronologically
    const allCorrect = [...mockDB.submissions].filter((s) => s.is_correct);
    for (let i = 0; i < allCorrect.length - 1; i++) {
      const timeA = new Date(allCorrect[i].created_at).getTime();
      const timeB = new Date(allCorrect[i + 1].created_at).getTime();
      expect(timeA).toBeLessThanOrEqual(timeB);
    }
  });

  it("handles duplicate requestId idempotently without generating new submissions", async () => {
    const teamId = "IDEMPOTENT_TEAM_1";
    const requestId = "FIXED_REQ_ID_999";

    const res1 = await executeRecordSubmission({
      teamId,
      isCorrect: true,
      attemptHash: null,
      requestId,
      ipHash: "ip1",
    });

    const subCountBefore = mockDB.submissions.length;

    const res2 = await executeRecordSubmission({
      teamId,
      isCorrect: true,
      attemptHash: null,
      requestId,
      ipHash: "ip1",
    });

    expect(mockDB.submissions.length).toBe(subCountBefore);
    expect(res1.createdAt).toBe(res2.createdAt);
    expect(res1.rank).toBe(res2.rank);
  });
});
