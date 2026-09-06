/**
 * Compare the configured free-model list with what OpenRouter currently offers (spec §7.2).
 * Free models rotate; run this periodically and update lib/ai/models.ts.
 *
 *   npm run check-models
 */
import { FREE_MODELS } from "../lib/ai/models";
import { listFreeModelIds } from "../lib/ai/openrouter";

async function main() {
  const live = new Set(await listFreeModelIds());
  console.log(`OpenRouter currently lists ${live.size} models ending in ":free".\n`);

  let missing = 0;
  for (const id of FREE_MODELS) {
    const ok = live.has(id);
    if (!ok) missing++;
    console.log(`${ok ? "✓" : "✗"} ${id}${ok ? "" : "   <- no longer available"}`);
  }

  if (missing) {
    console.log(`\n${missing} configured model(s) are gone. Candidates you could add:`);
    for (const id of [...live].sort()) {
      if (!FREE_MODELS.includes(id)) console.log(`   ${id}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\nAll configured models are available.");
  }
}

main().catch((err) => {
  console.error("check-models failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
