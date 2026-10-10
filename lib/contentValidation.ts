import type { Lesson } from "./schema";
/** Cross-file invariants, shared by validation and regression tests. */
export function collectionProblems(lessons: Lesson[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>(), slots = new Set<string>(), exercises = new Set<string>();
  const groups = new Map<string, number[]>();
  for (const l of lessons) {
    if (ids.has(l.id)) problems.push(`duplicate lesson id ${l.id}`);
    ids.add(l.id);
    const group = `${l.subject}.${l.category}`, slot = `${group}.${l.order}`;
    if (slots.has(slot)) problems.push(`duplicate lesson slot ${slot}`);
    slots.add(slot);
    groups.set(group, [...(groups.get(group) ?? []), l.order]);
    for (const e of l.exercises) {
      if (exercises.has(e.id)) problems.push(`duplicate exercise id ${e.id}`);
      exercises.add(e.id);
    }
  }
  for (const [group, orders] of groups) for (let i = 1; i <= orders.length; i++) {
    if (!orders.includes(i)) problems.push(`missing ${group}.${i}`);
  }
  return problems;
}
