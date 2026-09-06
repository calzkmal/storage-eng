"use client";

import type { ReactNode } from "react";

export type BottomTone = "primary" | "correct" | "wrong" | "unverified";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: BottomTone;
  /** Feedback panel rendered above the button; the whole bar takes the tone colour. */
  panel?: ReactNode;
};

const wrapperTone: Record<BottomTone, string> = {
  primary: "bg-slate-50 border-t border-slate-200",
  correct: "bg-emerald-100",
  wrong: "bg-rose-100",
  unverified: "bg-amber-100",
};

const buttonTone: Record<BottomTone, string> = {
  primary: "bg-sky-500 text-white shadow-[0_4px_0_#0284c7] active:translate-y-[2px] active:shadow-[0_2px_0_#0284c7]",
  correct: "bg-emerald-600 text-white shadow-[0_4px_0_#047857] active:translate-y-[2px] active:shadow-[0_2px_0_#047857]",
  wrong: "bg-rose-600 text-white shadow-[0_4px_0_#be123c] active:translate-y-[2px] active:shadow-[0_2px_0_#be123c]",
  unverified: "bg-amber-600 text-white shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-[0_2px_0_#b45309]",
};

/** Sticky bottom bar with one full-width primary button, min 52px tall (spec §4.2). */
export default function BottomBar({ label, onClick, disabled, tone, panel }: Props) {
  return (
    <div className={`shrink-0 pb-[env(safe-area-inset-bottom)] ${wrapperTone[tone]}`}>
      {panel}
      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`min-h-[52px] w-full rounded-2xl text-base font-bold uppercase tracking-wide transition-transform disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${buttonTone[tone]}`}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
