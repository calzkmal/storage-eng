import { NextResponse, type NextRequest } from "next/server";

// Every route here is anonymous and public, so the guards are about shape and
// provenance rather than identity.

/**
 * Refuses cross-site posts. A form-driven CSRF cannot send application/json
 * without a preflight, and browsers mark same-origin requests with Sec-Fetch-Site.
 * Returns the refusal, or null when the request may proceed.
 */
export function refuseCrossSite(req: NextRequest): NextResponse | null {
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!type.startsWith("application/json")) {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }

  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === req.headers.get("host");
    } catch {
      sameHost = false;
    }
    if (!sameHost) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }

  return null;
}

export const badRequest = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
