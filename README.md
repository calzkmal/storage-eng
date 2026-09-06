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

### Regenerating exercises

On the home page, the button on the right of each lesson card asks the free models for a brand-new exercise set for that lesson. There is no "regenerate all": running all six back-to-back can take several minutes on free models, so it is one lesson at a time by choice. Each set keeps the lesson's type plan (same count and types, flip targets included), is validated against the content schema with up to three repair attempts, and is then stored in the browser's localStorage. The lesson runner uses the stored set when one exists; **Reset to original** goes back to the built-in file, and **Reset all to original** (shown once any lesson has a new set) clears all of them at once. Nothing is written on the server, so this works the same on Vercel. The endpoint is rate-limited to 12 regenerations per 10 minutes per IP.

**The regenerate button is only pressable once a lesson's current set has actually been finished.** It is always visible on every card, but stays greyed out and unclickable until then. Completing a lesson (built-in or a previous regeneration) sets a `finished` flag for it (`lib/useFinished.ts`); regenerating a new set clears that flag for the lesson (you have to finish the new set before rolling again), while resetting to original restores it, since the original was necessarily finished at some point to unlock regeneration in the first place. "Reset to original" itself stays available at any time, even before finishing a freshly generated set, so you are never stuck with content you don't want.

The API key comes from `OPENROUTER_API_KEY` only: `.env.local` locally, the project's environment variables on Vercel.

### Testing fallback

Set `OPENROUTER_MODELS` to put an invalid ID first:

```bash
OPENROUTER_MODELS="bogus/nope:free,google/gemma-4-31b-it:free" npm run dev
```

The response's `modelUsed` will show the model OpenRouter fell back to.

## Content

Each lesson is one JSON file. Add or edit exercises there, then run `npm run validate`. The validator also checks that multiple-choice answers are in the options, word-order answers use exactly the given words, and each lesson has 8–10 exercises.
