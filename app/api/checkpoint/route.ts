import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTeamSession } from "@/lib/auth";
import { validateCSRF } from "@/lib/csrf";
import { hashWithScrypt, timingSafeEqualString } from "@/lib/hash";
import { eventConfig } from "@/config/event.config";

const checkpointSchema = z
  .object({
    stageId: z.enum(["stage1", "stage2", "stage3", "stage4", "stage5"]),
    answer: z.string().min(1).max(50),
  })
  .strict();

// Pre-configured cryptographic salts & hashes for the 5 checkpoint stages
const CHECKPOINT_DEFINITIONS: Record<string, { salt: string; hash: string }> = {
  stage1: {
    salt: "STAGE1_SALT_16B",
    hash: hashWithScrypt("3A:8F", "STAGE1_SALT_16B"),
  },
  stage2: {
    salt: "STAGE2_SALT_16B",
    hash: hashWithScrypt("192.168.4.112", "STAGE2_SALT_16B"),
  },
  stage3: {
    salt: "STAGE3_SALT_16B",
    hash: hashWithScrypt("B-8821", "STAGE3_SALT_16B"),
  },
  stage4: {
    salt: "STAGE4_SALT_16B",
    hash: hashWithScrypt("exfil_dump.py", "STAGE4_SALT_16B"),
  },
  stage5: {
    salt: "STAGE5_SALT_16B",
    hash: hashWithScrypt("7", "STAGE5_SALT_16B"),
  },
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
      { error: { code: "INVALID_REQUEST", message: "Invalid checkpoint submission format." } },
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
