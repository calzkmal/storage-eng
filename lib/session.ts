import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

// The learner id is the only thing standing between a stranger and someone's
// history, so it lives in a signed HttpOnly cookie instead of in the page.
// Script cannot read it, it never reaches a URL, and it cannot be forged.

const COOKIE = "ep_learner";
const MAX_AGE_SEC = 60 * 60 * 24 * 365;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string | null {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

/** Without a secret the app still runs; nothing is stored against a learner. */
export function hasSessionSecret(): boolean {
  return secret() !== null;
}

function sign(id: string, key: string): string {
  return createHmac("sha256", key).update(id).digest("base64url");
}

/** The learner id, or null when the cookie is missing, malformed or unsigned. */
export function readLearnerId(req: NextRequest): string | null {
  const key = secret();
  const raw = req.cookies.get(COOKIE)?.value;
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearLearnerCookie(res: NextResponse): void {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
