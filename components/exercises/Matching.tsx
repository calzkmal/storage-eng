"use client";

import { useEffect, useRef, useState } from "react";
import type { Matching as M } from "@/lib/schema";
import { shuffleChanged } from "@/lib/shuffle";
import { chipBase, chipCorrect, chipIdle, chipSelected, chipWrong } from "../ui";
import type { ExerciseProps } from "./types";

type RightItem = { text: string; id: number };
type WrongFlash = { left: number; right: number };

const WRONG_FLASH_MS = 700;

// Each pair is checked as it is connected: correct locks green, wrong flashes
// red and returns to the pool. Finishing the board is a correct answer.
export default function Matching({ exercise, onChange, disabled }: ExerciseProps<M>) {
  const [rights] = useState<RightItem[]>(() =>
    shuffleChanged(exercise.pairs.map((p, id) => ({ text: p.right, id }))),
  );
  // leftIndex -> right item id, correct pairs only
  const [matched, setMatched] = useState<Record<number, number>>({});
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [wrong, setWrong] = useState<WrongFlash | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const rightTaken = new Set(Object.values(matched));

  function emit(nextMatched: Record<number, number>) {
    const complete = exercise.pairs.every((_, i) => nextMatched[i] !== undefined);
    if (!complete) {
      onChange(null);
      return;
    }
    const pairs: Record<string, string> = {};
    exercise.pairs.forEach((p, i) => {
      pairs[p.left] = rights.find((r) => r.id === nextMatched[i])!.text;
    });
    onChange(pairs);
  }

  function connect(left: number, rightId: number) {
    setSelLeft(null);
    setSelRight(null);
    const rightText = rights.find((r) => r.id === rightId)!.text;
    if (rightText === exercise.pairs[left].right) {
      const next = { ...matched, [left]: rightId };
      setMatched(next);
      emit(next);
      return;
    }
    setWrong({ left, right: rightId });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setWrong(null), WRONG_FLASH_MS);
  }

  function tapLeft(i: number) {
    if (disabled || wrong || matched[i] !== undefined) return;
    if (selRight !== null) {
      connect(i, selRight);
      return;
    }
    setSelLeft(selLeft === i ? null : i);
  }

  function tapRight(id: number) {
    if (disabled || wrong || rightTaken.has(id)) return;
    if (selLeft !== null) {
      connect(selLeft, id);
      return;
    }
    setSelRight(selRight === id ? null : id);
  }

  const chipClass = (state: "idle" | "selected" | "correct" | "wrong") =>
    `${chipBase} relative justify-center pr-9 text-center ${
      state === "correct" ? chipCorrect : state === "wrong" ? chipWrong : state === "selected" ? chipSelected : chipIdle
    }`;

  const Badge = ({ state }: { state: "correct" | "wrong" }) => (
    <span
      className={`absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold text-white ${
        state === "correct" ? "bg-emerald-500" : "bg-rose-500"
      }`}
    >
      <span aria-hidden="true">{state === "correct" ? "✓" : "✕"}</span>
      <span className="sr-only">{state === "correct" ? "matched" : "wrong"}</span>
    </span>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3" aria-label="Left column">
          {exercise.pairs.map((p, i) => {
            const state =
              matched[i] !== undefined ? "correct" : wrong?.left === i ? "wrong" : selLeft === i ? "selected" : "idle";
            return (
              <button
                key={p.left}
                type="button"
                disabled={disabled || state === "correct"}
                aria-pressed={state === "selected"}
                onClick={() => tapLeft(i)}
                className={chipClass(state)}
              >
                {p.left}
                {(state === "correct" || state === "wrong") && <Badge state={state} />}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3" aria-label="Right column">
          {rights.map((r) => {
            const state =
              rightTaken.has(r.id) ? "correct" : wrong?.right === r.id ? "wrong" : selRight === r.id ? "selected" : "idle";
            return (
              <button
                key={r.id}
                type="button"
                disabled={disabled || state === "correct"}
                aria-pressed={state === "selected"}
                onClick={() => tapRight(r.id)}
                className={chipClass(state)}
              >
                {r.text}
                {(state === "correct" || state === "wrong") && <Badge state={state} />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Tap a word on the left, then its match on the right.</p>
    </div>
  );
}
