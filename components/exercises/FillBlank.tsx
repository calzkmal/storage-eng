"use client";

import type { ReactNode } from "react";
import type { FillBlank as FB } from "@/lib/schema";
import type { ExerciseProps } from "./types";

/** "(watch)" is the word to change, so it gets its own chip. */
function withCues(text: string): ReactNode[] {
  return text.split(/(\([^)]*\))/g).map((part, i) =>
    part.startsWith("(") && part.endsWith(")") ? (
      <span
        key={i}
        className="mx-0.5 rounded-lg bg-amber-100 px-2 py-0.5 text-lg font-semibold text-amber-900"
      >
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    ),
  );
}

/** Inline input inside the sentence. */
export default function FillBlank({ exercise, value, onChange, disabled, onSubmit }: ExerciseProps<FB>) {
  const text = typeof value === "string" ? value : "";
  const [before, ...restParts] = exercise.sentence.split("___");
  const after = restParts.join("___");
  const hasCue = /\([^)]*\)/.test(exercise.sentence);

  return (
    <div>
      <p className="mb-4 text-base text-slate-600">
        {hasCue
          ? "Ubah kata yang ditandai, lalu tulis di kotak biru."
          : "Tulis jawabanmu di kotak biru."}
      </p>
      <p className="text-xl leading-loose">
        {withCues(before)}
        <input
          type="text"
          value={text}
          disabled={disabled}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder="…"
          aria-label="Your answer"
          size={Math.max(9, text.length + 2)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="mx-1 inline-block max-w-full rounded-lg border-b-4 border-sky-300 bg-white px-2 py-1 text-center text-xl text-sky-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none disabled:border-slate-300 disabled:bg-slate-100"
        />
        {withCues(after)}
      </p>
    </div>
  );
}
