import LessonDone from "@/components/LessonDone";
import { loadLessonFiles } from "@/lib/content";

// No database work: the runner already saved everything to sessionStorage.
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonDone lessonId={id} />;
}
