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

type Props = { lesson: LessonSummary; completed: boolean };

/** Large full-width card, min 64px tall (spec §4.1). */
export default function LessonCard({ lesson, completed }: Props) {
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
        <span className="block text-sm text-slate-500">
          {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
          {lesson.setSource === "generated" && <span className="text-sky-600"> · new set</span>}
        </span>
      </span>
      {completed && (
        <span
          aria-label="Completed"
          title="Completed"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700"
        >
          ✓
        </span>
      )}
    </Link>
  );
}
