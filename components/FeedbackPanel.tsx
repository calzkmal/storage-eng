"use client";

import MathText from "@/components/MathText";

import type { GradeDetail } from "@/lib/grading";

export type FeedbackStatus = "correct" | "wrong" | "unverified";

export type Feedback = {
  status: FeedbackStatus;
  correctAnswer: string;
  explanation: string;
  details?: GradeDetail[];
  tka?: boolean;
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
    <p className="mt-1 text-2xl font-bold leading-snug"><MathText>{answer}</MathText></p>
  </div>
);

/** Dismissed only via Continue. */
export default function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const { status, correctAnswer, explanation } = feedback;

  return (
    <div role="status" aria-live="assertive" className={`animate-slide-up px-4 pt-5 ${toneText[status]}`}>
      <p className="text-xl font-bold">{feedback.tka ? (status === "correct" ? "Jawaban tepat!" : "Coba lihat pembahasan ini") : headline[status]}</p>

      {status === "wrong" && <AnswerCard label={feedback.tka ? "Jawaban benar" : "Correct answer"} answer={correctAnswer} />}
      {status === "unverified" && <AnswerCard label="Model answer" answer={correctAnswer} />}

      {feedback.details && <ul className="mt-3 space-y-3">{feedback.details.map((d, i) => <li key={i} className="rounded-xl bg-white/75 p-3"><p className="font-semibold"><MathText>{d.label}</MathText>: {d.result}</p><p className="mt-1 leading-relaxed"><MathText>{d.explanation}</MathText></p></li>)}</ul>}
      {explanation && <p className="mt-3 text-base leading-relaxed"><MathText>{explanation}</MathText></p>}
    </div>
  );
}
