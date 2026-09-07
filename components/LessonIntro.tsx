"use client";

// The intro is one rule paragraph, then one example sentence per line, so the
// English examples never blend into the Indonesian explanation.
export default function LessonIntro({ title, intro }: { title: string; intro: string }) {
  const [rule, ...examples] = intro
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="mt-4 rounded-3xl border-2 border-sky-100 bg-sky-50 p-5">
      <h1 className="text-xl font-bold text-sky-900">{title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-sky-950">{rule}</p>

      {examples.length > 0 && (
        <>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-sky-700">Contoh</p>
          <ul className="mt-2 flex flex-col gap-2">
            {examples.map((example) => (
              <li
                key={example}
                className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-lg font-semibold text-sky-900"
              >
                {example}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
