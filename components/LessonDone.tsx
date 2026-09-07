"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { loadResultRaw, parseResult } from "@/lib/storage";
import { useFinished } from "@/lib/useFinished";

type Props = { lessonId: string };

const noopSubscribe = () => () => {};

/** Reads the result the runner saved in sessionStorage. */
export default function LessonDone({ lessonId }: Props) {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => loadResultRaw(lessonId),
    () => null,
  );

  const result = useMemo(() => parseResult(raw), [raw]);
  const finished = useFinished();

  // The set just played is already flagged, so the first one left is genuinely new.
  // With none left the sets page takes over, where any set can be replayed.
  const unplayed = (result?.setIds ?? []).filter((id) => !finished.has(id));
  const nextHref = unplayed.length ? `/lesson/${lessonId}?set=${unplayed[0]}` : `/lesson/${lessonId}/sets`;
  const nextLabel = unplayed.length ? "New questions" : "Pick a set to retry";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 pb-6 pt-10">
      <div className="flex-1">
        {result?.lessonTitle && <p className="text-base font-medium text-slate-500">{result.lessonTitle}</p>}
        <h1 className="mt-1 text-3xl font-bold">Lesson complete</h1>

        {result === null ? (
          <p className="mt-6 text-base text-slate-600">
            No results to show for this lesson yet. Start it from the lesson list.
          </p>
        ) : result.wrong.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-emerald-900">
            <p className="text-xl font-bold">Perfect run.</p>
            <p className="mt-1 text-base">You answered every exercise correctly the first time.</p>
          </div>
        ) : (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">
              Worth another look ({result.wrong.length})
            </h2>
            <p className="text-base text-slate-600">These were wrong the first time.</p>
            <ul className="mt-3 flex flex-col gap-3">
              {result.wrong.map((w, i) => (
                <li key={`${w.exerciseId}-${i}`} className="rounded-2xl border-2 border-slate-200 bg-white p-4">
                  <p className="text-base font-medium text-slate-800">{w.summary}</p>
                  <p className="mt-2 text-sm text-rose-700">
                    <span className="font-semibold">You wrote:</span> {w.yourAnswer}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    <span className="font-semibold">Correct:</span> {w.correctAnswer}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={nextHref}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-sky-500 text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_0_#0284c7]"
        >
          {nextLabel}
        </Link>
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
