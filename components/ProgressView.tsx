"use client";

import Link from "next/link";
import { useFinished } from "@/lib/useFinished";
import { categoryTitle } from "@/lib/categories";
import ProgressRing from "./ProgressRing";

export type ProgressLesson = {
  id: string;
  category: number;
  label: string;
  title: string;
  setIds: string[];
};

export default function ProgressView({ lessons }: { lessons: ProgressLesson[] }) {
  const finished = useFinished();
  const doneIn = (l: ProgressLesson) => l.setIds.filter((id) => finished.has(id)).length;

  const totalSets = lessons.reduce((n, l) => n + l.setIds.length, 0);
  const doneSets = lessons.reduce((n, l) => n + doneIn(l), 0);
  const lessonsStarted = lessons.filter((l) => doneIn(l) > 0).length;
  const lessonsDone = lessons.filter((l) => doneIn(l) === l.setIds.length).length;
  // Round up, so any finished set never reads as 0%.
  const percent = totalSets ? Math.ceil((doneSets / totalSets) * 100) : 0;

  const groups = [
    ...lessons.reduce((m, l) => {
      const list = m.get(l.category);
      if (list) list.push(l);
      else m.set(l.category, [l]);
      return m;
    }, new Map<number, ProgressLesson[]>()),
  ];

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Your progress</h1>

      <section className="mt-5 flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_2px_0_#e2e8f0]">
        <ProgressRing
          done={doneSets}
          total={totalSets}
          size={92}
          stroke={9}
          center={`${percent}%`}
          label={`${doneSets} of ${totalSets} sets finished`}
        />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">
            {doneSets} of {totalSets} sets
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {lessonsStarted} of {lessons.length} lessons started
          </p>
          <p className="text-sm text-slate-600">{lessonsDone} finished completely</p>
        </div>
      </section>

      {groups.map(([category, inCategory]) => (
        <section key={category} className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            {category}. {categoryTitle(category)}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {inCategory.map((lesson) => {
              const done = doneIn(lesson);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/lesson/${lesson.id}/sets`}
                    className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 shadow-[0_2px_0_#e2e8f0] transition-colors active:bg-slate-100"
                  >
                    <ProgressRing
                      done={done}
                      total={lesson.setIds.length}
                      label={`${lesson.title}: ${done} of ${lesson.setIds.length} sets finished`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold leading-snug text-slate-900">
                        {lesson.label} {lesson.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        {done}/{lesson.setIds.length} sets finished
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Link
        href="/"
        className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-base font-bold uppercase tracking-wide text-slate-700"
      >
        Back to lessons
      </Link>
    </main>
  );
}
