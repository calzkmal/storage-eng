"use client";

import type { Exercise } from "@/lib/schema";
import type { ExerciseProps } from "./types";
import MultipleSelect from "./MultipleSelect";
import StatementCategory from "./StatementCategory";
import MultipleChoice from "./MultipleChoice";
import FillBlank from "./FillBlank";
import WordOrder from "./WordOrder";
import Matching from "./Matching";
import FlipSentence from "./FlipSentence";
import FreeWrite from "./FreeWrite";

export default function ExerciseView(props: ExerciseProps<Exercise>) {
  const { exercise, ...rest } = props;
  switch (exercise.type) {
    case "multiple_select": return <MultipleSelect exercise={exercise} {...rest} />;
    case "statement_category": return <StatementCategory exercise={exercise} {...rest} />;
    case "multiple_choice":
      return <MultipleChoice exercise={exercise} {...rest} />;
    case "fill_blank":
      return <FillBlank exercise={exercise} {...rest} />;
    case "word_order":
      return <WordOrder exercise={exercise} {...rest} />;
    case "matching":
      return <Matching exercise={exercise} {...rest} />;
    case "flip_sentence":
      return <FlipSentence exercise={exercise} {...rest} />;
    case "free_write":
      return <FreeWrite exercise={exercise} {...rest} />;
  }
}
