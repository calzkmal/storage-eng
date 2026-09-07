import { notFound } from "next/navigation";
import { getLesson, loadLessonFiles } from "@/lib/content";
import LessonSets from "@/components/LessonSets";

// Prerendered like the lesson page. Which sets are finished is device-local,
// so the list itself is the same for everyone.
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonSetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  return <LessonSets lessonId={lesson.id} title={lesson.title} setIds={lesson.sets.map((s) => s.setId)} />;
}
