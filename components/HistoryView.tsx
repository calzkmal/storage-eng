"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveLearner, useLearner } from "@/lib/learner";
import type { HistoryRun } from "@/app/api/history/route";

type State = { loading: boolean; runs: HistoryRun[]; error?: string };

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function score(run: HistoryRun) {
  const main = run.answers.filter((a) => a.phase === "main");
  const right = main.filter((a) => a.correct === true).length;
  const unchecked = main.filter((a) => a.correct === null).length;
  return { right, total: main.length, unchecked };
}

export default function HistoryView() {
  const learner = useLearner();
  const [state, setState] = useState<State>({ loading: true, runs: [] });
  const [open, setOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");

  // Renaming keeps the id, so this fetches once per profile.
  const learnerId = learner?.id;

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/history?learnerId=${encodeURIComponent(learnerId)}`);
        const data = await res.json();
        if (cancelled) return;
        setState(
          res.ok
            ? { loading: false, runs: data.runs ?? [] }
            : { loading: false, runs: [], error: data.error ?? "Could not load your history" },
        );
      } catch {
        if (!cancelled) setState({ loading: false, runs: [], error: "Network error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    saveLearner(draft);
    setRenaming(false);
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-8">
      <Link href="/" className="text-base font-semibold text-sky-700 underline underline-offset-2">
        ← Back to lessons
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Your history</h1>
        {learner && !renaming && (
          <p className="mt-1 text-base text-slate-600">
            {learner.name}.{" "}
            <button
              type="button"
              onClick={() => {
                setDraft(learner.name);
                setRenaming(true);
              }}
              className="font-semibold text-sky-700 underline underline-offset-2"
            >
              Change name
            </button>
          </p>
        )}
        {learner && renaming && (
          <form onSubmit={rename} className="mt-2 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={40}
              autoFocus
              aria-label="Your name"
              className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-sky-400 focus:outline-none"
            />
            <button type="submit" className="rounded-xl bg-sky-500 px-4 text-sm font-bold uppercase text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="rounded-xl border-2 border-slate-200 px-4 text-sm font-bold uppercase text-slate-600"
            >
              Cancel
            </button>
          </form>
        )}
      </header>

      {learner === undefined ? (
        <p className="mt-8 text-base text-slate-500">Loading…</p>
      ) : learner === null ? (
        <p className="mt-8 text-base text-slate-600">
          No profile on this device yet. Open the lesson list and enter your name to start tracking.
        </p>
      ) : state.loading ? (
        <p className="mt-8 text-base text-slate-500">Loading…</p>
      ) : state.error ? (
        <p className="mt-8 text-base text-rose-700">{state.error}</p>
      ) : state.runs.length === 0 ? (
        <p className="mt-8 text-base text-slate-600">
          Nothing here yet. Finish a lesson and every question and answer will be listed here.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {state.runs.map((run) => {
            const s = score(run);
            const isOpen = open === run.runId;
            return (
              <li key={run.runId} className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : run.runId)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-slate-900">{run.lessonTitle}</span>
                    <span className="block text-sm text-slate-500">{dateFmt.format(new Date(run.startedAt))}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-700">
                    {s.right}/{s.total}
                    {s.unchecked > 0 && <span className="font-normal text-slate-400"> +{s.unchecked}?</span>}
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-slate-400">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <ol className="border-t-2 border-slate-100">
                    {run.answers.map((a, i) => (
                      <li key={`${a.exerciseId}-${i}`} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                        <p className="flex items-start gap-2 text-sm">
                          <span
                            aria-label={a.correct === true ? "correct" : a.correct === false ? "wrong" : "not checked"}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              a.correct === true
                                ? "bg-emerald-100 text-emerald-700"
                                : a.correct === false
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {a.correct === true ? "✓" : a.correct === false ? "✕" : "?"}
                          </span>
                          <span className="min-w-0 flex-1 font-medium text-slate-800">
                            {a.question}
                            {a.phase === "review" && (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                review
                              </span>
                            )}
                          </span>
                        </p>
                        <p className="mt-1 pl-7 text-sm text-slate-600">
                          <span className="font-semibold">You:</span> {a.userAnswer}
                        </p>
                        {a.correct !== true && (
                          <p className="mt-0.5 pl-7 text-sm text-emerald-800">
                            <span className="font-semibold">Answer:</span> {a.correctAnswer}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
