// Server Time & Event Status State Machine
// Authoritative single source of truth per Section 9.2 and 10.1

export type EventStatus = "not_started" | "live" | "ended" | "paused";

export interface EventTimingState {
  startAt: string | null; // ISO string (UTC)
  endAt: string | null; // ISO string (UTC)
  forceStatus: "live" | "ended" | "paused" | null;
  caseReleased: boolean;
  caseSha256?: string | null;
}

export interface ComputedStatus {
  status: EventStatus;
  serverNow: string; // ISO string (UTC)
  isLive: boolean;
  canSubmit: boolean;
  canDownloadCase: boolean;
  remainingSeconds: number; // 0 if ended/not started
  secondsUntilStart: number; // 0 if already started
}

/**
 * Computes official event status according to authoritative server time and configuration.
 * status = force_status || (now < start_at ? 'not_started' : now <= end_at ? 'live' : 'ended')
 */
export function calculateEventStatus(
  state: EventTimingState,
  serverDate: Date = new Date()
): ComputedStatus {
  const serverNowIso = serverDate.toISOString();
  const nowMs = serverDate.getTime();

  const startMs = state.startAt ? new Date(state.startAt).getTime() : null;
  const endMs = state.endAt ? new Date(state.endAt).getTime() : null;

  let status: EventStatus;

  if (state.forceStatus) {
    status = state.forceStatus;
  } else if (startMs !== null && nowMs < startMs) {
    status = "not_started";
  } else if (endMs !== null && nowMs > endMs) {
    status = "ended";
  } else if (startMs !== null) {
    status = "live";
  } else {
    // If no start time is defined yet, event is not started
    status = "not_started";
  }

  const isLive = status === "live";
  const canSubmit = isLive;
  const canDownloadCase = Boolean(state.caseReleased && (isLive || status === "ended"));

  let remainingSeconds = 0;
  if (status === "live" && endMs !== null) {
    remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  }

  let secondsUntilStart = 0;
  if (status === "not_started" && startMs !== null) {
    secondsUntilStart = Math.max(0, Math.floor((startMs - nowMs) / 1000));
  }

  return {
    status,
    serverNow: serverNowIso,
    isLive,
    canSubmit,
    canDownloadCase,
    remainingSeconds,
    secondsUntilStart,
  };
}

/**
 * Formats a date/timestamp in Indian Standard Time (Asia/Kolkata).
 */
export function formatInIST(
  dateInput: string | number | Date,
  options: {
    includeSeconds?: boolean;
    includeMillis?: boolean;
    timeOnly?: boolean;
  } = {}
): string {
  const date = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) {
    return "--:--:--";
  }

  if (options.includeMillis) {
    const base = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
    const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
    return `${base}.${ms} IST`;
  }

  if (options.timeOnly) {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: options.includeSeconds !== false ? "2-digit" : undefined,
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: options.includeSeconds !== false ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Formats seconds into HH:MM:SS or MM:SS duration display.
 */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
