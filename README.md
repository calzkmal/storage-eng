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

### Testing fallback

Set `OPENROUTER_MODELS` to put an invalid ID first:

```bash
OPENROUTER_MODELS="bogus/nope:free,google/gemma-4-31b-it:free" npm run dev
```

The response's `modelUsed` will show the model OpenRouter fell back to.

## Content

Each lesson is one JSON file. Add or edit exercises there, then run `npm run validate`. The validator also checks that multiple-choice answers are in the options, word-order answers use exactly the given words, and each lesson has 8–10 exercises.
