import { NextResponse } from "next/server";
import { getTeamSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json({ team: null, authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    team: {
      id: session.teamId,
      name: session.teamName,
      members: session.members,
    },
    authenticated: true,
  });
}
