import { Suspense } from "react";
import { getLessonOverviews } from "@/lib/content";
import { lessonLabel } from "@/lib/categories";
import ProgressView from "@/components/ProgressView";

export const metadata = { title: "Your progress" };

// Static. Which sets are finished lives in the browser, so only the shape of
// the syllabus comes from the server.
export default async function ProgressPage() {
  const lessons = (await getLessonOverviews()).map((l) => ({
    id: l.id,
    subject: l.subject,
    category: l.category,
    label: lessonLabel(l.category, l.order),
    title: l.title,
    setIds: l.setIds,
  }));

  return <Suspense fallback={<p>Memuat progres…</p>}><ProgressView lessons={lessons} /></Suspense>;
}
