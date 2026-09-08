# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project specifics

### Comments

Keep them short. One line, only where the code cannot say it itself: a non-obvious constraint, a gotcha, a reason for an odd choice. No block essays, no restating what the next line does.

### Comments

Code should explain itself. Comments are the exception, not the default.

* Prefer clear, self-explanatory code over comments.
* Do not write comments that restate what the code does.
* Do not add long explanatory comments, block comments, essays, or multi-line rationale.
* Do not use comments to explain obvious implementation details, control flow, variable names, or function behavior.
* Only comment a non-obvious constraint, gotcha, workaround, or reason for an unusual decision.
* Keep useful comments to one short line whenever possible.
* If code requires a long comment to understand, simplify or restructure the code instead.
* Never add comments merely because a piece of code is complex, old, ugly, or difficult to understand. If it is outside the requested change, leave it alone.
* When modifying existing code, do not add comments to unrelated or pre-existing code.
* Do not add TODOs, documentation, or commentary unless explicitly requested.

**Rule of thumb:** If the code can be made clearer instead of explaining it with a comment, change the code. If the comment is longer than the code it explains, stop and reconsider.

### Gotchas

- Next 16: see the imported notes below before touching routing or caching APIs.
- Lesson pages are prerendered. Reading `searchParams` in them makes them dynamic again and slow in production.
- Cache tag invalidation works in a production build, not in `next dev`.
- Vercel functions are pinned to `sin1` in `vercel.json` to sit next to Supabase.

@AGENTS.md
