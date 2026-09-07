# English Practice

A mobile-first web app for practising beginner English grammar. One exercise per screen: answer, check, instant feedback, continue. Explanations are in Indonesian.

No XP, streaks, hearts, leaderboards or logins.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

Open http://localhost:3000. Without any keys the app still runs on the bundled lesson files; AI grading of free-text answers is simply off.

| Variable | Needed for |
|---|---|
| `GEMINI_API_KEY` | Grading free-text answers, tried first |
| `OPENROUTER_API_KEY` | Fallback grader when Gemini is unavailable |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storing questions and practice history |

Optional: `GEMINI_MODEL` and `OPENROUTER_MODELS` override the model choices.

All are server-only and never reach the browser.

## What it does

- **18 lessons in 5 categories**: present, past and future tenses, adverbs, and `do / don't / doesn't`. Six exercise types: multiple choice, fill in the blank, word order, matching, sentence rewriting and free writing.
- **Instant feedback.** Wrong answers show the rule and come back once at the end of the lesson.
- **AI grading** for free writing and sentence rewrites. Gemini answers first, with OpenRouter's free models behind it. If neither answers in time the app shows a model answer instead of a verdict, and never blocks the lesson.
- **16 sets of questions per lesson.** Every lesson ships a seed set plus 15 pre-built variations, all held in the database. Opening a lesson serves a set you have not finished, so the questions are new each time with no waiting and no AI call. The card shows how many sets you have done.
- **Progress without accounts.** You type a name once and a random id is stored in your browser. `/history` replays every question and answer you have given.

## Setup

Run the migrations in `supabase/migrations` in the Supabase SQL editor, then:

```bash
npm run seed:supabase
```

Lessons live in `content/lessons/*.json`, one file per lesson. They seed the database and are the fallback if it is unreachable. After editing them run `npm run validate`, then seed again.

Variations come from an item pool per lesson in `scripts/variations/`. `npm run build:variations` composes 15 distinct sets per lesson from its pool, validates every one against the schema, and writes `content/variations/`; `npm run seed:variations` pushes them to the database. A pool needs more items of a type than a set uses, or that slot repeats in every variation.

The grammar the app teaches is declared once in `lib/ai/scope.ts`. The grading prompt reads it, so change it there when the syllabus changes.

## Deploying

Set the environment variables in your host. `vercel.json` pins functions to `sin1` (Singapore) to sit next to the Supabase project; move it if your database moves.

Pages are prerendered and served from the CDN, so a page load makes no database call. Cache invalidation works in a production build but not in `next dev`, so locally a content change can take up to a minute to appear.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Validates content, then builds |
| `npm run validate` | Checks every lesson file against the schema |
| `npm run seed:supabase` | Loads lesson files into Supabase (`-- --force` re-syncs) |
| `npm run build:variations` | Composes 15 question sets per lesson from its pool |
| `npm run seed:variations` | Pushes the variations into Supabase |
| `npm run typecheck` / `npm run lint` | Types and lint |

## Layout

```
app/                    pages and API routes
components/             UI; exercises/ has one component per type
content/lessons/        the 18 lesson files
content/variations/     15 pre-built question sets per lesson
lib/                    schema, grading, storage, ai/
supabase/migrations/    database schema
```

Built with Next.js, TypeScript, Tailwind and Supabase.
