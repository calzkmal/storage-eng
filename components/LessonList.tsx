"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LessonCard, { type LessonSummary } from "./LessonCard";
import { useFinished } from "@/lib/useFinished";
import { requestGeneration, requestReset } from "@/lib/api";
import { categoryTitle } from "@/lib/categories";

type CardState = { working: boolean; error?: string };

const iconProps = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg {...iconProps} className={spinning ? "motion-safe:animate-spin" : ""}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </svg>
);

/** Counter-clockwise arrow: put the original questions back. */
const RevertIcon = () => (
  <svg {...iconProps}>
    <path d="M4 12a8 8 0 1 0 2.34-5.66" />
    <path d="M4 4v5h5" />
  </svg>
);

const buttonBase =
  "flex shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:shadow-none disabled:active:bg-white";

type Props = {
  lessons: LessonSummary[];
  /** False when SUPABASE_* env vars are missing: regeneration is unavailable. */
  storageReady: boolean;
};

/**
 * Lesson cards grouped into the syllabus categories (lib/categories.ts), each
 * with a regenerate button on the right. The button is always visible but
 * locked until the set in use has been played through (lib/useFinished.ts). A
 * lesson running AI-written questions is marked by a "New set" badge on the
 * card and gains a second button that puts the original questions back, so no
 * status text is needed under the card.
 *
 * There is deliberately no "regenerate all": running every lesson one after
 * another would take many minutes on free models.
 */
export default function LessonList({ lessons, storageReady }: Props) {
  const router = useRouter();
  const finished = useFinished();
  const [cards, setCards] = useState<Record<string, CardState>>({});

  const setCard = (id: string, patch: CardState) => setCards((c) => ({ ...c, [id]: patch }));
  const anyWorking = Object.values(cards).some((c) => c.working);
  const generated = lessons.filter((l) => l.setSource === "generated");

  // Lessons arrive sorted by category then order; keep that order in the groups.
  const groups = [...lessons.reduce((m, l) => {
    const list = m.get(l.category);
    if (list) list.push(l);
    else m.set(l.category, [l]);
    return m;
  }, new Map<number, LessonSummary[]>())];

  async function regenerate(id: string) {
    setCard(id, { working: true });
    const res = await requestGeneration(id);
    setCard(id, res.ok ? { working: false } : { working: false, error: res.error });
    if (res.ok) router.refresh();
  }

  async function reset(id: string) {
    setCard(id, { working: true });
    const res = await requestReset(id);
    setCard(id, res.ok ? { working: false } : { working: false, error: res.error });
    if (res.ok) router.refresh();
  }

  async function resetAll() {
    for (const l of generated) await reset(l.id);
  }

  return (
    <div>
      {groups.map(([category, inCategory]) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            {category}. {categoryTitle(category)}
          </h2>
          <ul className="flex flex-col gap-3">
            {inCategory.map((lesson) => {
          const st = cards[lesson.id] ?? { working: false };
          const isGenerated = lesson.setSource === "generated";
          // A regenerated set has a new id, so the lesson locks again until it is played.
          const unlocked = finished.has(lesson.setId);
          const canRegenerate = unlocked && storageReady && !st.working;
          const tip = st.working
            ? "Working"
            : !storageReady
              ? "Question database not configured"
              : unlocked
                ? "Write new questions for this lesson"
                : "Finish this lesson first";
          return (
            <li key={lesson.id}>
              <div className="flex items-stretch gap-2">
                <LessonCard lesson={lesson} finished={unlocked} />

                <div className="flex w-14 shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => regenerate(lesson.id)}
                    disabled={!canRegenerate}
                    aria-label={`Lesson ${lesson.label}: ${tip}`}
                    title={tip}
                    className={`${buttonBase} ${isGenerated ? "min-h-11 flex-1" : "flex-1 flex-col gap-0.5"} text-sky-600`}
                  >
                    {st.working ? (
                      <RefreshIcon spinning />
                    ) : canRegenerate ? (
                      <RefreshIcon spinning={false} />
                    ) : (
                      <LockIcon />
                    )}
                    {!isGenerated && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide">New</span>
                    )}
                  </button>

                  {isGenerated && (
                    <button
                      type="button"
                      onClick={() => reset(lesson.id)}
                      disabled={anyWorking}
                      aria-label={`Lesson ${lesson.label}: put the original questions back`}
                      title="Put the original questions back"
                      className={`${buttonBase} min-h-11 flex-1 text-slate-500`}
                    >
                      <RevertIcon />
                    </button>
                  )}
                </div>
              </div>

              {st.working && (
                <p className="mt-1 px-1 text-sm text-sky-700" aria-live="polite">
                  Writing new questions… this can take up to a minute.
                </p>
              )}
              {st.error && !st.working && <p className="mt-1 px-1 text-sm text-rose-700">{st.error}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {!storageReady && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Regeneration is off: the question database is not configured.
        </p>
      )}

      {generated.length > 1 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={resetAll}
            disabled={anyWorking}
            className="font-semibold text-sky-700 underline underline-offset-2 disabled:opacity-40"
          >
            Put every original question set back
          </button>
        </p>
      )}
    </div>
  );
}
