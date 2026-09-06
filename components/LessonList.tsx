"use client";

import { useState } from "react";
import LessonCard, { type LessonSummary } from "./LessonCard";
import { useCompleted } from "@/lib/useCompleted";
import { useFinished } from "@/lib/useFinished";
import { clearAllOverrides, clearOverride, requestGeneration, setOverride, useOverrides } from "@/lib/overrides";

type CardState = { working: boolean; error?: string };

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

/**
 * Regenerating every lesson back-to-back can take several minutes on free
 * models, so there is no "regenerate all" here on purpose: only a per-lesson
 * button, plus a way to clear all locally-stored sets at once.
 *
 * The regenerate button itself only appears once a lesson's currently active
 * set (built-in or a previous regeneration) has actually been finished —
 * see lib/useFinished.ts — so you cannot reroll a lesson before trying it.
 */
export default function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const completed = useCompleted();
  const finished = useFinished();
  const overrides = useOverrides();
  const [cards, setCards] = useState<Record<string, CardState>>({});

  const setCard = (id: string, patch: CardState) => setCards((c) => ({ ...c, [id]: patch }));
  const anyWorking = Object.values(cards).some((c) => c.working);
  const overrideCount = Object.keys(overrides).length;

  async function regenerate(id: string) {
    setCard(id, { working: true });
    const res = await requestGeneration(id);
    if (res.ok) {
      setOverride(id, { exercises: res.exercises, modelUsed: res.modelUsed });
      setCard(id, { working: false });
    } else {
      setCard(id, { working: false, error: res.error });
    }
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {lessons.map((lesson) => {
          const ov = overrides[lesson.id];
          const st = cards[lesson.id] ?? { working: false };
          return (
            <li key={lesson.id}>
              <div className="flex items-stretch gap-2">
                <LessonCard
                  lesson={{ ...lesson, exerciseCount: ov ? ov.exercises.length : lesson.exerciseCount }}
                  completed={completed.has(lesson.id)}
                  regenerated={Boolean(ov)}
                />
                {finished.has(lesson.id) && (
                  <button
                    type="button"
                    onClick={() => regenerate(lesson.id)}
                    disabled={st.working}
                    aria-label={`Regenerate exercises for lesson ${lesson.order}`}
                    title="Regenerate exercises"
                    className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-slate-200 bg-white text-sky-600 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RefreshIcon spinning={st.working} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {st.working ? "Wait" : "New"}
                    </span>
                  </button>
                )}
              </div>
              {st.working && (
                <p className="mt-1 px-1 text-sm text-sky-700" aria-live="polite">
                  Writing new exercises… this can take up to a minute.
                </p>
              )}
              {st.error && !st.working && (
                <p className="mt-1 px-1 text-sm text-rose-700">{st.error}</p>
              )}
              {ov && !st.working && !st.error && (
                <p className="mt-1 px-1 text-sm text-slate-500">
                  New set on this device ({ov.exercises.length} exercises).{" "}
                  <button
                    type="button"
                    onClick={() => clearOverride(lesson.id)}
                    className="font-semibold text-sky-700 underline underline-offset-2"
                  >
                    Reset to original
                  </button>
                </p>
              )}
              {!ov && !finished.has(lesson.id) && !st.working && !st.error && (
                <p className="mt-1 px-1 text-sm text-slate-400">Finish this lesson to unlock regenerating it.</p>
              )}
            </li>
          );
        })}
      </ul>

      {overrideCount > 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {overrideCount} lesson{overrideCount === 1 ? "" : "s"} using a new set on this device.{" "}
          <button
            type="button"
            onClick={clearAllOverrides}
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
