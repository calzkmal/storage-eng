"use client";

import dynamic from "next/dynamic";
import type { Lesson } from "@/lib/schema";

/**
 * The runner shuffles exercise order, word banks, and matching columns on the
 * client, so it is loaded client-only to avoid SSR hydration mismatches.
 */
const LessonRunner = dynamic(() => import("./LessonRunner"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-dvh w-full max-w-[640px] flex-col">
      <div className="h-14" />
      <div className="flex-1 px-4 pt-2">
        <div className="h-7 w-2/3 rounded-lg bg-slate-200" />
        <div className="mt-6 h-14 rounded-2xl bg-slate-200" />
        <div className="mt-3 h-14 rounded-2xl bg-slate-200" />
        <div className="mt-3 h-14 rounded-2xl bg-slate-200" />
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className="h-[52px] rounded-2xl bg-slate-200" />
      </div>
    </div>
  ),
});

export default function LessonRunnerLoader(props: { lesson: Lesson; shuffle: boolean }) {
  return <LessonRunner {...props} />;
}
