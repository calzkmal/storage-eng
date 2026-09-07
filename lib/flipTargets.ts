import type { FlipSentence } from "./schema";

export type FlipTarget = FlipSentence["target"];

/** Shown above the sentence. */
export const TARGET_LABEL: Record<FlipTarget, string> = {
  negative: "Make it negative",
  present_continuous: "Change it to the present continuous",
  present_perfect: "Change it to the present perfect",
  past: "Change it to the past simple",
  past_continuous: "Change it to the past continuous",
  past_perfect: "Change it to the past perfect",
  future: "Change it to the future",
  future_continuous: "Change it to the future continuous",
  future_perfect: "Change it to the future perfect",
};

/** Used in the AI grading task line. */
export const TARGET_NAME: Record<FlipTarget, string> = {
  negative: "negative",
  present_continuous: "present continuous",
  present_perfect: "present perfect",
  past: "past simple",
  past_continuous: "past continuous",
  past_perfect: "past perfect",
  future: "future with will",
  future_continuous: "future continuous",
  future_perfect: "future perfect",
};

/** Given to the grader as a requirement. */
export const TARGET_REQUIREMENT: Record<FlipTarget, string> = {
  negative: "negative with don't/doesn't + base verb",
  present_continuous: "present continuous (am/is/are + verb-ing)",
  present_perfect: "present perfect (have/has + past participle)",
  past: "past simple (regular -ed or the correct irregular form)",
  past_continuous: "past continuous (was/were + verb-ing)",
  past_perfect: "past perfect (had + past participle)",
  future: "future with will/won't + base verb",
  future_continuous: "future continuous (will be + verb-ing)",
  future_perfect: "future perfect (will have + past participle)",
};
