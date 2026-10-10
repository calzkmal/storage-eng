"use client";
import type { MultipleSelect as Exercise } from "@/lib/schema";
import type { ExerciseProps } from "./types";
export default function MultipleSelect({ exercise, value, onChange, disabled }: ExerciseProps<Exercise>) {
  const selected = Array.isArray(value) ? value : [];
  return <fieldset><legend className="text-lg font-semibold">{exercise.question}</legend>
    <p className="my-3 text-slate-600">Pilih semua jawaban yang benar. Jawaban benar lebih dari satu.</p>
    <div className="space-y-3">{exercise.options.map(o => <label key={o.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 p-3 has-checked:border-sky-500 has-checked:bg-sky-50">
      <input className="h-5 w-5 shrink-0" type="checkbox" disabled={disabled} checked={selected.includes(o.id)} onChange={e => onChange(e.target.checked ? [...selected, o.id] : selected.filter(id => id !== o.id))} /><span>{o.text}</span>
    </label>)}</div></fieldset>;
}
