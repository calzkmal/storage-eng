import { notFound } from "next/navigation";
import { getLesson } from "@/lib/content";
import LessonDone from "@/components/LessonDone";

type Props = { params: Promise<{ id: string }> };

export default async function LessonDonePage({ params }: Props) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  return <LessonDone lessonId={lesson.id} title={lesson.title} />;
}
