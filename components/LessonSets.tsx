"use client";

import Link from "next/link";
import { useFinished } from "@/lib/useFinished";

type Props = { lessonId: string; title: string; setIds: string[] };

// Every set of one lesson, so a learner who has played them all can pick one again.
// A finished set is replayed shuffled, since the order is already familiar.
export default function LessonSets({ lessonId, title, setIds }: Props) {
  const finished = useFinished();
  const doneCount = setIds.filter((id) => finished.has(id)).length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 pb-6 pt-10">
      <div className="flex-1">
        <p className="text-base font-medium text-slate-500">{title}</p>
        <h1 className="mt-1 text-3xl font-bold">All question sets</h1>
        <p className="mt-2 text-base text-slate-600">
          {doneCount} of {setIds.length} finished. Pick any set to play it again.
        </p>

        <ul className="mt-6 grid grid-cols-3 gap-3">
          {setIds.map((setId, i) => {
            const done = finished.has(setId);
            return (
              <li key={setId}>
                <Link
                  href={`/lesson/${lessonId}?set=${setId}${done ? "&shuffle=1" : ""}`}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-base font-bold transition-colors ${
                    done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_2px_0_#a7f3d0] active:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-800 shadow-[0_2px_0_#e2e8f0] active:bg-slate-100"
                  }`}
                >
                  <span className="tabular-nums">Set {i + 1}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {done ? "✓ done" : "new"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-base font-bold uppercase tracking-wide text-slate-700"
        >
          Back to lessons
        </Link>
      </div>
    </main>
  );
}
