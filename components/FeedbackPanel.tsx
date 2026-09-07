"use client";

export type FeedbackStatus = "correct" | "wrong" | "unverified";

export type Feedback = {
  status: FeedbackStatus;
  correctAnswer: string;
  explanation: string;
};

const toneText: Record<FeedbackStatus, string> = {
  correct: "text-emerald-900",
  wrong: "text-rose-900",
  unverified: "text-amber-900",
};

const headline: Record<FeedbackStatus, string> = {
  correct: "Correct!",
  wrong: "Not quite.",
  unverified: "Couldn't check this one right now",
};

/** The answer is the point of the panel, so it gets its own card. */
const AnswerCard = ({ label, answer }: { label: string; answer: string }) => (
  <div className="mt-3 rounded-2xl bg-white/75 px-4 py-3">
    <p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
    <p className="mt-1 text-2xl font-bold leading-snug">{answer}</p>
  </div>
);

/** Dismissed only via Continue. */
export default function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const { status, correctAnswer, explanation } = feedback;

  return (
    <div role="status" aria-live="assertive" className={`animate-slide-up px-4 pt-5 ${toneText[status]}`}>
      <p className="text-xl font-bold">{headline[status]}</p>

      {status === "wrong" && <AnswerCard label="Correct answer" answer={correctAnswer} />}
      {status === "unverified" && <AnswerCard label="Model answer" answer={correctAnswer} />}

      {explanation && <p className="mt-3 text-base leading-relaxed">{explanation}</p>}
    </div>
  );
}
