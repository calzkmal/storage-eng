"use client";

import { useRef, useState } from "react";
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
import { markCompleted, markFinished, saveResult, type WrongItem } from "@/lib/storage";
import { buildGradeRequest, requestAIGrade } from "@/lib/ai/client";
import TopBar from "./TopBar";
import BottomBar, { type BottomTone } from "./BottomBar";
import FeedbackPanel, { type Feedback } from "./FeedbackPanel";
import ConfirmDialog from "./ConfirmDialog";
import ExerciseView from "./exercises/ExerciseView";

type Props = { lesson: Lesson; setId: string; shuffle: boolean };
type Phase = "main" | "review";

/**
 * The lesson loop (spec §4.2): one exercise per screen → Check → feedback → Continue.
 * Wrong answers in the main pass are queued once and replayed at the end ("Review n / m").
 * `setId` identifies the exercise set being played; finishing marks that set as
 * done on this device, which unlocks regeneration for it on the home page.
 */
export default function LessonRunner({ lesson, setId, shuffle }: Props) {
  const router = useRouter();

  const [order] = useState<Exercise[]>(() => (shuffle ? shuffleChanged(lesson.exercises) : lesson.exercises));
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

  const current: Exercise | undefined = phase === "main" ? order[index] : retryQueue[index];
  const total = phase === "main" ? order.length : retryQueue.length;
  const counter = showIntro ? "Tip" : phase === "main" ? `${index + 1} / ${total}` : `Review ${index + 1} / ${total}`;

  function applyResult(ex: Exercise, fb: Feedback, value: AnswerValue) {
    setFeedback(fb);
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
      );
      return;
    }

    // AI path: free_write always, flip_sentence when no accepted answer matched.
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
      );
    } else if (ex.type === "flip_sentence") {
      // Spec §6: if AI unavailable, mark wrong and show answer[0].
      applyResult(ex, { status: "wrong", correctAnswer: ex.answer[0], explanation: ex.explanation }, value);
    } else {
      // free_write with no AI: show the model answer, do not count as wrong (spec §4.4).
      applyResult(
        ex,
        { status: "unverified", correctAnswer: correctAnswerText(ex), explanation: res?.explanation ?? "" },
        value,
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
    saveResult({ lessonId: lesson.id, total: order.length, wrong: wrongFirst, finishedAt: Date.now() });
    markCompleted(lesson.id);
    markFinished(setId);
    router.push(`/lesson/${lesson.id}/done`);
  }

  function next() {
    resetForNext();
    if (phase === "main") {
      if (index + 1 < order.length) {
        setIndex(index + 1);
      } else if (retryQueue.length > 0) {
        setPhase("review");
        setIndex(0);
      } else {
        finish();
      }
    } else if (index + 1 < retryQueue.length) {
      setIndex(index + 1);
    } else {
      finish();
    }
  }

  function requestExit() {
    const midLesson = touched.current || index > 0 || phase === "review";
    if (midLesson) setExitOpen(true);
    else router.push("/");
  }

  // Bottom bar state
  let label = "Check";
  let tone: BottomTone = "primary";
  let disabled = false;
  let onPrimary: () => void = check;

  if (showIntro) {
    label = "Start";
    onPrimary = () => setShowIntro(false);
  } else if (feedback) {
    label = "Continue";
    tone = feedback.status;
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
        {showIntro && lesson.intro ? (
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
        panel={feedback ? <FeedbackPanel feedback={feedback} /> : undefined}
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
