"use client";

import LessonCard, { type LessonSummary } from "./LessonCard";
import { useFinished } from "@/lib/useFinished";
import { categoryTitle } from "@/lib/categories";

/** Points down when the category is open. */
const ChevronIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={22}
    height={22}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// One collapsible card per category, native <details> so it works without JS.
// A lesson counts as done once any of its sets has been played through.
export default function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const finished = useFinished();

  const groups = [
    ...lessons.reduce((m, l) => {
      const list = m.get(l.category);
      if (list) list.push(l);
      else m.set(l.category, [l]);
      return m;
    }, new Map<number, LessonSummary[]>()),
  ];

  return (
    <div>
      {groups.map(([category, inCategory]) => {
        const setsDone = (l: LessonSummary) => l.setIds.filter((id) => finished.has(id)).length;
        const doneCount = inCategory.filter((l) => setsDone(l) > 0).length;
        const allDone = doneCount === inCategory.length;
        return (
          <details
            key={category}
            className="group mb-3 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-[0_2px_0_#e2e8f0]"
          >
            <summary className="flex min-h-16 cursor-pointer select-none list-none items-center gap-3 px-4 py-3 active:bg-slate-100 [&::-webkit-details-marker]:hidden">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold tabular-nums text-sky-800">
                {category}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold leading-snug text-slate-900">
                  {categoryTitle(category)}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>
                    {inCategory.length} lesson{inCategory.length === 1 ? "" : "s"} · {doneCount} done
                  </span>
                  {allDone && (
                    <span
                      aria-label="All finished"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700"
                    >
                      ✓
                    </span>
                  )}
                </span>
              </span>
              <ChevronIcon />
            </summary>
            <ul className="flex flex-col gap-3 border-t-2 border-slate-100 px-3 py-3">
              {inCategory.map((lesson) => (
                <li key={lesson.id}>
                  <LessonCard lesson={lesson} done={setsDone(lesson)} />
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
