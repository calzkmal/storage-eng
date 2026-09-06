"use client";

import { useLearner } from "@/lib/learner";

/** Shows who the saved progress belongs to on this device. */
export default function LearnerGreeting() {
  const learner = useLearner();
  if (!learner) return null;
  return <p className="mt-1 text-base font-semibold text-sky-700">Hi, {learner.name}</p>;
}
