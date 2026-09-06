"use client";

import type { FreeWrite as FW } from "@/lib/schema";
import { textInput } from "../ui";
import type { ExerciseProps } from "./types";

const MAX = 300;

/** 1–2 line textarea; always AI-graded (spec §6). */
export default function FreeWrite({ exercise, value, onChange, disabled, onSubmit }: ExerciseProps<FW>) {
  const text = typeof value === "string" ? value : "";

  return (
    <div>
      <p className="text-xl leading-relaxed">{exercise.task}</p>
      <textarea
        value={text}
        disabled={disabled}
        autoFocus
        rows={2}
        maxLength={MAX}
        autoCapitalize="sentences"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="Your sentence"
        placeholder="Write your sentence here"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={`${textInput} mt-4 resize-none text-xl`}
      />
      <p className="mt-1 text-right text-sm text-slate-400" aria-hidden="true">
        {text.length} / {MAX}
      </p>
    </div>
  );
}
