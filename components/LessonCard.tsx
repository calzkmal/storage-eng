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
  /** Set ids finished on this device, across every lesson. */
  finished: Set<string>;
};

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12h13M12 5l7 7-7 7" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={18}
    height={18}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const nextButtonBase = "flex min-h-16 w-14 shrink-0 items-center justify-center rounded-2xl border-2";

// The next button stays locked until one set is finished, then serves the next
// unplayed one. With none left it opens the list of sets to replay.
export default function LessonCard({ lesson, finished }: Props) {
  const done = lesson.setIds.filter((id) => finished.has(id)).length;
  const allDone = done >= lesson.setIds.length;
  const nextSetId = lesson.setIds.find((id) => !finished.has(id));

  const listHref = `/lesson/${lesson.id}/sets`;
  const nextHref = nextSetId ? `/lesson/${lesson.id}?set=${nextSetId}` : listHref;

  return (
    <div className="flex items-stretch gap-2">
      <Link
        href={allDone ? listHref : `/lesson/${lesson.id}`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold tabular-nums text-sky-800">
          {lesson.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-snug text-slate-900">{lesson.title}</span>
          {/* Own row so the title keeps the full width. */}
          <span className="mt-0.5 block text-sm text-slate-500">
            {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
            {done > 0 && ` · ${done}/${lesson.setIds.length} sets`}
          </span>
        </span>
      </Link>

      {done > 0 ? (
        <Link
          href={nextHref}
          aria-label={allDone ? `${lesson.title}: pick a set to retry` : `${lesson.title}: next set`}
          title={allDone ? "Pick a set to retry" : "Next set"}
          className={`${nextButtonBase} border-sky-500 bg-sky-500 text-white shadow-[0_2px_0_#0284c7] transition-colors active:bg-sky-600`}
        >
          <ArrowIcon />
        </Link>
      ) : (
        <span
          aria-disabled
          title="Finish a set to unlock the next one"
          className={`${nextButtonBase} border-slate-200 bg-slate-100 text-slate-300`}
        >
          <LockIcon />
        </span>
      )}
    </div>
  );
}
