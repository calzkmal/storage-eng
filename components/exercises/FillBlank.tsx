"use client";

import type { FillBlank as FB } from "@/lib/schema";
import type { ExerciseProps } from "./types";

/** Inline text input inside the sentence; autocapitalize off (spec §6). */
export default function FillBlank({ exercise, value, onChange, disabled, onSubmit }: ExerciseProps<FB>) {
  const text = typeof value === "string" ? value : "";
  const [before, ...restParts] = exercise.sentence.split("___");
  const after = restParts.join("___");

  return (
    <div>
      <p className="text-xl leading-loose">
        {before}
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
          aria-label="Your answer"
          size={Math.max(6, text.length + 2)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="mx-1 inline-block max-w-full rounded-lg border-b-4 border-sky-300 bg-white px-2 py-1 text-center text-xl text-sky-900 focus:border-sky-500 focus:outline-none disabled:border-slate-300 disabled:bg-slate-100"
        />
        {after}
      </p>
    </div>
  );
}
