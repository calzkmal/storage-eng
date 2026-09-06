import { loadLessons } from "@/lib/content";
import LessonList from "@/components/LessonList";

export default function HomePage() {
  const lessons = loadLessons().map((l) => ({
    id: l.id,
    order: l.order,
    title: l.title,
    exerciseCount: l.exercises.length,
  }));

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">English Practice</h1>
        <p className="mt-1 text-base text-slate-600">
          Beginner grammar, one exercise at a time. Pick a lesson and finish it in a few minutes.
        </p>
      </header>
      <LessonList lessons={lessons} />
    </main>
  );
}
