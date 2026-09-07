import LessonDone from "@/components/LessonDone";

/**
 * Deliberately does no database work. Everything shown here was already saved
 * to sessionStorage by the runner, and this page is reached the instant a
 * lesson ends, so a round trip to Supabase here would just be a visible pause.
 */
export default async function LessonDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonDone lessonId={id} />;
}
