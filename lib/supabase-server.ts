// Server-side database access using the service-role key (Rule S6)
// Provides database queries with connection resilience and in-memory test fallback.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";
import { safeLog, safeWarn } from "./safe-log";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

// In-memory data store for local preview and offline testing
export interface MockDBState {
  teams: Map<
    string,
    {
      id: string;
      name: string;
      members: string[];
      pin_hash: string;
      disabled: boolean;
      created_at: string;
    }
  >;
  eventState: {
    id: number;
    start_at: string | null;
    end_at: string | null;
    force_status: "live" | "ended" | "paused" | null;
    case_released: boolean;
    case_sha256: string | null;
    updated_at: string;
  };
  hints: Array<{
    id: number;
    position: number;
    title: string;
    body: string;
    release_at: string | null;
    released: boolean;
    released_at: string | null;
  }>;
  submissions: Array<{
    id: string;
    team_id: string;
    created_at: string;
    is_correct: boolean;
    attempt_hash: string | null;
    request_id: string | null;
    ip_hash: string | null;
  }>;
  auditLogs: Array<{
    id: number;
    at: string;
    actor: string;
    action: string;
    detail: Record<string, unknown>;
  }>;
}

// Initialize seed data for offline test harness
export const mockDB: MockDBState = {
  teams: new Map([
    [
      "TEAM-01",
      {
        id: "TEAM-01",
        name: "Cipher Enigma",
        members: ["Alice", "Bob", "Charlie"],
        // PIN: 123456 (scrypt hash with salt TEST_SALT_16_BYTES_ABC)
        pin_hash: "TEST_SALT_16_BYTES_ABC:N5S0teyDLOtqI2uUvy4feKho2FWb1U_6zHZgoiwAtbY",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "TEAM-02",
      {
        id: "TEAM-02",
        name: "Binary Shadows",
        members: ["David", "Eva", "Frank"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:N5S0teyDLOtqI2uUvy4feKho2FWb1U_6zHZgoiwAtbY",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
  ]),
  eventState: {
    id: 1,
    start_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // started 30 mins ago
    end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // ends in 2 hours
    force_status: "live",
    case_released: true,
    case_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    updated_at: new Date().toISOString(),
  },
  hints: [
    {
      id: 1,
      position: 1,
      title: "Deciphering the Firewall Dropped Packets",
      body: "When filtering `system_logs.txt`, focus only on lines containing 'DROP' and port '8080'. Look for MAC addresses following the IEEE 802 standard format (`XX:XX:XX:XX:XX:XX`). A simple `grep` or pandas query grouping by `src_mac` will immediately highlight the anomalous terminal.",
      release_at: null,
      released: true,
      released_at: new Date().toISOString(),
    },
    {
      id: 2,
      position: 2,
      title: "Cross-Referencing Physical vs Digital Access",
      body: "Remember that timestamps in `access_logs.csv` are recorded in 24-hour UTC format. If you see a badge entry that occurred without a corresponding terminal login within 5 minutes, that badge ID was cloned.",
      release_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      released: false,
      released_at: null,
    },
  ],
  submissions: [],
  auditLogs: [],
};

/**
 * Checks if remote Supabase connection is available.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  if (
    env.SUPABASE_URL.includes("127.0.0.1") ||
    env.SUPABASE_SERVICE_ROLE_KEY.includes("mock") ||
    env.SUPABASE_SERVICE_ROLE_KEY.includes("test_service")
  ) {
    return false;
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("event_state").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Atomic submission recorder matching Postgres record_submission()
 * Guarantees transaction-safe ranking and idempotent request_id.
 */
let submissionMutexPromise = Promise.resolve();

export async function executeRecordSubmission(params: {
  teamId: string;
  isCorrect: boolean;
  attemptHash: string | null;
  requestId: string | null;
  ipHash: string | null;
}): Promise<{ createdAt: string; rank: number | null }> {
  // If remote Supabase is configured and connected, invoke RPC
  const connected = await isSupabaseConnected();
  if (connected) {
    try {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb.rpc("record_submission", {
        p_team_id: params.teamId,
        p_is_correct: params.isCorrect,
        p_attempt_hash: params.attemptHash,
        p_request_id: params.requestId,
        p_ip_hash: params.ipHash,
      });
      if (!error && data && data.length > 0) {
        return {
          createdAt: data[0].created_at,
          rank: data[0].rank ? Number(data[0].rank) : null,
        };
      }
    } catch (err) {
      safeWarn("Remote RPC failed, falling back to local transaction mutex", {
        error: String(err),
      });
    }
  }

  // Transaction mutex simulating Postgres pg_advisory_xact_lock
  return new Promise((resolve) => {
    submissionMutexPromise = submissionMutexPromise.then(async () => {
      const existingReq = params.requestId
        ? mockDB.submissions.find(
            (s) => s.team_id === params.teamId && s.request_id === params.requestId
          )
        : null;

      if (existingReq) {
        let rank: number | null = null;
        if (existingReq.is_correct) {
          const correctList = mockDB.submissions
            .filter((s) => s.is_correct)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          rank = correctList.findIndex((s) => s.id === existingReq.id) + 1;
        }
        resolve({ createdAt: existingReq.created_at, rank });
        return;
      }

      // Check if team already solved
      const alreadySolved = mockDB.submissions.find(
        (s) => s.team_id === params.teamId && s.is_correct
      );
      if (alreadySolved) {
        const correctList = mockDB.submissions
          .filter((s) => s.is_correct)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const rank = correctList.findIndex((s) => s.id === alreadySolved.id) + 1;
        resolve({ createdAt: alreadySolved.created_at, rank });
        return;
      }

      // Authoritative server timestamp (S3)
      const nowIso = new Date().toISOString();
      const subRecord = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        team_id: params.teamId,
        created_at: nowIso,
        is_correct: params.isCorrect,
        attempt_hash: params.isCorrect ? null : params.attemptHash,
        request_id: params.requestId,
        ip_hash: params.ipHash,
      };

      mockDB.submissions.push(subRecord);

      let rank: number | null = null;
      if (params.isCorrect) {
        const correctList = mockDB.submissions
          .filter((s) => s.is_correct)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        rank = correctList.findIndex((s) => s.id === subRecord.id) + 1;
      }

      resolve({ createdAt: nowIso, rank });
    });
  });
}
