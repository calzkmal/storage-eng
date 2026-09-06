# English Practice

A mobile-first web app for practising beginner English grammar. One exercise per screen, Check, instant feedback, Continue. No XP, streaks, hearts, leaderboards, or accounts.

## Run it

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY (optional)
npm run dev
```

Open http://localhost:3000. Without an API key, every local exercise still works and the AI-graded ones show the model-answer fallback.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Validates content (`prebuild`), then builds |
| `npm run validate` | Checks every `content/lessons/*.json` against the schema |
| `npm run check-models` | Compares `lib/ai/models.ts` with OpenRouter's live `:free` list |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Structure

```
app/                       pages + /api/ai/grade route handler
components/                TopBar, BottomBar, FeedbackPanel, LessonRunner, exercises/*
content/lessons/*.json     the six lessons (static, validated)
lib/schema.ts              zod schema + TS types for lessons
lib/content.ts             server-side loader
lib/grading.ts             local normalise / compare
lib/ai/                    OpenRouter wrapper, model list, prompt, LRU cache, rate limit
scripts/                   validate-content.ts, check-models.ts
```

## AI grading

`POST /api/ai/grade` proxies OpenRouter. The key lives only in server env. The route:

1. validates the body with zod (answers over 300 chars are rejected),
2. checks an in-memory LRU keyed by `sha256(exerciseId + normalized answer)`,
3. rate-limits 30 requests / 10 min per IP (429 on exceed),
4. calls OpenRouter with the `models` priority list and a 9 s timeout,
5. parses JSON from the reply, retrying once with a "JSON only" nudge,
6. caches real results and logs `modelUsed`.

Only `free_write` (always) and `flip_sentence` (when no accepted answer matches locally) hit the AI.

OpenRouter accepts at most 3 entries in `models` per request, so the wrapper sends the priority list in chunks of 3 and only moves to the next chunk when the whole chunk failed.

## Question storage (Supabase)

Questions live in Supabase: table `lessons` (one row per lesson) and `exercise_sets` (every set ever stored for a lesson: the seeded original as version 1 plus each AI-generated set after it, nothing deleted). `lessons.active_set_id` says which set learners currently get. The JSON files in `content/lessons` are the seed content and the fallback: they are loaded into the database on first use, and served directly whenever the database is not configured or unreachable.

Setup, once per environment:

1. Run `supabase/migrations/20260906120000_lessons_and_exercise_sets.sql` in the Supabase SQL editor (or through the Supabase MCP server registered in `.mcp.json`; run `claude /mcp` and authenticate first). **Already applied to project `jqmjrizticeszylzqpas`.**
2. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (locally) and in the Vercel project's environment variables. Both are server-only. **Deploys will not have a working database until these are set in Vercel.**
3. `npm run seed:supabase` loads the six lesson files. Re-run with `-- --force` after editing the JSON to re-sync the seed sets. **Already seeded**, and the app also seeds itself on first read against an empty database.

All database access is server-side with the service-role key; row level security is on with no public policies.

### Regenerating exercises

On the home page, the refresh button on the right of each lesson card asks the free models for a brand-new exercise set for that lesson. There is no "regenerate all": running all six back-to-back can take several minutes on free models, so it is one lesson at a time by choice. Each set keeps the lesson's type plan (same count and types, flip targets included), is validated against the content schema with up to three repair attempts, and is then stored in the question database as the lesson's next version and made active for everyone. The endpoint is rate-limited to 12 regenerations per 10 minutes per IP.

**Card state is carried by the card itself, not by status text.** A lesson running AI-written questions shows a bold `NEW SET` badge and gains a second, counter-clockwise button that puts the original questions back (generated sets are kept in the database as history). When more than one lesson is on a generated set, a single link under the list restores them all.

**The regenerate button is only pressable once the questions in use have actually been played through.** It is always visible, showing a lock icon until then. Finishing a lesson records the id of the set that was played (`lib/useFinished.ts`, per device), and that one flag drives both the ✓ on the card and the button. Because a regenerated set gets a new id, a lesson loses its ✓ and locks again the moment its questions are replaced, which keeps the ✓ honest: it always means "I have done *these* questions". Restoring the original set brings both back.

### Matching exercises

Pairs are checked the moment they are connected: a correct pair turns green with a check mark and stays locked, a wrong pair flashes red with a cross and returns to the pool so it can be matched again. Check becomes available once every pair is matched, and finishing the board counts as a correct answer. A wrong tap is immediate feedback while playing, not a penalty, so it does not make the exercise fail or send it to the review pass.

### Why "Couldn't check this one right now"

Free-write and unmatched flip-sentence answers are sent to `POST /api/ai/grade`, which asks the OpenRouter models to judge the grammar and must answer within about 9 seconds. If every model in reach is rate-limited, too slow, or returns something that is not JSON, the app shows the model answer instead of a verdict. The model list is ordered so fast, reliable graders come first and hidden reasoning is turned off for grading, which is what made this message frequent.

The API key comes from `OPENROUTER_API_KEY` only: `.env.local` locally, the project's environment variables on Vercel.

### Testing fallback

Set `OPENROUTER_MODELS` to put an invalid ID first:

```bash
OPENROUTER_MODELS="bogus/nope:free,google/gemma-4-31b-it:free" npm run dev
```

The response's `modelUsed` will show the model OpenRouter fell back to.

## Content

Each lesson is one JSON file. Add or edit exercises there, then run `npm run validate`. The validator also checks that multiple-choice answers are in the options, word-order answers use exactly the given words, and each lesson has 8–10 exercises.
