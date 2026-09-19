import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { mockDB } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  return NextResponse.json({ hints: mockDB.hints });
}

const hintMutationSchema = z
  .object({
    action: z.enum(["CREATE", "UPDATE", "RELEASE_NOW", "DELETE"]),
    id: z.number().optional(),
    position: z.number().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    releaseAt: z.string().nullable().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  let body: z.infer<typeof hintMutationSchema>;
  try {
    body = hintMutationSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  }

  if (body.action === "RELEASE_NOW" && body.id) {
    const hint = mockDB.hints.find((h) => h.id === body.id);
    if (hint) {
      hint.released = true;
      hint.released_at = new Date().toISOString();
    }
    return NextResponse.json({ success: true, hint });
  }

  if (body.action === "CREATE" && body.title && body.body) {
    const newHint = {
      id: Date.now(),
      position: body.position || mockDB.hints.length + 1,
      title: body.title,
      body: body.body,
      release_at: body.releaseAt || null,
      released: false,
      released_at: null,
    };
    mockDB.hints.push(newHint);
    return NextResponse.json({ success: true, hint: newHint });
  }

  if (body.action === "DELETE" && body.id) {
    mockDB.hints = mockDB.hints.filter((h) => h.id !== body.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: { code: "UNHANDLED_ACTION" } }, { status: 400 });
}
