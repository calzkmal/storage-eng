// Load the lesson files into Supabase. Idempotent; --force re-syncs seed sets.
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
