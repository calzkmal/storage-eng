import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

// The learner id is the only thing standing between a stranger and someone's
// history, so it lives in a signed HttpOnly cookie instead of in the page.
// Script cannot read it, it never reaches a URL, and it cannot be forged.

// __Host- is enforced by the browser: it refuses the name if a Domain attribute
// is present, so no sibling subdomain can shadow it. It requires Secure, which
// plain-http localhost cannot offer, so development keeps the bare name.
const PREFIXED = process.env.NODE_ENV === "production";
const COOKIE = PREFIXED ? "__Host-ep_learner" : "ep_learner";
const LEGACY_COOKIE = "ep_learner";
const MAX_AGE_SEC = 60 * 60 * 24 * 365;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIN_SECRET_LENGTH = 32;
/** Fewer distinct characters than this is a placeholder or a typo, not a key. */
const MIN_SECRET_VARIETY = 12;

function secret(): string | null {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < MIN_SECRET_LENGTH) return null;
  if (new Set(value).size < MIN_SECRET_VARIETY) return null;
  return value;
}

/** Without a secret the app still runs; nothing is stored against a learner. */
export function hasSessionSecret(): boolean {
  return secret() !== null;
}

// Refuse to serve real production without one, rather than quietly recording
// nothing forever. Previews and local development keep the graceful path.
if (process.env.VERCEL_ENV === "production" && !secret()) {
  throw new Error(
    "SESSION_SECRET is missing or too weak. Generate one with: " +
      `node -e "console.log(require('crypto').randomBytes(${MIN_SECRET_LENGTH}).toString('base64url'))"`,
  );
}

function sign(id: string, key: string): string {
  return createHmac("sha256", key).update(id).digest("base64url");
}

/** The learner id, or null when the cookie is missing, malformed or unsigned. */
export function readLearnerId(req: NextRequest): string | null {
  const key = secret();
  // The legacy name is read for one release, so existing devices are not logged out.
  const raw = req.cookies.get(COOKIE)?.value ?? req.cookies.get(LEGACY_COOKIE)?.value;
  if (!key || !raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  if (!UUID.test(id)) return null;

  const got = Buffer.from(raw.slice(dot + 1));
  const want = Buffer.from(sign(id, key));
  return got.length === want.length && timingSafeEqual(got, want) ? id : null;
}

export function newLearnerId(): string {
  return randomUUID();
}

export function setLearnerCookie(res: NextResponse, id: string): void {
  const key = secret();
  if (!key) return;
  res.cookies.set(COOKIE, `${id}.${sign(id, key)}`, {
    httpOnly: true,
    // __Host- is only honoured with Secure and Path=/.
    secure: PREFIXED,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearLearnerCookie(res: NextResponse): void {
  // Clear both names: a returning device may still hold the unprefixed cookie.
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: PREFIXED, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(LEGACY_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
