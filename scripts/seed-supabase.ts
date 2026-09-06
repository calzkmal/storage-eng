/**
 * Load the six lesson files into Supabase (tables from supabase/migrations).
 * Idempotent: lessons are upserted, and a seed set (version 1) is created only
 * when missing. Pass --force to overwrite the seed sets' exercises from the
 * JSON files after editing them.
 *
 *   npm run seed:supabase
 *   npm run seed:supabase -- --force
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 */
import { isDbConfigured, seedDatabase } from "../lib/content";

async function main() {
  if (!isDbConfigured()) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example).");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const result = await seedDatabase(force);
  console.log(
    `Seeded ${result.lessons} lessons; ${result.createdSets} new seed set(s) created` +
      (force ? "; existing seed sets re-synced from the JSON files." : "."),
  );
}

main().catch((err) => {
  console.error("seed-supabase failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
