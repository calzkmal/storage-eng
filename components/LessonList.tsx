"use client";

import LessonCard, { type LessonSummary } from "./LessonCard";
import { useCompleted } from "@/lib/useCompleted";

export default function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const completed = useCompleted();
  return (
    <ul className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LessonCard lesson={lesson} completed={completed.has(lesson.id)} />
        </li>
      ))}
    </ul>
  );
}
