import type { Stimulus } from "@/lib/schema";
export default function StimulusView({ stimulus }: { stimulus: Stimulus }) {
  return <details open className="my-4 rounded-2xl border-2 border-slate-200 bg-white p-4">
    <summary className="flex min-h-11 cursor-pointer items-center text-lg font-bold">Bacaan: {stimulus.title}</summary>
    <article className="mt-3 space-y-3 text-base leading-relaxed">{stimulus.paragraphs.map((p, i) => <p key={i}>{p}</p>)}{stimulus.attribution && <p className="text-sm text-slate-500">{stimulus.attribution}</p>}</article>
  </details>;
}
