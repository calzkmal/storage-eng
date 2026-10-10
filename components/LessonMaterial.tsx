import type { Lesson } from "@/lib/schema";
import LessonIntro from "./LessonIntro";
import FractionVisual from "./FractionVisual";
export default function LessonMaterial({ lesson }: { lesson: Lesson }) {
  if (!lesson.material) return <LessonIntro title={lesson.title} intro={lesson.intro ?? ""} />;
  return <article className="space-y-5 text-base leading-relaxed">
    <h1 className="text-2xl font-bold">{lesson.title}</h1>
    <section><h2 className="font-bold">Tujuan belajar</h2><ul className="list-disc pl-5">{lesson.objectives?.map(o => <li key={o}>{o}</li>)}</ul></section>
    {lesson.material.map((b, i) => b.type === "paragraph" ? <section key={i}><h2 className="text-lg font-bold">{b.title}</h2><p className="mt-1">{b.text}</p></section> : b.type === "fraction" ? <FractionVisual key={i} visual={b.visual} /> : <section key={i} className="rounded-xl bg-sky-50 p-4"><h2 className="font-bold">Contoh: {b.question}</h2><ol className="mt-2 list-decimal space-y-1 pl-5">{b.steps.map(step => <li key={step}>{step}</li>)}</ol><p className="mt-2 font-semibold">{b.conclusion}</p></section>)}
  </article>;
}
