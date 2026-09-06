"use client";

import type { MultipleChoice as MC } from "@/lib/schema";
import { chipBase, chipIdle, chipSelected } from "../ui";
import type { ExerciseProps } from "./types";

/** 3–4 full-width chips; tap selects, tap again deselects (spec §6). */
export default function MultipleChoice({ exercise, value, onChange, disabled }: ExerciseProps<MC>) {
  const selected = typeof value === "string" ? value : null;

  return (
    <div>
      <p className="text-xl leading-relaxed">{exercise.question}</p>
      <div className="mt-5 flex flex-col gap-3" role="group" aria-label="Answer options">
        {exercise.options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : opt)}
              className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
