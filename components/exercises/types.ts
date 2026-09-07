import type { AnswerValue } from "@/lib/grading";

export type ExerciseProps<E> = {
  exercise: E;
  value: AnswerValue | null;
  onChange: (value: AnswerValue | null) => void;
  /** After Check, or while an AI check is in flight. */
  disabled: boolean;
  /** Enter in a text field triggers Check. */
  onSubmit?: () => void;
};
