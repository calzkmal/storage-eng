# Latihan Bahasa Inggris dan TKA SD

A mobile-first learning app with Bahasa Inggris, Matematika TKA SD kelas 6, and Bahasa Indonesia TKA SD kelas 6. One exercise per screen: answer, check, explanation, continue. Shared navigation and TKA content are in Indonesian.

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
| `SESSION_SECRET` | Signing the anonymous learner cookie, so history is kept |
| `TRUSTED_PROXY_HOPS` | Rate limiting off Vercel. Unset, the limited routes refuse |
| `GEMINI_API_KEY` | Grading free-text answers, tried first |
| `OPENROUTER_API_KEY` | Fallback grader when Gemini is unavailable |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storing questions and practice history |

Optional: `GEMINI_MODEL` and `OPENROUTER_MODELS` override the model choices.

All are server-only and never reach the browser.

## What it does

- **18 lessons in 5 categories**: present, past and future tenses, adverbs, and `do / don't / doesn't`. Six exercise types: multiple choice, fill in the blank, word order, matching, sentence rewriting and free writing.
- **Instant feedback.** All TKA answers show an explanation. Main misses are reviewed exactly once; English keeps its existing retry-until-correct behavior.
- **AI grading** for free writing and sentence rewrites. Gemini answers first, with OpenRouter's free models behind it. If neither answers in time the app shows a model answer instead of a verdict, and never blocks the lesson.
- **16 sets per English lesson in Supabase.** Every English lesson ships a seed set plus 15 pre-built variations, all held in the database. Opening a lesson serves a set you have not finished, so the questions are new each time with no waiting and no AI call. The card shows how many sets you have done.
- **31 SD topics with 837 questions in 93 sets.** Fifteen Math topics and sixteen Bahasa Indonesia topics follow the user-requested scope; each has three sets of nine questions. All sets contain single-choice, multi-select, and statement-category questions, graded locally. Fraction topics include visuals; every topic includes material and worked examples. BI has 48 original reading stimuli (154–185 words).
- **First-attempt TKA results.** One point per fully correct question; review does not raise the initial score. Completion means the available set was finished, not mastery of the syllabus.
- **Subject filters** on `/progress?subject=matematika` and `/history?subject=bahasa-indonesia` (also `english`, or omit for all).
- **Progress without accounts.** You type a name once. The identity behind it is a signed `HttpOnly` cookie the server sets, so it never reaches page scripts or a URL. `/history` replays every question and answer you have given, and can delete the lot.

## TKA release setup and data preservation

Apply all migrations in filename order on a disposable/test database first. Existing installations only need the new additive migration `supabase/migrations/20261010090000_tka_subjects.sql` after their existing migrations. It appends metadata to `lesson_sets` and `lesson_active` while preserving `security_invoker`, RLS and revoked grants. The old `lesson_overview` was already dropped in migration 20260907110000.

After applying and verifying the migration, add the two TKA subjects idempotently:

```bash
npm run validate
npm run test
npm run audit:tka
npm run seed:supabase -- --subject=matematika
npm run seed:supabase -- --subject=bahasa-indonesia
```

`seed:supabase` is additive: existing lesson/set IDs and learner completions are preserved; it no longer prunes removed lesson files. Each rerun reuses the existing seed set. `--force` rewrites exercises in the selected subject's existing seed; use it only for an intentional content revision, never to add TKA across all subjects. Metadata is upserted on each seed. Content reads never auto-seed a configured database. Missing/invalid DB lessons use complete bundled metadata and a `file:<lessonId>` seed set; DB failures are logged. Local and DB set IDs remain distinct as before, so local completion is device-local and is not automatically converted to a DB completion.

Do **not** run `seed:variations` as part of adding TKA. It still replaces English variations and may cascade-delete their `learner_sets` completion rows. `build:variations` and `seed:variations` select English only, and validation still requires all 15 English variations. TKA uses a separate additive `seed:tka` command for one seed plus two supplemental sets per topic. Without Supabase, all three TKA sets are bundled; English still exposes its one seed locally (English variations remain available through Supabase).

Release gate: DB migration, idempotent seed, view metadata, signed-cookie attempt/history, and completion preservation must be verified on a designated test DB before production release. The connected Supabase project was migrated and seeded after explicit user authorization, and live DB preservation/history checks passed; see [verification](docs/TKA-SD-VERIFICATION.md) and [the bank expansion report](docs/TKA-SD-BANK-REPORT.md).

