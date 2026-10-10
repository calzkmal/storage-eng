import type { Subject } from "./subjects";
// A lesson's `category` and `order` render as "1.2" and group the home page.
export const CATEGORIES: Record<number, string> = {
  1: "Present tenses",
  2: "Past tenses",
  3: "Future tenses",
  4: "Adverbs",
  5: "Affirmative & negative with do",
};

export const CATEGORY_NUMBERS = Object.keys(CATEGORIES)
  .map(Number)
  .sort((a, b) => a - b);

export const SUBJECT_CATEGORIES: Record<Subject, Record<number, string>> = {
  english: CATEGORIES,
  matematika: { 1: "Pecahan" },
  "bahasa-indonesia": { 1: "Pemahaman tekstual", 2: "Pemahaman inferensial" },
};
export function categoryTitle(category: number, subject: Subject = "english"): string {
  return SUBJECT_CATEGORIES[subject][category] ?? `Category ${category}`;
}

/** "1.2" */
export function lessonLabel(category: number, order: number): string {
  return `${category}.${order}`;
}
