import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { mockDB } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const nowMs = Date.now();

  // Lazy release of scheduled hints
  const hints = mockDB.hints.map((h) => {
    const isScheduledPast = h.release_at && new Date(h.release_at).getTime() <= nowMs;
    const isReleased = h.released || Boolean(isScheduledPast);

    if (isReleased) {
      return {
        id: h.id,
        position: h.position,
        title: h.title,
        body: h.body,
        locked: false,
        releaseAt: h.release_at,
      };
    }

    return {
      id: h.id,
      position: h.position,
      title: null,
      body: null,
      locked: true,
      releaseAt: h.release_at,
    };
  });

  const payloadString = JSON.stringify({ hints });
  const etag = `"${crypto.createHash("md5").update(payloadString).digest("hex")}"`;

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

  return new NextResponse(payloadString, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": "no-cache",
    },
  });
}
