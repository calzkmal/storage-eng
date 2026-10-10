import Link from "next/link";
import { SUBJECTS, SUBJECT_IDS, subjectHref } from "@/lib/subjects";
import NameGate from "@/components/NameGate";
import LearnerGreeting from "@/components/LearnerGreeting";
export default function HomePage() {
  return <main className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-8">
    <h1 className="text-3xl font-bold">Pilih pelajaranmu</h1><LearnerGreeting />
    <nav className="my-5 flex gap-4"><Link className="inline-flex min-h-11 items-center text-sky-700 underline" href="/progress">Progres</Link><Link className="inline-flex min-h-11 items-center text-sky-700 underline" href="/history">Riwayat</Link></nav>
    <div className="space-y-4">{SUBJECT_IDS.map(id => <Link key={id} href={subjectHref(id)} className="block rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm hover:border-sky-400">
      <h2 className="text-xl font-bold">{SUBJECTS[id].title}</h2><p className="mt-2 leading-relaxed text-slate-600">{SUBJECTS[id].description}</p><p className="mt-3 font-semibold text-sky-700">Buka pelajaran →</p>
    </Link>)}</div><p className="mt-6 text-sm text-slate-500">Latihan TKA SD ini bukan layanan resmi pemerintah dan belum mencakup seluruh silabus. Skor adalah hasil latihan internal.</p><NameGate />
  </main>;
}
