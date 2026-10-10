"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { loadResultRaw, parseResult } from "@/lib/storage";
import { useFinished } from "@/lib/useFinished";

import { firstScore } from "@/lib/practice";
import { COMPETENCIES, subjectHref, type Subject } from "@/lib/subjects";
type Props = { lessonId: string; subject: Subject; availableLessons: { id: string; title: string }[] };

const noopSubscribe = () => () => {};

/** Reads the result the runner saved in sessionStorage. */
export default function LessonDone({ lessonId, subject, availableLessons }: Props) {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => loadResultRaw(lessonId),
    () => null,
  );

  const result = useMemo(() => parseResult(raw), [raw]);
  const finished = useFinished();
  const tka = subject !== "english";
  const score = result ? firstScore(result.total, result.wrong.length) : null;
  const recommendations = [...new Set((result?.wrong ?? []).map(w => w.competency ? COMPETENCIES[w.competency]?.lessonId : undefined))].flatMap(id => availableLessons.filter(l => l.id === id));

  // The set just played is already flagged, so the first one left is genuinely new.
  // With none left the sets page takes over, where any set can be replayed.
  const unplayed = (result?.setIds ?? []).filter((id) => !finished.has(id));
  const nextHref = unplayed.length ? `/lesson/${lessonId}?set=${unplayed[0]}` : `/lesson/${lessonId}/sets`;
  const nextLabel = unplayed.length ? "Soal baru" : "Pilih set untuk diulang";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 pb-6 pt-10">
      <div className="flex-1">
        {result?.lessonTitle && <p className="text-base font-medium text-slate-500">{result.lessonTitle}</p>}
        <h1 className="mt-1 text-3xl font-bold">Set selesai</h1>

        {tka && score && <section className="mt-5 rounded-2xl bg-sky-50 p-5"><h2 className="text-lg font-bold">Hasil percobaan pertama</h2><p className="mt-2 text-2xl font-bold">{score.correct}/{result!.total} benar · {score.percent}%</p><p className="mt-2">Latihan ulang tidak mengubah skor awal. Ini skor internal latihan, bukan skor resmi TKA.</p></section>}
        {tka && recommendations.length > 0 && <section className="mt-5"><h2 className="font-bold">Materi yang perlu diulang</h2>{recommendations.map(l => <Link key={l.id} href={`/lesson/${l.id}`} className="block min-h-11 py-3 text-sky-700 underline">{l.title}</Link>)}</section>}
        {result === null ? (
          <p className="mt-6 text-base text-slate-600">
            Hasil belum tersedia. Buka pelajaran dari katalog untuk mulai belajar.
          </p>
        ) : result.wrong.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-emerald-900">
            <p className="text-xl font-bold">Semua tepat.</p>
            <p className="mt-1 text-base">Semua soal dijawab benar pada percobaan pertama.</p>
          </div>
        ) : (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">
              Perlu dicoba lagi ({result.wrong.length})
            </h2>
            <p className="text-base text-slate-600">Soal ini belum tepat pada percobaan pertama.</p>
            <ul className="mt-3 flex flex-col gap-3">
              {result.wrong.map((w, i) => (
                <li key={`${w.exerciseId}-${i}`} className="rounded-2xl border-2 border-slate-200 bg-white p-4">
                  <p className="text-base font-medium text-slate-800">{w.summary}</p>
                  <p className="mt-2 text-sm text-rose-700">
                    <span className="font-semibold">Jawabanmu:</span> {w.yourAnswer}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    <span className="font-semibold">Jawaban benar:</span> {w.correctAnswer}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={nextHref}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-sky-500 text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_0_#0284c7]"
        >
          {nextLabel}
        </Link>
        <Link
          href={subjectHref(subject)}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-base font-bold uppercase tracking-wide text-slate-700"
        >
          Kembali ke katalog
        </Link>
      </div>
    </main>
  );
}
