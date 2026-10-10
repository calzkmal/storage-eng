"use client";
import type { StatementCategory as Exercise } from "@/lib/schema";
import type { ExerciseProps } from "./types";
export default function StatementCategory({ exercise, value, onChange, disabled }: ExerciseProps<Exercise>) {
  const selected = typeof value === "object" && value && !Array.isArray(value) ? value : {};
  return <div><p className="mb-4 text-lg font-semibold">{exercise.question}</p><div className="space-y-4">{exercise.statements.map(s => <fieldset key={s.id} className="rounded-xl border-2 border-slate-200 p-3">
    <legend className="px-1 font-medium">{s.text}</legend><div className="flex flex-wrap gap-2">{exercise.categories.map(c => <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 has-checked:bg-sky-50">
      <input type="radio" name={`${exercise.id}-${s.id}`} checked={selected[s.id] === c.id} disabled={disabled} onChange={() => onChange({ ...selected, [s.id]: c.id })} /><span>{c.label}</span>
    </label>)}</div></fieldset>)}</div></div>;
}
