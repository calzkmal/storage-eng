import Link from "next/link";
import { getLessonOverviews, type LessonOverview } from "@/lib/content";
import { lessonLabel } from "@/lib/categories";
import LessonList from "@/components/LessonList";
import NameGate from "@/components/NameGate";
import LearnerGreeting from "@/components/LearnerGreeting";

// Static. Reads through the tagged cache, so a regenerate revalidates it.

export default async function HomePage() {
  const lessons = (await getLessonOverviews()).map((l: LessonOverview) => ({
    id: l.id,
    category: l.category,
    order: l.order,
    label: lessonLabel(l.category, l.order),
    title: l.title,
    exerciseCount: l.exerciseCount,
    setIds: l.setIds,
  }));

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">English Practice</h1>
        <LearnerGreeting />
        <p className="mt-1 text-base text-slate-600">
          Beginner grammar, one exercise at a time. Pick a lesson and finish it in a few minutes.
        </p>
        <Link
          href="/history"
          className="mt-3 inline-flex min-h-11 items-center rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold uppercase tracking-wide text-sky-700 shadow-[0_2px_0_#e2e8f0]"
        >
          Your history
        </Link>
      </header>
      <LessonList lessons={lessons} />
      <NameGate />
    </main>
  );
}
