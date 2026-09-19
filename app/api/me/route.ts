import { NextResponse } from "next/server";
import { getTeamSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not logged in" } }, { status: 401 });
  }

  return NextResponse.json({
    team: {
      id: session.teamId,
      name: session.teamName,
      members: session.members,
    },
  });
}
