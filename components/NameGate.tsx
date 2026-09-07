"use client";

import { useState } from "react";
import { saveLearner, useLearner } from "@/lib/learner";

/** First-visit name prompt. The name is a label; the id beside it is the identity. */
export default function NameGate() {
  const learner = useLearner();
  const [name, setName] = useState("");

  // undefined while unread on the server; null means no profile here.
  if (learner !== null) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    saveLearner(name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-[560px] rounded-3xl bg-white p-6 shadow-xl"
        aria-labelledby="name-gate-title"
      >
        <h2 id="name-gate-title" className="text-2xl font-bold">
          What should we call you?
        </h2>
        <p className="mt-2 text-base text-slate-600">
          No account and no password. The name is saved on this device so your practice history is kept
          for you.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={40}
          autoComplete="given-name"
          placeholder="Your name"
          aria-label="Your name"
          className="mt-5 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 min-h-[52px] w-full rounded-2xl bg-sky-500 text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_0_#0284c7] transition-transform active:translate-y-[2px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Start practising
        </button>
      </form>
    </div>
  );
}
