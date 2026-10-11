import { navButton } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonOverviews } from "@/lib/content";
import { lessonLabel } from "@/lib/categories";
import { isSubject, SUBJECTS, SUBJECT_IDS } from "@/lib/subjects";
import LessonList from "@/components/LessonList";
import NameGate from "@/components/NameGate";
export function generateStaticParams() { return SUBJECT_IDS.map(subject => ({ subject })); }
export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!isSubject(subject)) notFound();
  const lessons = (await getLessonOverviews()).filter(l => l.subject === subject).map(l => ({ ...l, label: lessonLabel(l.category, l.order) }));
  return <main className="mx-auto max-w-[640px] px-4 pb-10 pt-8">
    <Link href="/" className={navButton}>← Pilih mapel</Link>
    <h1 className="mt-4 text-3xl font-bold">{SUBJECTS[subject].title}</h1><p className="mt-2 text-slate-600">{SUBJECTS[subject].description}</p>
    <nav className="my-4 flex flex-wrap gap-3"><Link className={navButton} href={`/progress?subject=${subject}`}>Progres</Link><Link className={navButton} href={`/history?subject=${subject}`}>Riwayat</Link></nav>
    {lessons.length ? <LessonList lessons={lessons} subject={subject} /> : <p>Materi sedang disiapkan.</p>}<NameGate />
  </main>;
}
