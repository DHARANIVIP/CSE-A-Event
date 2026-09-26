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
      leader_name?: string;
      leader_reg_no?: string;
      leader_email?: string;
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
      "DTX-01",
      {
        id: "DTX-01",
        name: "NEXA SQUAD",
        leader_name: "Sowmya.P",
        leader_reg_no: "73152513160",
        leader_email: "sowmyapcse25_29@ksrce.ac.in",
        members: ["Sowmya.P (73152513160)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:Ybo7nUFUIlZzmTLtgkbKSUi4wEBUZQjjrDvETMZFDV4",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-02",
      {
        id: "DTX-02",
        name: "HackHive",
        leader_name: "RAMASHREE V",
        leader_reg_no: "73152513134",
        leader_email: "ramashreevcse25_29@ksrce.ac.in",
        members: ["RAMASHREE V (73152513134)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:bBTjOFsfwIh5WTKeMwbP_ETwRggAT8Z20JXvnEk0Hho",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-03",
      {
        id: "DTX-03",
        name: "Code Titens",
        leader_name: "Senthilkumar E",
        leader_reg_no: "73152513153",
        leader_email: "senthilkumarecse25_29@ksrce.ac.in",
        members: ["Senthilkumar E (73152513153)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:ZXEe0T4OEPlGhw8R4BMhyqtUbUPHeR0blnzACoBM5mc",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-04",
      {
        id: "DTX-04",
        name: "TechTrace",
        leader_name: "Udhayasri S",
        leader_reg_no: "73152513177",
        leader_email: "udhayasriscse25_29@ksrce.ac.in",
        members: ["Udhayasri S (73152513177)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:_LI0d1-SfYK2IXySikxaHKtXCg4LfosoHvryhYo00gE",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-05",
      {
        id: "DTX-05",
        name: "Straw hat coders",
        leader_name: "Gukulnath.N",
        leader_reg_no: "73152513045",
        leader_email: "gukulnathn25_26@ksrce.ac.in",
        members: ["Gukulnath.N (73152513045)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:NINNNQ2UDg3ye0g-W1BnuB2sI5N2WUUt3Jw4uNn2rH8",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-06",
      {
        id: "DTX-06",
        name: "Eagle Blades",
        leader_name: "RITHISH",
        leader_reg_no: "73152513141",
        leader_email: "rithishgcse25_29@ksrce.ac.in",
        members: ["RITHISH (73152513141)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:6VGjr4iT09TD-fFDf9mUcV7SOJXNZqGFBijDTQ2nlI4",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-07",
      {
        id: "DTX-07",
        name: "Data defenders",
        leader_name: "Praveen kumar S",
        leader_reg_no: "73152513128",
        leader_email: "praveenkumarscse25_29@ksrce.ac.in",
        members: ["Praveen kumar S (73152513128)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:mOpBDeGL0Pq4AaL_wIHdi3_e8J9jwMziWhabXr8w2cQ",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-08",
      {
        id: "DTX-08",
        name: "Vision Vanguard",
        leader_name: "Subikshan",
        leader_reg_no: "73152513165",
        leader_email: "subikshanscse25_29@ksrce.ac.in",
        members: ["Subikshan (73152513165)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:43yoVZ59HapCFENkcKSYZQezJr5WDVu7EU8hQysyGpg",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-09",
      {
        id: "DTX-09",
        name: "Tech Innovators",
        leader_name: "Kaviya E",
        leader_reg_no: "73152513072",
        leader_email: "kaviyaecse25_29@ksrce.ac.in",
        members: ["Kaviya E (73152513072)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:u2QmAiZii6oJZJYW1VeXm5n2Zrgf00x3RJsyuKZ0VKM",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-10",
      {
        id: "DTX-10",
        name: "The  Astros",
        leader_name: "Kavya Shree.P",
        leader_reg_no: "73152513074",
        leader_email: "kavyashreepcse25_29@ksrce.ac.in",
        members: ["Kavya Shree.P (73152513074)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:0bFPj0HlxGWV-k8BzA4hAMDEtLzVxobJJ7fYWqYpaoM",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-11",
      {
        id: "DTX-11",
        name: "Brain Spark",
        leader_name: "Prasanna K",
        leader_reg_no: "73152513506",
        leader_email: "prasannakcse2529@ksrce.ac.in",
        members: ["Prasanna K (73152513506)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:FXEc_QZPFjF-SpzfPQTgeqSL7q-QnUyIGkWYkuzXKMo",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-12",
      {
        id: "DTX-12",
        name: "POWER HOUSE",
        leader_name: "Poovendhan S",
        leader_reg_no: "73152513123",
        leader_email: "poovendhanscse25_29@ksrce.ac.in",
        members: ["Poovendhan S (73152513123)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:TfHd6d6Ld2WjAd3veM255SLDiAmCs6Kn5Y_bVhg3df0",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-13",
      {
        id: "DTX-13",
        name: "Future model",
        leader_name: "Niranjan T",
        leader_reg_no: "73152513113",
        leader_email: "niranjantcse25_29@ksrce.ac.in",
        members: ["Niranjan T (73152513113)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:G1VRVzysCjjQ1mCRUmv8YOBvE9J8eKWrVMZ-hFuFZKU",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-14",
      {
        id: "DTX-14",
        name: "Teen Wolfes",
        leader_name: "Bathrinath",
        leader_reg_no: "73152513015",
        leader_email: "bathrinathmcse25_29@ksrce.ac.in",
        members: ["Bathrinath (73152513015)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:i9FUGZZIZ8Weu98Igctv1MG_aCcsiN8uNCar08Ti_vM",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-15",
      {
        id: "DTX-15",
        name: "QUANTUM CODERS",
        leader_name: "BALAJI.P",
        leader_reg_no: "73152513013",
        leader_email: "balajipcse25_29@ksrce.ac.in",
        members: ["BALAJI.P (73152513013)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:ciggQLLlJyLsnzA9n61tOP12aiFuiWl800OBZDAsUFo",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-16",
      {
        id: "DTX-16",
        name: "Tricky Trio's",
        leader_name: "Kirthishkumar S",
        leader_reg_no: "73152513079",
        leader_email: "kirthishkumarscse25_29@ksrce.ac.in",
        members: ["Kirthishkumar S (73152513079)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:DuMYRswhfdXuEDQ7VmHJjxAzJoUcWvJX96t4iBpvrbo",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-17",
      {
        id: "DTX-17",
        name: "Tech Titans",
        leader_name: "Nithuna M",
        leader_reg_no: "73152513117",
        leader_email: "nithunamcse25_29@ksrce.ac.in",
        members: ["Nithuna M (73152513117)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:Ht6UXApX5cPShiRhIVIRPbgP8XJNGOtTLQ8HiVDxKFs",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-18",
      {
        id: "DTX-18",
        name: "Fighters",
        leader_name: "Santhosh S",
        leader_reg_no: "73152513148",
        leader_email: "santhoshscse25_29@ksrce.ac.in",
        members: ["Santhosh S (73152513148)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:eJZc-qFUAsd39WfgUQaFdXmKoYPifI3pynqSUJWAAAw",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-19",
      {
        id: "DTX-19",
        name: "SparkSync",
        leader_name: "Mohana S",
        leader_reg_no: "73152513100",
        leader_email: "mohanascse25_29@ksrce.ac.in",
        members: ["Mohana S (73152513100)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:gRAXPjD6v92ALWaukjFY11167S5ObzUYSX_i2PTYi0Q",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-20",
      {
        id: "DTX-20",
        name: "AI Avengers",
        leader_name: "Nirmal Raj S",
        leader_reg_no: "73152513114",
        leader_email: "nirmalrajscse25_29@ksrce.ac.in",
        members: ["Nirmal Raj S (73152513114)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:o9oxl50TGc4yCPP8wDNmwkPwvUwyViYMK-KQ73dj7ac",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-21",
      {
        id: "DTX-21",
        name: "TEAM HACK",
        leader_name: "Santhosh D",
        leader_reg_no: "73152513149",
        leader_email: "santhoshdcse25_29@ksrce.ac.in",
        members: ["Santhosh D (73152513149)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:gHeVrwtNxEB7l5X2GBEHoTfeweNl0EL6BxrJxrqUc-o",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-22",
      {
        id: "DTX-22",
        name: "TEAM BABY",
        leader_name: "Kesavan K",
        leader_reg_no: "73152513077",
        leader_email: "kesavankcse25_29@ksrce.ac.in",
        members: ["Kesavan K (73152513077)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:YtbhbYpsYy1FxvUSFBVQl1CwqMk0iCuL_iyyorS4L80",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-23",
      {
        id: "DTX-23",
        name: "Debuggers",
        leader_name: "Kishore A",
        leader_reg_no: "73152513082",
        leader_email: "kishoreacse25_29@ksrce.ac.in",
        members: ["Kishore A (73152513082)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:gN3c7tioG1mC3p4AmitvE9GExwm9dk7vKbEmAcOyBeI",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-24",
      {
        id: "DTX-24",
        name: "Binary Builders",
        leader_name: "Nishanth B.R",
        leader_reg_no: "73152513115",
        leader_email: "nishanthbrcse25_29@ksrce.ac.in",
        members: ["Nishanth B.R (73152513115)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:lyQCkhYIL1zFpEs-_197HiD7NCoeE5XhY1OxtL4CNmA",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
    [
      "DTX-25",
      {
        id: "DTX-25",
        name: "TEAM INNOVATORS",
        leader_name: "Deepan.M",
        leader_reg_no: "73152513028",
        leader_email: "deepanmcse25_29@ksrce.ac.in",
        members: ["Deepan.M (73152513028)"],
        pin_hash: "TEST_SALT_16_BYTES_ABC:4jKvvFbB6GcoJfHLL7fDetlKkeDgVWYCPadNNcp7Jco",
        disabled: false,
        created_at: new Date().toISOString(),
      },
    ],
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
