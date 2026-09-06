"use client";

import { useState } from "react";
import type { Matching as M } from "@/lib/schema";
import { shuffleChanged } from "@/lib/shuffle";
import { chipBase, chipDimmed, chipIdle, chipSelected } from "../ui";
import type { ExerciseProps } from "./types";

type RightItem = { text: string; id: number };

/**
 * Two columns of chips; tap one left then one right to connect.
 * Connected pairs shrink/dim; tapping a connected chip disconnects it (spec §6).
 * The right column is shuffled on mount. Grading is by text, so duplicate
 * right-hand labels (e.g. two "General truth") are handled.
 */
export default function Matching({ exercise, onChange, disabled }: ExerciseProps<M>) {
  const [rights] = useState<RightItem[]>(() =>
    shuffleChanged(exercise.pairs.map((p, id) => ({ text: p.right, id }))),
  );
  // leftIndex -> right item id
  const [links, setLinks] = useState<Record<number, number>>({});
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);

  const rightTaken = new Set(Object.values(links));

  function emit(next: Record<number, number>) {
    setLinks(next);
    const complete = exercise.pairs.every((_, i) => next[i] !== undefined);
    if (!complete) {
      onChange(null);
      return;
    }
    const record: Record<string, string> = {};
    exercise.pairs.forEach((p, i) => {
      record[p.left] = rights.find((r) => r.id === next[i])!.text;
    });
    onChange(record);
  }

  function connect(left: number, rightId: number) {
    const next = { ...links, [left]: rightId };
    setSelLeft(null);
    setSelRight(null);
    emit(next);
  }

  function tapLeft(i: number) {
    if (disabled) return;
    if (links[i] !== undefined) {
      const next = { ...links };
      delete next[i];
      emit(next);
      return;
    }
    if (selRight !== null) {
      connect(i, selRight);
      return;
    }
    setSelLeft(selLeft === i ? null : i);
  }

  function tapRight(id: number) {
    if (disabled) return;
    if (rightTaken.has(id)) {
      const leftIdx = Number(Object.keys(links).find((k) => links[Number(k)] === id));
      const next = { ...links };
      delete next[leftIdx];
      emit(next);
      return;
    }
    if (selLeft !== null) {
      connect(selLeft, id);
      return;
    }
    setSelRight(selRight === id ? null : id);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3" aria-label="Left column">
        {exercise.pairs.map((p, i) => {
          const linked = links[i] !== undefined;
          const selected = selLeft === i;
          return (
            <button
              key={p.left}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => tapLeft(i)}
              className={`${chipBase} justify-center text-center ${
                linked ? chipDimmed : selected ? chipSelected : chipIdle
              }`}
            >
              {p.left}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3" aria-label="Right column">
        {rights.map((r) => {
          const linked = rightTaken.has(r.id);
          const selected = selRight === r.id;
          return (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => tapRight(r.id)}
              className={`${chipBase} justify-center text-center ${
                linked ? chipDimmed : selected ? chipSelected : chipIdle
              }`}
            >
              {r.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
