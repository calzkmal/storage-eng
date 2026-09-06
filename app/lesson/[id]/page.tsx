import { notFound } from "next/navigation";
import { getLesson } from "@/lib/content";
import LessonRunnerLoader from "@/components/LessonRunnerLoader";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LessonPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  // "Practice again" links here with ?shuffle=1 (spec §4.3)
  const shuffle = sp.shuffle === "1";

  const { setId, setVersion, setSource, modelUsed, ...plain } = lesson;
  void setVersion;
  void setSource;
  void modelUsed;

  return <LessonRunnerLoader lesson={plain} setId={setId} shuffle={shuffle} />;
}
