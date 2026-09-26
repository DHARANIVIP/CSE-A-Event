import { NextResponse } from "next/server";
import { calculateEventStatus } from "@/lib/time";
import { mockDB } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const serverDate = new Date();
  const computed = calculateEventStatus(
    {
      startAt: mockDB.eventState.start_at,
      endAt: mockDB.eventState.end_at,
      forceStatus: mockDB.eventState.force_status,
      caseReleased: mockDB.eventState.case_released,
      caseSha256: mockDB.eventState.case_sha256,
    },
    serverDate
  );

  return NextResponse.json(
    {
      serverNow: computed.serverNow,
      status: computed.status,
      startAt: mockDB.eventState.start_at,
      endAt: mockDB.eventState.end_at,
      caseReleased: computed.canDownloadCase,
      remainingSeconds: computed.remainingSeconds,
      secondsUntilStart: computed.secondsUntilStart,
      caseSha256: mockDB.eventState.case_sha256,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
