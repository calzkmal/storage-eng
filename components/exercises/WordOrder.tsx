"use client";

import { useState } from "react";
import type { WordOrder as WO } from "@/lib/schema";
import { shuffleChanged } from "@/lib/shuffle";
import type { ExerciseProps } from "./types";

type BankItem = { word: string; id: number };

const chip =
  "inline-flex min-h-12 items-center rounded-xl border-2 px-4 text-base font-medium select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-default";

/**
 * Word bank at the bottom; tapping a chip moves it into the sentence slot,
 * tapping a placed chip returns it (spec §6). The bank is shuffled on mount.
 */
export default function WordOrder({ exercise, onChange, disabled }: ExerciseProps<WO>) {
  const [bank] = useState<BankItem[]>(() =>
    shuffleChanged(exercise.words.map((word, id) => ({ word, id }))),
  );
  const [placed, setPlaced] = useState<number[]>([]);

  function emit(next: number[]) {
    setPlaced(next);
    onChange(next.map((id) => bank.find((b) => b.id === id)!.word));
  }

  function place(id: number) {
    if (disabled || placed.includes(id)) return;
    emit([...placed, id]);
  }

  function remove(id: number) {
    if (disabled) return;
    emit(placed.filter((p) => p !== id));
  }

  return (
    <div>
      <div
        aria-label="Your sentence"
        className="flex min-h-[72px] flex-wrap content-start gap-2 rounded-2xl border-b-2 border-slate-300 py-2"
      >
        {placed.length === 0 && (
          <span className="self-center px-1 text-base text-slate-400">Tap the words below in order.</span>
        )}
        {placed.map((id) => {
          const item = bank.find((b) => b.id === id)!;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => remove(id)}
              className={`${chip} border-sky-300 bg-sky-50 text-sky-900 shadow-[0_2px_0_#bae6fd]`}
            >
              {item.word}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-2" aria-label="Word bank">
        {bank.map((item) => {
          const used = placed.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled || used}
              onClick={() => place(item.id)}
              aria-hidden={used}
              className={`${chip} ${
                used
                  ? "border-slate-100 bg-slate-100 text-transparent shadow-none"
                  : "border-slate-200 bg-white text-slate-800 shadow-[0_2px_0_#e2e8f0] active:bg-slate-100"
              }`}
            >
              {item.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
