// CSRF and Origin Validation Helper enforcing Rule S9
// Requires Content-Type application/json and validates Origin header on mutating routes.

import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";

export function validateCSRF(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const contentType = req.headers.get("content-type") || "";

  // Verify Content-Type is application/json
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be application/json",
        },
      },
      { status: 415 }
    );
  }

  // If Origin header is provided, match against expected origin
  if (origin) {
    try {
      const parsedOrigin = new URL(origin).origin;
      const expectedOrigin = new URL(env.SITE_ORIGIN).origin;
      const hostHeader = req.headers.get("host");

      const isSameHost = hostHeader && parsedOrigin.includes(hostHeader);
      const isExpected = parsedOrigin === expectedOrigin;

      if (!isSameHost && !isExpected && env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN_ORIGIN",
              message: "Cross-origin requests are forbidden.",
            },
          },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "MALFORMED_ORIGIN",
            message: "Malformed request origin.",
          },
        },
        { status: 400 }
      );
    }
  }

  return null;
}
