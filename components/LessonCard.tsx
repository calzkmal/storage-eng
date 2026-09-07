"use client";

import Link from "next/link";

export type LessonSummary = {
  id: string;
  category: number;
  order: number;
  /** "1.2" */
  label: string;
  title: string;
  exerciseCount: number;
  /** Every set of questions for this lesson. */
  setIds: string[];
};

type Props = {
  lesson: LessonSummary;
  /** How many of this lesson's sets the learner has finished. */
  done: number;
};


export default function LessonCard({ lesson, done }: Props) {
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold tabular-nums text-sky-800">
        {lesson.label}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-slate-900">{lesson.title}</span>
        {/* Own row so the title keeps the full width. */}
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>
            {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
          </span>
          <span
            title={`${done} of ${lesson.setIds.length} question sets finished`}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              done >= lesson.setIds.length
                ? "bg-emerald-100 text-emerald-700"
                : done > 0
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {done}/{lesson.setIds.length} sets
          </span>
        </span>
      </span>
    </Link>
  );
}
