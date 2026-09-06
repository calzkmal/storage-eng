/**
 * Lesson categories. A lesson carries a `category` number and an `order`
 * within it, so the pair renders as "1.2" and groups the home page.
 */
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

export function categoryTitle(category: number): string {
  return CATEGORIES[category] ?? `Category ${category}`;
}

/** "1.2" */
export function lessonLabel(category: number, order: number): string {
  return `${category}.${order}`;
}
