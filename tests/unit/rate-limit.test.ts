import { describe, it, expect } from "vitest";
import {
  checkSubmissionRateLimit,
  recordSubmissionOutcome,
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/lib/rate-limit";

describe("Rate Limiting & Cooldown Engine (lib/rate-limit.ts)", () => {
  it("allows initial submissions up to the rolling cap", () => {
    const teamId = "TEAM_TEST_LIMIT_1";
    const ipHash = "IP_HASH_1";
    const baseTime = 1000000;

    const res = checkSubmissionRateLimit(teamId, ipHash, baseTime);
    expect(res.allowed).toBe(true);
    expect(res.attemptsBeforeCooldown).toBe(3);
  });

  it("enforces escalating cooldowns after 3 consecutive wrong attempts", () => {
    const teamId = "TEAM_TEST_COOLDOWN";
    const ipHash = "IP_HASH_COOLDOWN";
    let now = 2000000;

    // 1st wrong
    let outcome = recordSubmissionOutcome(teamId, ipHash, false, now);
    expect(outcome.cooldownApplied).toBe(false);
    expect(outcome.attemptsBeforeCooldown).toBe(2);

    // 2nd wrong
    outcome = recordSubmissionOutcome(teamId, ipHash, false, now + 1000);
    expect(outcome.cooldownApplied).toBe(false);
    expect(outcome.attemptsBeforeCooldown).toBe(1);

    // 3rd wrong -> triggers 30s cooldown tier
    outcome = recordSubmissionOutcome(teamId, ipHash, false, now + 2000);
    expect(outcome.cooldownApplied).toBe(true);
    expect(outcome.cooldownSeconds).toBe(30);

    // Immediate subsequent check must be blocked
    const checkBlocked = checkSubmissionRateLimit(teamId, ipHash, now + 5000);
    expect(checkBlocked.allowed).toBe(false);
    expect(checkBlocked.retryAfterSeconds).toBeGreaterThan(0);

    // After 31 seconds, check should be allowed again
    const checkAllowed = checkSubmissionRateLimit(teamId, ipHash, now + 33000);
    expect(checkAllowed.allowed).toBe(true);
  });

  it("resets consecutive wrong counter on a correct submission", () => {
    const teamId = "TEAM_TEST_RESET";
    const ipHash = "IP_HASH_RESET";
    const now = 3000000;

    // 2 wrong attempts
    recordSubmissionOutcome(teamId, ipHash, false, now);
    recordSubmissionOutcome(teamId, ipHash, false, now + 1000);

    // Correct attempt
    const outcome = recordSubmissionOutcome(teamId, ipHash, true, now + 2000);
    expect(outcome.cooldownApplied).toBe(false);
    expect(outcome.attemptsBeforeCooldown).toBe(3);

    const check = checkSubmissionRateLimit(teamId, ipHash, now + 3000);
    expect(check.consecutiveWrong).toBe(0);
  });

  it("enforces login rate limiting per scope", () => {
    const scope = "ip:192.168.1.100";
    const baseTime = 4000000;

    for (let i = 0; i < 5; i++) {
      expect(checkLoginRateLimit(scope, baseTime + i * 1000).allowed).toBe(true);
      recordLoginAttempt(scope, false, baseTime + i * 1000);
    }

    // 6th attempt should be blocked
    const blocked = checkLoginRateLimit(scope, baseTime + 6000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // Successful login clears rate limit
    recordLoginAttempt(scope, true, baseTime + 7000);
    expect(checkLoginRateLimit(scope, baseTime + 8000).allowed).toBe(true);
  });
});
