"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Exercise, Lesson } from "@/lib/schema";
import {
  answerText,
  canCheck,
  correctAnswerText,
  exerciseSummary,
  gradeLocal,
  type AnswerValue,
} from "@/lib/grading";
import { shuffleChanged } from "@/lib/shuffle";
import { markFinished, saveResult, type WrongItem } from "@/lib/storage";
import { recordAttempt, useLearner } from "@/lib/learner";
import { buildGradeRequest, requestAIGrade } from "@/lib/ai/client";
import TopBar from "./TopBar";
import BottomBar, { type BottomTone } from "./BottomBar";
import FeedbackPanel, { type Feedback } from "./FeedbackPanel";
import ConfirmDialog from "./ConfirmDialog";
import ExerciseView from "./exercises/ExerciseView";

type Props = { lesson: Lesson; setId: string };
type Phase = "main" | "review";

// One exercise per screen: Check, feedback, Continue. Wrong answers replay once at the end.
export default function LessonRunner({ lesson, setId }: Props) {
  const router = useRouter();
  const learner = useLearner();

  // Read from the URL, not props, so the lesson page stays static. Client-only component.
  const [order] = useState<Exercise[]>(() => {
    const shuffle = new URLSearchParams(window.location.search).get("shuffle") === "1";
    return shuffle ? shuffleChanged(lesson.exercises) : lesson.exercises;
  });
  // Groups this pass in the history.
  const [runId] = useState(() => {
    try {
      return crypto.randomUUID();
    } catch {
      return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    }
  });
  const [showIntro, setShowIntro] = useState<boolean>(Boolean(lesson.intro));
  const [phase, setPhase] = useState<Phase>("main");
  const [index, setIndex] = useState(0);
  const [retryQueue, setRetryQueue] = useState<Exercise[]>([]);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [wrongFirst, setWrongFirst] = useState<WrongItem[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [exitOpen, setExitOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const attemptRef = useRef(0);
  const touched = useRef(false);

  // Warm the done route so finishing does not wait.
  useEffect(() => {
    router.prefetch(`/lesson/${lesson.id}/done`);
  }, [router, lesson.id]);

  const current: Exercise | undefined = phase === "main" ? order[index] : retryQueue[index];
  const total = phase === "main" ? order.length : retryQueue.length;
  const counter = showIntro ? "Tip" : phase === "main" ? `${index + 1} / ${total}` : `Review ${index + 1} / ${total}`;

  type GradedBy = "local" | "ai" | "cache" | "fallback";

  function applyResult(ex: Exercise, fb: Feedback, value: AnswerValue, gradedBy: GradedBy) {
    setFeedback(fb);

    // Best effort.
    if (learner) {
      recordAttempt({
        learnerId: learner.id,
        learnerName: learner.name,
        runId,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        setId,
        exerciseId: ex.id,
        exerciseType: ex.type,
        phase,
        question: exerciseSummary(ex),
        userAnswer: answerText(ex, value),
        correctAnswer: fb.correctAnswer,
        correct: fb.status === "correct" ? true : fb.status === "wrong" ? false : null,
        gradedBy,
      });
    }

    if (fb.status === "wrong" && phase === "main") {
      setRetryQueue((q) => [...q, ex]);
      setWrongFirst((w) => [
        ...w,
        {
          exerciseId: ex.id,
          summary: exerciseSummary(ex),
          yourAnswer: answerText(ex, value),
          correctAnswer: fb.correctAnswer,
        },
      ]);
    }
  }

  async function check() {
    if (!current || answer == null || checking || feedback) return;
    touched.current = true;
    const ex = current;
    const value = answer;

    const local = gradeLocal(ex, value);
    if (local) {
      applyResult(
        ex,
        { status: local.correct ? "correct" : "wrong", correctAnswer: local.correctAnswer, explanation: ex.explanation },
        value,
        "local",
      );
      return;
    }

    // free_write always; flip_sentence only when no accepted answer matched.
    const req = buildGradeRequest(ex, String(value));
    if (!req) return;

    const myAttempt = attemptRef.current;
    setChecking(true);
    const res = await requestAIGrade(req);
    if (attemptRef.current !== myAttempt) return; // learner already moved on
    setChecking(false);

    if (res && res.source !== "fallback") {
      applyResult(
        ex,
        { status: res.correct ? "correct" : "wrong", correctAnswer: res.correctedAnswer, explanation: res.explanation },
        value,
        res.source === "cache" ? "cache" : "ai",
      );
    } else if (ex.type === "flip_sentence") {
      // No AI: mark wrong and show the expected answer.
      applyResult(ex, { status: "wrong", correctAnswer: ex.answer[0], explanation: ex.explanation }, value, "fallback");
    } else {
      // No AI on a free write: show the model answer rather than judging it.
      applyResult(
        ex,
        { status: "unverified", correctAnswer: correctAnswerText(ex), explanation: res?.explanation ?? "" },
        value,
        "fallback",
      );
    }
  }

  function resetForNext() {
    attemptRef.current += 1;
    setAttempt((a) => a + 1);
    setFeedback(null);
    setAnswer(null);
    setChecking(false);
  }

  function finish() {
    if (finishing) return;
    setFinishing(true);
    saveResult({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      total: order.length,
      wrong: wrongFirst,
      finishedAt: Date.now(),
    });
    markFinished(setId);
    router.push(`/lesson/${lesson.id}/done`);
  }

  /** Continue ends the lesson rather than advancing. */
  function isLastStep(): boolean {
    return phase === "main" ? index + 1 >= order.length && retryQueue.length === 0 : index + 1 >= retryQueue.length;
  }

  function next() {
    // Do not reset first: navigation is async, and resetting flashed the last
    // question back on screen, unanswered, until the route loaded.
    if (isLastStep()) {
      finish();
      return;
    }
    resetForNext();
    if (phase === "main") {
      if (index + 1 < order.length) {
        setIndex(index + 1);
      } else {
        setPhase("review");
        setIndex(0);
      }
    } else {
      setIndex(index + 1);
    }
  }

  function requestExit() {
    const midLesson = touched.current || index > 0 || phase === "review";
    if (midLesson) setExitOpen(true);
    else router.push("/");
  }

  // Bottom bar
  let label = "Check";
  let tone: BottomTone = "primary";
  let disabled = false;
  let onPrimary: () => void = check;

  if (showIntro) {
    label = "Start";
    onPrimary = () => setShowIntro(false);
  } else if (feedback) {
    label = finishing ? "Finishing…" : "Continue";
    tone = finishing ? "primary" : feedback.status;
    onPrimary = next;
    disabled = finishing;
  } else {
    label = checking ? "Checking…" : "Check";
    disabled = checking || !current || !canCheck(current, answer);
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[640px] flex-col">
      <TopBar counter={counter} onExit={requestExit} />

      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
        {finishing ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-lg font-semibold text-slate-500">Finishing…</p>
          </div>
        ) : showIntro && lesson.intro ? (
          <section className="mt-4 rounded-3xl border-2 border-sky-100 bg-sky-50 p-5">
            <h1 className="text-xl font-bold text-sky-900">{lesson.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-sky-950">{lesson.intro}</p>
          </section>
        ) : current ? (
          <div key={`${phase}-${index}-${attempt}`}>
            <h2 className="text-xl font-bold leading-snug">{current.prompt}</h2>
            <div className="mt-5">
              <ExerciseView
                exercise={current}
                value={answer}
                onChange={setAnswer}
                disabled={Boolean(feedback) || checking}
                onSubmit={() => {
                  if (!feedback && !checking && canCheck(current, answer)) void check();
                }}
              />
            </div>
          </div>
        ) : null}
      </main>

      <BottomBar
        label={label}
        tone={tone}
        disabled={disabled}
        onClick={onPrimary}
        panel={feedback && !finishing ? <FeedbackPanel feedback={feedback} /> : undefined}
      />

      {exitOpen && (
        <ConfirmDialog
          title="Leave this lesson?"
          body="Your progress in this lesson will not be saved."
          confirmLabel="Leave"
          cancelLabel="Keep practicing"
          onCancel={() => setExitOpen(false)}
          onConfirm={() => router.push("/")}
        />
      )}
    </div>
  );
}
