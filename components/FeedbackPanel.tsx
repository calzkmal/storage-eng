"use client";

export type FeedbackStatus = "correct" | "wrong" | "unverified";

export type Feedback = {
  status: FeedbackStatus;
  correctAnswer: string;
  explanation: string;
};

/** Duolingo-style feedback panel. Dismissed only via the Continue button (spec §4.2). */
export default function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const { status, correctAnswer, explanation } = feedback;

  const text =
    status === "correct" ? "text-emerald-900" : status === "wrong" ? "text-rose-900" : "text-amber-900";

  return (
    <div role="status" aria-live="assertive" className={`animate-slide-up px-4 pt-5 ${text}`}>
      {status === "correct" && (
        <>
          <p className="text-xl font-bold">Correct!</p>
          {explanation && <p className="mt-1 text-base">{explanation}</p>}
        </>
      )}

      {status === "wrong" && (
        <>
          <p className="text-xl font-bold">Not quite.</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide opacity-80">Correct answer</p>
          <p className="text-base font-medium">{correctAnswer}</p>
          {explanation && <p className="mt-2 text-base">{explanation}</p>}
        </>
      )}

      {status === "unverified" && (
        <>
          <p className="text-xl font-bold">Couldn&apos;t check this one right now</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide opacity-80">Here&apos;s a model answer</p>
          <p className="text-base font-medium">{correctAnswer}</p>
          {explanation && <p className="mt-2 text-base">{explanation}</p>}
        </>
      )}
    </div>
  );
}
