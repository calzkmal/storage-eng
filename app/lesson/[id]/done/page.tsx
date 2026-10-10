import LessonDone from "@/components/LessonDone";
import { notFound } from "next/navigation";
import { loadLessonFiles } from "@/lib/content";

// No database work: the runner already saved everything to sessionStorage.
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lessons = loadLessonFiles();
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) notFound();
  return <LessonDone lessonId={id} subject={lesson.subject} availableLessons={lessons.map(l => ({ id: l.id, title: l.title }))} />;
}
