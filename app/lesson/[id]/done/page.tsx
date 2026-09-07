import LessonDone from "@/components/LessonDone";
import { loadLessonFiles } from "@/lib/content";

/**
 * Deliberately does no database work, and is prerendered for every lesson.
 * Everything shown here was already saved to sessionStorage by the runner.
 */
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonDone lessonId={id} />;
}
