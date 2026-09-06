"use client";

import Link from "next/link";

export type LessonSummary = {
  id: string;
  order: number;
  title: string;
  exerciseCount: number;
  /** Identity of the exercise set currently in use (a database id, or file:<id> without a database). */
  setId: string;
  setVersion: number;
  setSource: "seed" | "generated";
};

type Props = {
  lesson: LessonSummary;
  /** True when the set currently in use has been played through on this device. */
  finished: boolean;
};

/** Large full-width card, min 64px tall (spec §4.1). */
export default function LessonCard({ lesson, finished }: Props) {
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-800">
        {lesson.order}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-slate-900">{lesson.title}</span>
        {/* Status chips sit on their own row so the title keeps the full width. */}
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>
            {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
          </span>
          {lesson.setSource === "generated" && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              New set
            </span>
          )}
          {/* Tied to the set in use, so it clears when the questions are replaced. */}
          {finished && (
            <span
              aria-label="Finished"
              title="You have finished these questions"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700"
            >
              ✓
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
