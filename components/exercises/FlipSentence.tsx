"use client";

import type { FlipSentence as FS } from "@/lib/schema";
import { textInput } from "../ui";
import type { ExerciseProps } from "./types";

const TARGET_LABEL: Record<FS["target"], string> = {
  negative: "Make it negative",
  past: "Change it to the past",
  future: "Change it to the future",
};

/** Full-width text input; local compare first, then AI fallback (spec §6). */
export default function FlipSentence({ exercise, value, onChange, disabled, onSubmit }: ExerciseProps<FS>) {
  const text = typeof value === "string" ? value : "";

  return (
    <div>
      <div className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{TARGET_LABEL[exercise.target]}</p>
        <p className="mt-1 text-xl leading-relaxed">{exercise.source}</p>
      </div>
      <input
        type="text"
        value={text}
        disabled={disabled}
        autoFocus
        autoCapitalize="sentences"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={300}
        aria-label="Your sentence"
        placeholder="Type the new sentence"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={`${textInput} mt-4 text-xl`}
      />
    </div>
  );
}
