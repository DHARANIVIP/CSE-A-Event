// Rate Limiting & Escalating Cooldown Engine
// Complies with Section 3 (S8), Section 10.5, and config/event.config.ts

import { eventConfig } from "@/config/event.config";

interface SubmissionHistory {
  timestamps: number[];
  consecutiveWrong: number;
  lastAttemptTime: number;
  cooldownUntil: number;
}

interface IpHistory {
  timestamps: number[];
}

interface LoginHistory {
  attempts: number[];
}

// In-memory sliding windows (supplemented by DB transaction check)
const teamHistories = new Map<string, SubmissionHistory>();
const ipHistories = new Map<string, IpHistory>();
const loginHistories = new Map<string, LoginHistory>();

export interface SubmissionRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  attemptsBeforeCooldown: number;
  consecutiveWrong: number;
  isHardRateLimited: boolean;
}

/**
 * Checks submission limits and cooldowns for a team and IP hash.
 */
export function checkSubmissionRateLimit(
  teamId: string,
  ipHash: string,
  nowMs: number = Date.now()
): SubmissionRateLimitResult {
  const config = eventConfig.rateLimit;
  const oneMinuteAgo = nowMs - 60 * 1000;
  const inactivityResetMs = config.cooldownResetInactivityMinutes * 60 * 1000;

  // 1. IP-level limit check (30 submissions per minute)
  let ipEntry = ipHistories.get(ipHash);
  if (!ipEntry) {
    ipEntry = { timestamps: [] };
    ipHistories.set(ipHash, ipEntry);
  }
  ipEntry.timestamps = ipEntry.timestamps.filter((t) => t > oneMinuteAgo);
  if (ipEntry.timestamps.length >= config.ipSubmissionsPerMinute) {
    const oldestInWindow = ipEntry.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldestInWindow + 60 * 1000 - nowMs) / 1000));
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      attemptsBeforeCooldown: 0,
      consecutiveWrong: 0,
      isHardRateLimited: true,
    };
  }

  // 2. Team history check
  let teamEntry = teamHistories.get(teamId);
  if (!teamEntry) {
    teamEntry = {
      timestamps: [],
      consecutiveWrong: 0,
      lastAttemptTime: 0,
      cooldownUntil: 0,
    };
    teamHistories.set(teamId, teamEntry);
  }

  // Check inactivity reset
  if (nowMs - teamEntry.lastAttemptTime > inactivityResetMs) {
    teamEntry.consecutiveWrong = 0;
    teamEntry.cooldownUntil = 0;
  }

  // Check active cooldown
  if (teamEntry.cooldownUntil > nowMs) {
    const retryAfter = Math.ceil((teamEntry.cooldownUntil - nowMs) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      attemptsBeforeCooldown: 0,
      consecutiveWrong: teamEntry.consecutiveWrong,
      isHardRateLimited: false,
    };
  }

  // 3. Team hard rolling window check (5 per minute)
  teamEntry.timestamps = teamEntry.timestamps.filter((t) => t > oneMinuteAgo);
  if (teamEntry.timestamps.length >= config.teamSubmissionsPerMinute) {
    const oldest = teamEntry.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + 60 * 1000 - nowMs) / 1000));
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      attemptsBeforeCooldown: 0,
      consecutiveWrong: teamEntry.consecutiveWrong,
      isHardRateLimited: true,
    };
  }

  // Calculate remaining attempts before the next cooldown triggers
  const threshold = config.consecutiveWrongThreshold;
  const attemptsBeforeCooldown = Math.max(0, threshold - (teamEntry.consecutiveWrong % threshold));

  return {
    allowed: true,
    retryAfterSeconds: 0,
    attemptsBeforeCooldown: attemptsBeforeCooldown === 0 ? threshold : attemptsBeforeCooldown,
    consecutiveWrong: teamEntry.consecutiveWrong,
    isHardRateLimited: false,
  };
}

/**
 * Records a submission attempt and updates consecutive wrong counters and cooldowns.
 */
export function recordSubmissionOutcome(
  teamId: string,
  ipHash: string,
  isCorrect: boolean,
  nowMs: number = Date.now()
): { cooldownApplied: boolean; cooldownSeconds: number; attemptsBeforeCooldown: number } {
  const config = eventConfig.rateLimit;
  let teamEntry = teamHistories.get(teamId);
  if (!teamEntry) {
    teamEntry = {
      timestamps: [],
      consecutiveWrong: 0,
      lastAttemptTime: 0,
      cooldownUntil: 0,
    };
    teamHistories.set(teamId, teamEntry);
  }

  // Record timestamp
  teamEntry.timestamps.push(nowMs);
  teamEntry.lastAttemptTime = nowMs;

  // Record IP timestamp
  let ipEntry = ipHistories.get(ipHash);
  if (!ipEntry) {
    ipEntry = { timestamps: [] };
    ipHistories.set(ipHash, ipEntry);
  }
  ipEntry.timestamps.push(nowMs);

  if (isCorrect) {
    // Reset consecutive wrong on correct answer
    teamEntry.consecutiveWrong = 0;
    teamEntry.cooldownUntil = 0;
    return {
      cooldownApplied: false,
      cooldownSeconds: 0,
      attemptsBeforeCooldown: config.consecutiveWrongThreshold,
    };
  }

  // Incorrect answer
  teamEntry.consecutiveWrong++;
  const threshold = config.consecutiveWrongThreshold;

  // Check if cooldown applies: when consecutiveWrong >= 3
  if (teamEntry.consecutiveWrong >= threshold) {
    const tierIndex = Math.min(
      teamEntry.consecutiveWrong - threshold,
      config.cooldownSchedule.length - 1
    );
    const cooldownSeconds = config.cooldownSchedule[tierIndex];
    teamEntry.cooldownUntil = nowMs + cooldownSeconds * 1000;

    return {
      cooldownApplied: true,
      cooldownSeconds,
      attemptsBeforeCooldown: 0,
    };
  }

  const attemptsBeforeCooldown = threshold - teamEntry.consecutiveWrong;
  return {
    cooldownApplied: false,
    cooldownSeconds: 0,
    attemptsBeforeCooldown,
  };
}

/**
 * Login rate limiter: 5 attempts / 5 minutes per scope (IP hash or team ID).
 */
export function checkLoginRateLimit(
  scope: string,
  nowMs: number = Date.now()
): { allowed: boolean; retryAfterSeconds: number } {
  const windowMs = eventConfig.rateLimit.loginWindowMinutes * 60 * 1000;
  const maxAttempts = eventConfig.rateLimit.loginMaxAttempts;
  const cutoff = nowMs - windowMs;

  let entry = loginHistories.get(scope);
  if (!entry) {
    entry = { attempts: [] };
    loginHistories.set(scope, entry);
  }

  entry.attempts = entry.attempts.filter((t) => t > cutoff);

  if (entry.attempts.length >= maxAttempts) {
    const oldest = entry.attempts[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records a failed login attempt for rate limiting.
 */
export function recordLoginAttempt(scope: string, success: boolean, nowMs: number = Date.now()): void {
  if (success) {
    loginHistories.delete(scope);
    return;
  }

  let entry = loginHistories.get(scope);
  if (!entry) {
    entry = { attempts: [] };
    loginHistories.set(scope, entry);
  }
  entry.attempts.push(nowMs);
}
