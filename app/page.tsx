import { getLessons, isDbConfigured } from "@/lib/content";
import LessonList from "@/components/LessonList";

// Lessons come from the question database and can change when someone
// regenerates a set, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lessons = (await getLessons()).map((l) => ({
    id: l.id,
    order: l.order,
    title: l.title,
    exerciseCount: l.exercises.length,
    setId: l.setId,
    setVersion: l.setVersion,
    setSource: l.setSource,
  }));

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">English Practice</h1>
        <p className="mt-1 text-base text-slate-600">
          Beginner grammar, one exercise at a time. Pick a lesson and finish it in a few minutes.
        </p>
      </header>
      <LessonList lessons={lessons} storageReady={isDbConfigured()} />
    </main>
  );
}
