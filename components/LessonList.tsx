"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LessonCard, { type LessonSummary } from "./LessonCard";
import { useCompleted } from "@/lib/useCompleted";
import { useFinished } from "@/lib/useFinished";
import { requestGeneration, requestReset } from "@/lib/api";

type CardState = { working: boolean; error?: string; note?: string };

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={spinning ? "motion-safe:animate-spin" : ""}
  >
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </svg>
);

type Props = {
  lessons: LessonSummary[];
  /** False when SUPABASE_* env vars are missing: regeneration is unavailable. */
  storageReady: boolean;
};

/**
 * Lesson cards with a regenerate button on the right of each one. The button
 * is always visible but locked (lock icon, disabled) until the lesson's
 * current set has been played through, see lib/useFinished.ts. Regenerated
 * sets are stored in the question database and shown to everyone, so after a
 * change we simply refresh the server-rendered list.
 *
 * There is deliberately no "regenerate all": running all six back-to-back can
 * take several minutes on free models.
 */
export default function LessonList({ lessons, storageReady }: Props) {
  const router = useRouter();
  const completed = useCompleted();
  const finished = useFinished();
  const [cards, setCards] = useState<Record<string, CardState>>({});

  const setCard = (id: string, patch: CardState) => setCards((c) => ({ ...c, [id]: patch }));
  const anyWorking = Object.values(cards).some((c) => c.working);
  const generated = lessons.filter((l) => l.setSource === "generated");

  async function regenerate(id: string) {
    setCard(id, { working: true });
    const res = await requestGeneration(id);
    if (res.ok) {
      setCard(id, { working: false, note: `New set saved (version ${res.version}, ${res.exerciseCount} exercises).` });
      router.refresh();
    } else {
      setCard(id, { working: false, error: res.error });
    }
  }

  async function reset(id: string) {
    setCard(id, { working: true });
    const res = await requestReset(id);
    setCard(id, res.ok ? { working: false } : { working: false, error: res.error });
    if (res.ok) router.refresh();
  }

  async function resetAll() {
    for (const l of generated) await reset(l.id);
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {lessons.map((lesson) => {
          const st = cards[lesson.id] ?? { working: false };
          // Finished flags are keyed by set id, so a freshly generated set is
          // locked until it has been played, and the original unlocks again on reset.
          const unlocked = finished.has(lesson.setId);
          const canPress = unlocked && storageReady && !st.working;
          const title = st.working
            ? "Writing new exercises"
            : !storageReady
              ? "Question database not configured"
              : unlocked
                ? "Regenerate exercises"
                : "Finish this lesson first";
          return (
            <li key={lesson.id}>
              <div className="flex items-stretch gap-2">
                <LessonCard lesson={lesson} completed={completed.has(lesson.id)} />
                <button
                  type="button"
                  onClick={() => regenerate(lesson.id)}
                  disabled={!canPress}
                  aria-label={`Regenerate exercises for lesson ${lesson.order}: ${title}`}
                  title={title}
                  className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-slate-200 bg-white text-sky-600 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:shadow-none disabled:active:bg-white"
                >
                  {st.working ? <RefreshIcon spinning /> : unlocked && storageReady ? <RefreshIcon spinning={false} /> : <LockIcon />}
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {st.working ? "Wait" : "New"}
                  </span>
                </button>
              </div>
              {st.working && (
                <p className="mt-1 px-1 text-sm text-sky-700" aria-live="polite">
                  Writing new exercises… this can take up to a minute.
                </p>
              )}
              {st.error && !st.working && <p className="mt-1 px-1 text-sm text-rose-700">{st.error}</p>}
              {st.note && !st.working && !st.error && (
                <p className="mt-1 px-1 text-sm text-emerald-700" aria-live="polite">
                  {st.note}
                </p>
              )}
              {lesson.setSource === "generated" && !st.working && !st.error && (
                <p className="mt-1 px-1 text-sm text-slate-500">
                  AI set, version {lesson.setVersion}.{" "}
                  <button
                    type="button"
                    onClick={() => reset(lesson.id)}
                    disabled={anyWorking}
                    className="font-semibold text-sky-700 underline underline-offset-2 disabled:opacity-40"
                  >
                    Reset to original
                  </button>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {!storageReady && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Regeneration is off: the question database is not configured.
        </p>
      )}

      {generated.length > 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {generated.length} lesson{generated.length === 1 ? "" : "s"} using an AI-generated set.{" "}
          <button
            type="button"
            onClick={resetAll}
            disabled={anyWorking}
            className="font-semibold text-sky-700 underline underline-offset-2 disabled:opacity-40"
          >
            Reset all to original
          </button>
        </p>
      )}
    </div>
  );
}
