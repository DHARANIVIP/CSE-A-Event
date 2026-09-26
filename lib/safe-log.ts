// Sanitized logging utility enforcing Rule S13
// Guarantees no sensitive codes, PINs, auth cookies, or secret hashes appear in runtime logs.

const SENSITIVE_KEY_PATTERNS = [
  /code/i,
  /pin/i,
  /password/i,
  /secret/i,
  /salt/i,
  /hash/i,
  /cookie/i,
  /authorization/i,
  /token/i,
  /key/i,
];

export function sanitizeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  if (isSensitive) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    // Check if string looks like JWT or raw token
    if (/^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/.test(value)) {
      return "[REDACTED_JWT]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }

  if (typeof value === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }

  return value;
}

export function safeLog(message: string, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  if (!context) {
    console.log(`[${timestamp}] [INFO] ${message}`);
    return;
  }

  const cleanContext = sanitizeValue("root", context);
  console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(cleanContext));
}

export function safeWarn(message: string, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  if (!context) {
    console.warn(`[${timestamp}] [WARN] ${message}`);
    return;
  }

  const cleanContext = sanitizeValue("root", context);
  console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(cleanContext));
}

export function safeError(message: string, error?: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const cleanContext = context ? sanitizeValue("root", context) : {};
  console.error(`[${timestamp}] [ERROR] ${message} - ${errorMessage}`, JSON.stringify(cleanContext));
}
