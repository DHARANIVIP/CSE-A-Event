import { NextResponse } from "next/server";
import { getTeamSession } from "@/lib/auth";
import { calculateEventStatus } from "@/lib/time";
import { mockDB, getSupabaseAdmin, isSupabaseConnected } from "@/lib/supabase-server";
import { env } from "@/lib/env";
import { safeLog } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

// Per-team download rate limiter: max 10/hour
const downloadTracker = new Map<string, number[]>();

export async function GET() {
  // 1. Team session verification (S7)
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team login required to download case files." } },
      { status: 401 }
    );
  }

  // 2. Event Status & Release Verification (Section 9.3)
  const eventStatus = calculateEventStatus({
    startAt: mockDB.eventState.start_at,
    endAt: mockDB.eventState.end_at,
    forceStatus: mockDB.eventState.force_status,
    caseReleased: mockDB.eventState.case_released,
  });

  if (!mockDB.eventState.case_released) {
    return NextResponse.json(
      {
        error: {
          code: "CASE_LOCKED",
          message: "LOCKED — THE CASE HAS NOT BEEN RELEASED YET.",
        },
      },
      { status: 403 }
    );
  }

  // 3. Hourly rate limit check (10 downloads/hour per team)
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  let history = downloadTracker.get(session.teamId) || [];
  history = history.filter((t) => t > oneHourAgo);

  if (history.length >= 10) {
    return NextResponse.json(
      {
        error: {
          code: "DOWNLOAD_RATE_LIMIT",
          message: "Download quota reached (max 10 downloads per hour per team).",
        },
      },
      { status: 429 }
    );
  }

  history.push(now);
  downloadTracker.set(session.teamId, history);

  safeLog("Case download requested", { teamId: session.teamId });

  // 4. Mode B: External URL configured
  if (env.CASE_ZIP_EXTERNAL_URL) {
    return NextResponse.json({
      mode: "external",
      downloadUrl: env.CASE_ZIP_EXTERNAL_URL,
      sha256: mockDB.eventState.case_sha256,
    });
  }

  // 5. Mode A: Supabase Storage Signed URL (60s validity)
  const connected = await isSupabaseConnected();
  if (connected) {
    try {
      const sb = getSupabaseAdmin();
      const objectPath = env.CASE_OBJECT_PATH || "mystery-case-archive.zip";
      const { data, error } = await sb.storage
        .from("case-files")
        .createSignedUrl(objectPath, 60);

      if (!error && data?.signedUrl) {
        return NextResponse.json({
          mode: "signed_storage",
          downloadUrl: data.signedUrl,
          expiresInSeconds: 60,
          sha256: mockDB.eventState.case_sha256,
        });
      }
    } catch {
      // Fallback
    }
  }

  // Mock signed link for local preview/development
  return NextResponse.json({
    mode: "mock_signed",
    downloadUrl: `/api/mock-case-archive?t=${Date.now()}`,
    expiresInSeconds: 60,
    sha256: mockDB.eventState.case_sha256,
  });
}
