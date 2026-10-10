import type { Subject } from "./subjects";
export const shouldRetry = (subject: Subject, phase: "main" | "review", correct: boolean) => !correct && (subject === "english" || phase === "main");
export const firstScore = (total: number, wrong: number) => ({ correct: Math.max(0, total - wrong), percent: total ? Math.round((Math.max(0, total - wrong) / total) * 100) : 0 });
