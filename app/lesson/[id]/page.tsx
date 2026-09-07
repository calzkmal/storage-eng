import { notFound } from "next/navigation";
import { getLesson, loadLessonFiles } from "@/lib/content";
import LessonRunnerLoader from "@/components/LessonRunnerLoader";

// Prerendered per lesson. Do NOT read searchParams here: it would make this
// page dynamic again. Every set ships with the page so the runner can pick
// one the learner has not finished, with no request at play time.
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const { sets, ...plain } = lesson;
  return <LessonRunnerLoader lesson={plain} sets={sets} />;
}
