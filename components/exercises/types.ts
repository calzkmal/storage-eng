import type { AnswerValue } from "@/lib/grading";

export type ExerciseProps<E> = {
  exercise: E;
  value: AnswerValue | null;
  onChange: (value: AnswerValue | null) => void;
  /** True after Check, or while an AI check is in flight. */
  disabled: boolean;
  /** Keyboard bonus: Enter in a text field triggers Check. */
  onSubmit?: () => void;
};
