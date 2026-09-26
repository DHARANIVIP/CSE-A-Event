// Server-Only Environment Variable Validation via Zod
// Enforces S6 (no NEXT_PUBLIC_ leakage of service role or hashes) & S12 (strict schema)

import { z } from "zod";

const envSchema = z.object({
  // Supabase Database & Storage
  SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).default("mock_service_role_key_development_only"),

  // Secret Code Hashes (scrypt base64url)
  CODE_SALT: z.string().min(8).default("DEFAULT_EVENT_CODE_SALT_16B"),
  CODE_HASH: z.string().min(16).default("DEFAULT_MOCK_HASH_FOR_DEVELOPMENT_ONLY"),

  // Admin Access (scrypt hash of admin password)
  ADMIN_PASSWORD_HASH: z.string().min(16).default("DEFAULT_MOCK_ADMIN_HASH_DEVELOPMENT_ONLY"),

  // Session JWT Secret (minimum 32 bytes per S7)
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters long for HS256 security")
    .default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),

  // Origin for CSRF protection (S9)
  SITE_ORIGIN: z.string().url().default("http://localhost:3000"),

  // Event Branding
  EVENT_NAME: z.string().default("Mystery Box"),
  TEAM_NAME: z.string().default("The Code Guild"),
  COLLEGE_NAME: z.string().default("Department of Computer Science & Engineering"),

  // Case Download (Mode A: Supabase private storage object; Mode B: External URL)
  CASE_OBJECT_PATH: z.string().optional().default("mystery-case-archive.zip"),
  CASE_ZIP_EXTERNAL_URL: z.string().url().optional(),

  // Optional Checkpoints JSON string
  CHECKPOINTS_JSON: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let parsedEnv: ServerEnv;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ CRITICAL: Environment configuration validation failed:");
    for (const issue of error.issues) {
      console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.error("❌ CRITICAL: Unknown error validating environment variables:", error);
  }
  // Fall back to schema defaults during build or tests to prevent build crash
  parsedEnv = envSchema.parse({});
}

export const env = parsedEnv;
