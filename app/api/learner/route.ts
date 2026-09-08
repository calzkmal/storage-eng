import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { badRequest, refuseCrossSite } from "@/lib/http";
import { checkRateLimit, getClientKey, WRITE_LIMIT } from "@/lib/rateLimit";
import { clearLearnerCookie, hasSessionSecret, newLearnerId, readLearnerId, setLearnerCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ name: z.string().trim().min(1).max(40) });

/**
 * Creates or renames the anonymous profile. The id is minted here and returned
 * only as a signed HttpOnly cookie, so a caller cannot name the profile it writes to.
 */
export async function POST(req: NextRequest) {
  const refused = refuseCrossSite(req);
  if (refused) return refused;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return badRequest("A name is required");

  const client = getClientKey(req);
  if (!client) return badRequest("Could not identify the client");
  const rl = await checkRateLimit(`write:${client}`, WRITE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // Without a secret the cookie cannot be trusted, so nothing is stored.
  if (!hasSessionSecret()) return NextResponse.json({ ok: true, stored: false });

  const id = readLearnerId(req) ?? newLearnerId();
  const db = getDb();
  if (db) {
    const { error } = await db
      .from("learners")
      .upsert({ id, name: parsed.data.name, last_seen_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) {
      console.error("[learner] upsert failed:", error.message);
      return NextResponse.json({ error: "Could not save the profile" }, { status: 500 });
    }
  }

  // Set the cookie even without a database, so the identity stays stable.
  const res = NextResponse.json({ ok: true, stored: Boolean(db) });
  setLearnerCookie(res, id);
  return res;
}

/** Erases the profile and everything filed under it. Only its own cookie can do this. */
export async function DELETE(req: NextRequest) {
  const refused = refuseCrossSite(req);
  if (refused) return refused;

  const client = getClientKey(req);
  if (!client) return badRequest("Could not identify the client");
  const rl = await checkRateLimit(`write:${client}`, WRITE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const id = readLearnerId(req);
  const db = getDb();
  if (id && db) {
    for (const table of ["attempts", "learner_sets"] as const) {
      const { error } = await db.from(table).delete().eq("learner_id", id);
      if (error) {
        console.error(`[learner] delete from ${table} failed:`, error.message);
        return NextResponse.json({ error: "Could not delete the profile" }, { status: 500 });
      }
    }
    const { error } = await db.from("learners").delete().eq("id", id);
    if (error) {
      console.error("[learner] delete failed:", error.message);
      return NextResponse.json({ error: "Could not delete the profile" }, { status: 500 });
    }
  }

  const res = NextResponse.json({ ok: true });
  clearLearnerCookie(res);
  return res;
}
