import Link from "next/link";
import { SUBJECTS, SUBJECT_IDS, type Subject } from "@/lib/subjects";
export default function SubjectFilter({ path, subject }: { path: string; subject?: Subject }) {
  return <nav aria-label="Filter mapel" className="my-4 flex flex-wrap gap-2">{[undefined, ...SUBJECT_IDS].map(id => <Link key={id ?? "all"} href={id ? `${path}?subject=${id}` : path} aria-current={id === subject ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-xl border-2 px-3 font-semibold ${id === subject ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-white"}`}>{id ? SUBJECTS[id].title : "Semua"}</Link>)}</nav>;
}
