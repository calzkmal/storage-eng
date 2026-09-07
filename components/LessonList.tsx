"use client";

import LessonCard, { type LessonSummary } from "./LessonCard";
import { useFinished } from "@/lib/useFinished";
import { categoryTitle } from "@/lib/categories";

// Cards grouped by category. Each lesson ships many sets of questions; opening
// one serves a set the learner has not finished, so there is nothing to press
// and no request at play time.
export default function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const finished = useFinished();

  const groups = [
    ...lessons.reduce((m, l) => {
      const list = m.get(l.category);
      if (list) list.push(l);
      else m.set(l.category, [l]);
      return m;
    }, new Map<number, LessonSummary[]>()),
  ];

  return (
    <div>
      {groups.map(([category, inCategory]) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            {category}. {categoryTitle(category)}
          </h2>
          <ul className="flex flex-col gap-3">
            {inCategory.map((lesson) => (
              <li key={lesson.id}>
                <LessonCard lesson={lesson} done={lesson.setIds.filter((id) => finished.has(id)).length} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
