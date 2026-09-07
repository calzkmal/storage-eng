"use client";

type Props = {
  counter: string;
  onExit: () => void;
};

/** Exit plus a plain position indicator. Not a progress bar. */
export default function TopBar({ counter, onExit }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-2">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit lesson"
        className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-slate-500 active:bg-slate-200"
      >
        ✕
      </button>
      <span className="pr-4 text-base font-medium tabular-nums text-slate-500" aria-live="polite">
        {counter}
      </span>
    </header>
  );
}
