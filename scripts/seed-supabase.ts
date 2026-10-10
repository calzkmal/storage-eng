// Load the lesson files into Supabase. Idempotent; --force re-syncs seed sets.
import { isSubject } from "../lib/subjects";
import { isDbConfigured, seedDatabase } from "../lib/content";

async function main() {
  if (!isDbConfigured()) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example).");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const subjectArg = process.argv.find(a => a.startsWith("--subject="))?.slice(10);
  if (subjectArg !== undefined && !isSubject(subjectArg)) throw new Error("Unknown --subject; use english, matematika, or bahasa-indonesia");
  const result = await seedDatabase(force, subjectArg);
  console.log(
    `Seeded ${result.lessons} lessons; ${result.createdSets} new seed set(s) created` +
      (force ? "; existing seed sets re-synced from the JSON files." : "."),
  );
}

main().catch((err) => {
  console.error("seed-supabase failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
