/** Shared class strings for large, tappable chips (spec §4.4: chips, never radio circles). */

export const chipBase =
  "flex min-h-14 w-full items-center rounded-2xl border-2 px-4 py-3 text-left text-base font-medium leading-snug transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-default";

export const chipIdle = "border-slate-200 bg-white text-slate-800 shadow-[0_2px_0_#e2e8f0] active:bg-slate-100";

export const chipSelected = "border-sky-400 bg-sky-50 text-sky-900 shadow-[0_2px_0_#7dd3fc]";

export const chipDimmed = "border-slate-200 bg-slate-100 text-slate-400 shadow-none scale-[0.97]";

export const textInput =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500";
