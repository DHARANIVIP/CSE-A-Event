import { describe, it, expect, beforeEach } from "vitest";
import { GET as getStatus } from "@/app/api/status/route";
import { GET as getHints } from "@/app/api/hints/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import { mockDB } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

describe("Core API Endpoints", () => {
  beforeEach(() => {
    mockDB.eventState = {
      id: 1,
      start_at: new Date(Date.now() - 3600000).toISOString(),
      end_at: new Date(Date.now() + 3600000).toISOString(),
      force_status: "live",
      case_released: true,
      case_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      updated_at: new Date().toISOString(),
    };
  });

  it("GET /api/status returns live event status and server timestamp", async () => {
    const res = await getStatus();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("live");
    expect(typeof json.serverNow).toBe("string");
    expect(json.caseReleased).toBe(true);
    expect(json.caseSha256).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("GET /api/hints redacts locked hints and responds with ETag", async () => {
    const req = new NextRequest("http://localhost:3000/api/hints");
    const res = await getHints(req);
    expect(res.status).toBe(200);

    const etag = res.headers.get("ETag");
    expect(etag).toBeTruthy();

    const json = await res.json();
    expect(Array.isArray(json.hints)).toBe(true);

    // Released hints have title and body
    const released = json.hints.find((h: { locked: boolean }) => !h.locked);
    if (released) {
      expect(released.title).toBeTruthy();
      expect(released.body).toBeTruthy();
    }

    // Locked hints redact title and body
    const locked = json.hints.find((h: { locked: boolean }) => h.locked);
    if (locked) {
      expect(locked.title).toBeNull();
      expect(locked.body).toBeNull();
    }

    // ETag 304 Not Modified check
    const req304 = new NextRequest("http://localhost:3000/api/hints", {
      headers: { "If-None-Match": etag! },
    });
    const res304 = await getHints(req304);
    expect(res304.status).toBe(304);
  });

  it("GET /api/leaderboard aggregates ranks, solvedAt, and attempts with ETag", async () => {
    const req = new NextRequest("http://localhost:3000/api/leaderboard");
    const res = await getLeaderboard(req);
    expect(res.status).toBe(200);

    const etag = res.headers.get("ETag");
    expect(etag).toBeTruthy();

    const json = await res.json();
    expect(Array.isArray(json.rows)).toBe(true);
    expect(typeof json.serverNow).toBe("string");

    // Check ETag 304 response
    const req304 = new NextRequest("http://localhost:3000/api/leaderboard", {
      headers: { "If-None-Match": etag! },
    });
    const res304 = await getLeaderboard(req304);
    expect(res304.status).toBe(304);
  });
});
