import { notFound } from "next/navigation";
import { getLesson, loadLessonFiles } from "@/lib/content";
import LessonRunnerLoader from "@/components/LessonRunnerLoader";

/**
 * Prerendered for every lesson so opening one is a CDN hit rather than a
 * function call. The "practice again" flag lives in the query string and is
 * read by the runner on the client, because reading `searchParams` here would
 * force this page to be rendered per request.
 */
export function generateStaticParams() {
  return loadLessonFiles().map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const { setId, setVersion, setSource, modelUsed, ...plain } = lesson;
  void setVersion;
  void setSource;
  void modelUsed;

  return <LessonRunnerLoader lesson={plain} setId={setId} />;
}
