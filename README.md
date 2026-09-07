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
| `npm run seed:supabase` | Loads the lesson files into Supabase (`-- --force` re-syncs seed sets) |
| `npm run check-models` | Compares `lib/ai/models.ts` with OpenRouter's live `:free` list |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Structure

```
app/                       pages + /api/ai/grade route handler
components/                TopBar, BottomBar, FeedbackPanel, LessonRunner, exercises/*
content/lessons/*.json     18 lessons in 5 categories (seed content, validated)
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
3. `npm run seed:supabase` loads the lesson files. Re-run with `-- --force` after editing the JSON to re-sync the seed sets. **Already seeded**, and the app also seeds itself on first read against an empty database.

All database access is server-side with the service-role key; row level security is on with no public policies.

### Regenerating exercises

On the home page, the refresh button on the right of each lesson card asks the free models for a brand-new exercise set for that lesson. There is no "regenerate all": running every lesson one after another would take many minutes on free models, so it is one lesson at a time by choice. Each set keeps the lesson's type plan (same count and types, flip targets included), is validated against the content schema with up to three repair attempts, and is then stored in the question database as the lesson's next version and made active for everyone. The endpoint is rate-limited to 12 regenerations per 10 minutes per IP.

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

## Performance

Every page used to query Supabase on each request, which cost 270 to 800ms of server render before anything reached the browser. Three changes fixed it:

| Page | Before | After |
|---|---|---|
| Home | 270-800ms | ~7ms |
| Lesson | ~500ms | ~7ms |
| Lesson complete | ~270ms | ~4ms |

- **Reads are cached** in `lib/content.ts` through `unstable_cache` under a single `lessons` tag. Lessons change only when someone regenerates or resets a set, and those writes call `invalidateLessons()`, which drops the tag with `{ expire: 0 }` so the very next request sees the change. `"max"` would have been wrong here: it is stale-while-revalidate, so the page that just regenerated a set could still render the old one. **Tag invalidation does not reach `unstable_cache` in `next dev`**, only in a production build, so locally a regenerate can take up to the 60 second TTL to appear.
- **Queries are targeted.** The home page reads the `lesson_overview` view, which counts exercises in Postgres, instead of pulling every lesson's exercises (about 50KB) just to show a number. A lesson page loads that one lesson rather than the whole syllabus.
- **The lesson complete screen does no database work at all.** The runner already saved everything it shows to sessionStorage, including the lesson title, so the page renders immediately.

### The last question used to reappear

Pressing Continue on the final question showed that question again, blank, for as long as the next page took to load. `next()` cleared the answer before navigating, and navigation is asynchronous, so the runner re-rendered the same exercise unanswered in the gap. It now detects the last step and navigates without resetting, shows a brief "Finishing…" state, and prefetches the done route on mount.

## Progress tracking without accounts

On the first visit the app asks for a name and nothing else: no sign-up, no password. Behind that name it mints a random UUID (`lib/learner.ts`) and keeps `{ id, name }` in localStorage. **The UUID is the identity; the name is only a label on it.** Every checked answer is posted to `/api/attempts` and stored in the `attempts` table, and `/history` replays them grouped by lesson run, showing each question, the answer given, and the correct answer.

What this can and cannot tell you:

| Situation | Same learner? |
|---|---|
| Closes the tab or the browser and comes back | Yes, the UUID is in localStorage |
| Two people who both type "Budi" | No, two UUIDs, two separate histories |
| Same person renames themselves | Yes, renaming keeps the UUID and the history |
| Private window, cleared site data, another browser, another phone | No, a new UUID and an empty history |

So a name cannot be used to recognise anyone: it is a display label, and duplicates are expected. Recognising the same human across devices needs real authentication, or a "copy your profile code to the other device" flow built on top of the existing UUID.

Two consequences worth knowing. The learner id is the only key to a history, so anyone holding one can read that history through `/api/history`; there is no sensitive data in there, but it is the trade for having no accounts. And recording is best effort: `navigator.sendBeacon` posts each answer so it survives the navigation at the end of a lesson, but a failure is swallowed rather than interrupting practice, and a learner created while the database was unreachable simply has no history.

## Content

Lessons live in `content/lessons`, one JSON file per lesson, named after its `id`. Each carries a `category` number and an `order` within that category, so the pair renders as "1.2" and groups the home page. Category titles live in `lib/categories.ts`.

| # | Category | Lessons |
|---|---|---|
| 1 | Present tenses | continuous, simple, perfect, perfect continuous |
| 2 | Past tenses | simple, continuous, perfect, perfect continuous |
| 3 | Future tenses | simple, continuous, perfect, perfect continuous |
| 4 | Adverbs | manner, time, place, frequency, degree |
| 5 | Affirmative & negative with do | do / don't / doesn't |

Past simple sits at 2.1 although it was not in the original category list: past perfect cannot be taught before it, and the existing past simple material had nowhere else to go.

The grammar the app covers is declared once in `lib/ai/scope.ts`, including the list of irregular verbs allowed in exercises. Both the grading prompt and the exercise generator quote it, so **editing the syllabus means editing that file**, otherwise the AI will grade new lessons against the old rules. Per-lesson guidance for the generator lives in `LESSON_FOCUS` in `lib/ai/generate.ts`, keyed by lesson id.

After editing lessons run `npm run validate`, which checks the schema, that multiple-choice answers are in the options, that word-order answers use exactly the given words, that each lesson has 8 to 10 exercises, that categories are defined, and that each category's orders run 1..n with no gaps. Then `npm run seed:supabase` loads them into the database; lessons whose file has been deleted are removed from the database at the same time, while recorded attempts keep their own copy of the lesson title so history survives a restructure.