The curriculum subset is preparation material, not a government service, complete syllabus, exam prediction, or official TKA score. TKA attempts carry client-reported telemetry (`subject`, `competency`, bounded versioned `context`), not authoritative grades. Learner identity still comes only from the signed HttpOnly cookie. Context is limited to 16 KiB and the whole attempt body to 32 KiB; old display fields keep their 600-character bounds.

## Setup

Run the migrations in `supabase/migrations` in the Supabase SQL editor, then:

```bash
npm run seed:supabase
```

Lessons live in `content/lessons/*.json`, one file per lesson. They seed the database and are the fallback if it is unreachable. After editing them run `npm run validate`, then seed again.

Variations come from an item pool per lesson in `scripts/variations/`. `npm run build:variations` composes 15 distinct sets per lesson from its pool, validates every one against the schema, and writes `content/variations/`; `npm run seed:variations` pushes them to the database. A pool needs more items of a type than a set uses, or that slot repeats in every variation.

The grammar the app teaches is declared once in `lib/ai/scope.ts`. The grading prompt reads it, so change it there when the syllabus changes.

## Deploying

**Accepted risk.** The content security policy allows inline script. A nonce would make
every prerendered page dynamic, which is the trade this app declines. It is containment
that was chosen not to be added, not a control that is present. The rest of the policy
still holds: nothing loads from, or is sent to, another origin.

**Rate limiting** counts in Postgres, not in memory, so it holds across serverless
isolates. On Vercel the client is keyed on the platform's own header. Anywhere else set
`TRUSTED_PROXY_HOPS`, or the limited routes refuse rather than sharing one global bucket.

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
| `npm run test` | Grading, schema, telemetry, storage and English regression tests |
| `npm run audit:tka` | Independent Math keys and exact BI evidence; writes content audit |
| `npm run smoke:local` | 78 page routes and API smoke against localhost:3100 (no learner cookie); set `LOCAL_BASE_URL` for another localhost port |

## Layout

```
app/                    pages and API routes
components/             UI; exercises/ has one component per type
content/lessons/        18 English + 31 SD/TKA seed lessons
content/variations/     15 pre-built sets per English lesson
content/tka-sets/       2 supplemental sets per SD/TKA topic
lib/                    schema, grading, storage, ai/
supabase/migrations/    database schema
```

Built with Next.js, TypeScript, Tailwind and Supabase.

## Handoff evidence

- [Implementation plan](docs/TKA-SD-IMPLEMENTATION-PLAN.md)
- [Content audit](docs/TKA-SD-CONTENT-AUDIT.md)
- [Implementation and live database verification](docs/TKA-SD-VERIFICATION.md)
- `docs/qa/`: responsive browser screenshots and measured viewport widths.

### Live Supabase verification

After applying migrations, run against an authorized database with the localhost app connected to the same project:

```bash
LOCAL_BASE_URL=http://localhost:3100 npm run verify:supabase -- --allow-writes
```

This explicitly writes to configured Supabase: seeds only TKA lesson metadata/seed sets twice, checks existing rows are unchanged, verifies both views, and creates two isolated QA profiles for history/snapshot/isolation/completion tests. It adds 601 temporary English attempts to check filtering before the 600-row cap, then deletes only its QA profiles and confirms existing attempts/completions are unchanged. The localhost server needs a valid SESSION_SECRET and its normal local rate-limit configuration. Without LOCAL_BASE_URL, only seed/preservation/view checks run. See [the verification report](docs/TKA-SD-VERIFICATION.md) for actual live results and remaining QA boundaries.

### Expanded SD bank

```bash
npm run build:tka  # deterministic authoring templates; Python 3 required
npm run validate
npm run audit:tka
npm run seed:tka   # configured Supabase, explicit write command
```

`seed:tka` preflights all 31 topics, preserves existing seed and variation IDs, and inserts missing versions 2 and 3. It refuses occupied versions with different content instead of deleting or overwriting them. Metadata differences are also refused before writes. Explicit revision flags permit material/objectives (`--sync-material`), passage text with unchanged stimulus IDs (`--sync-stimuli`), or explanation-only changes with unchanged questions/order/keys (`--sync-feedback`). It compares existing lesson/set/completion/attempt rows before and after the write. Rerunning creates no additional sets. The six original seed files are preserved by the builder; the 25 new seeds are regenerated from maintained authoring sources.

The expanded scope follows the user's list and includes broader SD practice; it does not claim every topic is part of the official TKA framework. BI supplemental sets revisit shared passages using different claim targets and positive/negative evaluations; they are not 432 unrelated readings. See [bank audit](docs/TKA-SD-BANK-AUDIT.md) and [expansion report](docs/TKA-SD-BANK-REPORT.md).
