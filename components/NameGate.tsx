"use client";

import { useState } from "react";
import { saveLearner, useLearner } from "@/lib/learner";

/**
 * First-visit prompt. Asks for a name once and keeps it on the device, so
 * progress is tracked without an account. The name is only a label: the
 * profile is identified by a random id stored alongside it.
 */
export default function NameGate() {
  const learner = useLearner();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // undefined = not read yet (server render), null = no profile on this device.
  if (learner !== null) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    await saveLearner(name);
    setSaving(false);
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
          disabled={!name.trim() || saving}
          className="mt-4 min-h-[52px] w-full rounded-2xl bg-sky-500 text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_0_#0284c7] transition-transform active:translate-y-[2px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {saving ? "Saving…" : "Start practising"}
        </button>
      </form>
    </div>
  );
}
