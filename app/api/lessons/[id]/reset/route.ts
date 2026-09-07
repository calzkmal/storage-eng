import { NextResponse } from "next/server";
import { getLesson, isDbConfigured, resetLessonToSeed } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Activates the seeded original set again. Generated sets stay as history. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lesson = await getLesson(id);
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Question database is not configured." }, { status: 503 });
  }
  try {
    const { setId } = await resetLessonToSeed(id);
    return NextResponse.json({ lessonId: id, setId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
