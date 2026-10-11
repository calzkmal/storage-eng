import MathText from "./MathText";
import type { Lesson } from "@/lib/schema";
import LessonIntro from "./LessonIntro";
import FractionVisual from "./FractionVisual";
export default function LessonMaterial({ lesson }: { lesson: Lesson }) {
  if (!lesson.material) return <LessonIntro title={lesson.title} intro={lesson.intro ?? ""} />;
  return <article className="space-y-5 text-base leading-relaxed">
    <h1 className="text-2xl font-bold"><MathText enabled={lesson.subject === "matematika"}>{lesson.title}</MathText></h1>
    <section><h2 className="font-bold">Tujuan belajar</h2><ul className="list-disc pl-5">{lesson.objectives?.map(o => <li key={o}><MathText enabled={lesson.subject === "matematika"}>{o}</MathText></li>)}</ul></section>
    {lesson.material.map((b, i) => b.type === "paragraph" ? <section key={i}><h2 className="text-lg font-bold"><MathText enabled={lesson.subject === "matematika"}>{b.title}</MathText></h2><p className="mt-1"><MathText enabled={lesson.subject === "matematika"}>{b.text}</MathText></p></section> : b.type === "fraction" ? <FractionVisual key={i} visual={b.visual} /> : <section key={i} className="rounded-xl bg-sky-50 p-4"><h2 className="font-bold">Contoh: <MathText enabled={lesson.subject === "matematika"}>{b.question}</MathText></h2><ol className="mt-2 list-decimal space-y-1 pl-5">{b.steps.map(step => <li key={step}><MathText enabled={lesson.subject === "matematika"}>{step}</MathText></li>)}</ol><p className="mt-2 font-semibold"><MathText enabled={lesson.subject === "matematika"}>{b.conclusion}</MathText></p></section>)}
  </article>;
}
