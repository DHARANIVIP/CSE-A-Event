import { describe, it, expect } from "vitest";
import {
  calculateEventStatus,
  formatInIST,
  formatCountdown,
} from "@/lib/time";

describe("Event Status & Time Calculations (lib/time.ts)", () => {
  it("computes 'not_started' when server time is before startAt", () => {
    const start = new Date("2026-09-19T10:00:00.000Z");
    const end = new Date("2026-09-19T12:30:00.000Z");
    const now = new Date("2026-09-19T09:30:00.000Z"); // 30 mins before

    const status = calculateEventStatus(
      {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        forceStatus: null,
        caseReleased: false,
      },
      now
    );

    expect(status.status).toBe("not_started");
    expect(status.isLive).toBe(false);
    expect(status.canSubmit).toBe(false);
    expect(status.secondsUntilStart).toBe(1800);
  });

  it("computes 'live' when server time is within start and end", () => {
    const start = new Date("2026-09-19T10:00:00.000Z");
    const end = new Date("2026-09-19T12:30:00.000Z");
    const now = new Date("2026-09-19T11:00:00.000Z");

    const status = calculateEventStatus(
      {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        forceStatus: null,
        caseReleased: true,
      },
      now
    );

    expect(status.status).toBe("live");
    expect(status.isLive).toBe(true);
    expect(status.canSubmit).toBe(true);
    expect(status.remainingSeconds).toBe(5400);
  });

  it("honors forceStatus over time calculation", () => {
    const start = new Date("2026-09-19T10:00:00.000Z");
    const end = new Date("2026-09-19T12:30:00.000Z");
    const now = new Date("2026-09-19T11:00:00.000Z");

    const status = calculateEventStatus(
      {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        forceStatus: "paused",
        caseReleased: true,
      },
      now
    );

    expect(status.status).toBe("paused");
    expect(status.isLive).toBe(false);
    expect(status.canSubmit).toBe(false);
  });

  it("formats countdown correctly into HH:MM:SS", () => {
    expect(formatCountdown(3665)).toBe("01:01:05");
    expect(formatCountdown(45)).toBe("00:00:45");
    expect(formatCountdown(0)).toBe("00:00:00");
  });

  it("formats date in Indian Standard Time (IST)", () => {
    const utcDate = "2026-09-19T04:30:00.000Z"; // 10:00 AM IST
    const formatted = formatInIST(utcDate, { timeOnly: true });
    expect(formatted).toContain("10:00");
  });
});
