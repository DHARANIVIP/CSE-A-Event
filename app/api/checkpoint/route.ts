import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { hashWithScrypt, timingSafeEqualString } from "@/lib/hash";
import { eventConfig } from "@/config/event.config";

const checkpointSchema = z
  .object({
    stageId: z.string().min(1).max(20),
    answer: z.string().min(1).max(50),
  })
  .strict();

// Cryptographic salts & hashes for all 10 questions (q1 - q10)
const CHECKPOINT_DEFINITIONS: Record<string, { salt: string; hash: string }> = {
  q1: { salt: "Q1_SALT_16B", hash: hashWithScrypt("3A:8F", "Q1_SALT_16B") },
  stage1: { salt: "Q1_SALT_16B", hash: hashWithScrypt("3A:8F", "Q1_SALT_16B") },
  q2: { salt: "Q2_SALT_16B", hash: hashWithScrypt("192.168.4.112", "Q2_SALT_16B") },
  stage2: { salt: "Q2_SALT_16B", hash: hashWithScrypt("192.168.4.112", "Q2_SALT_16B") },
  q3: { salt: "Q3_SALT_16B", hash: hashWithScrypt("B-8821", "Q3_SALT_16B") },
  stage3: { salt: "Q3_SALT_16B", hash: hashWithScrypt("B-8821", "Q3_SALT_16B") },
  q4: { salt: "Q4_SALT_16B", hash: hashWithScrypt("EXFIL_DUMP.PY", "Q4_SALT_16B") },
  stage4: { salt: "Q4_SALT_16B", hash: hashWithScrypt("EXFIL_DUMP.PY", "Q4_SALT_16B") },
  q5: { salt: "Q5_SALT_16B", hash: hashWithScrypt("7", "Q5_SALT_16B") },
  stage5: { salt: "Q5_SALT_16B", hash: hashWithScrypt("7", "Q5_SALT_16B") },
  q6: { salt: "Q6_SALT_16B", hash: hashWithScrypt("4", "Q6_SALT_16B") },
  q7: { salt: "Q7_SALT_16B", hash: hashWithScrypt("8", "Q7_SALT_16B") },
  q8: { salt: "Q8_SALT_16B", hash: hashWithScrypt("ROOT", "Q8_SALT_16B") },
  q9: { salt: "Q9_SALT_16B", hash: hashWithScrypt("9", "Q9_SALT_16B") },
  q10: { salt: "Q10_SALT_16B", hash: hashWithScrypt("X", "Q10_SALT_16B") },
};

export async function POST(req: NextRequest) {
  if (!eventConfig.features.checkpointsEnabled) {
    return NextResponse.json(
      { error: { code: "DISABLED", message: "Checkpoints are disabled." } },
      { status: 403 }
    );
  }

  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  const session = await getTeamSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Team login required." } },
      { status: 401 }
    );
  }

  let body: z.infer<typeof checkpointSchema>;
  try {
    const raw = await req.json();
    body = checkpointSchema.parse(raw);
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid question answer submission format." } },
      { status: 400 }
    );
  }

  const def = CHECKPOINT_DEFINITIONS[body.stageId];
  if (!def) {
    return NextResponse.json({ correct: false }, { status: 200 });
  }

  const normalized = body.answer.trim().toUpperCase();
  const computed = hashWithScrypt(normalized, def.salt);
  const correct = timingSafeEqualString(computed, def.hash);

  return NextResponse.json({
    correct,
    stageId: body.stageId,
  });
}
