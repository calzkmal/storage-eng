export const SUBJECTS = {
  english: { title: "Bahasa Inggris", description: "Latihan grammar dan kalimat Bahasa Inggris." },
  matematika: { title: "Matematika", description: "TKA SD kelas 6 · Pecahan, perbandingan, desimal, dan persen." },
  "bahasa-indonesia": { title: "Bahasa Indonesia", description: "TKA SD kelas 6 · Informasi teks, ide pokok, amanat, dan tokoh." },
} as const;
export type Subject = keyof typeof SUBJECTS;
export const SUBJECT_IDS = Object.keys(SUBJECTS) as Subject[];
export function isSubject(value: unknown): value is Subject {
  return typeof value === "string" && Object.hasOwn(SUBJECTS, value);
}
export const subjectHref = (subject: Subject) => `/subjects/${subject}`;
export const COMPETENCIES: Record<string, { subject: Subject; lessonId: string }> = {
  "math.fraction.equivalent": { subject: "matematika", lessonId: "tka-math-pecahan-senilai" },
  "math.fraction.compare": { subject: "matematika", lessonId: "tka-math-membandingkan-pecahan" },
  "math.fraction.forms": { subject: "matematika", lessonId: "tka-math-pecahan-desimal-persen" },
  "bi.textual.explicit": { subject: "bahasa-indonesia", lessonId: "tka-bi-informasi-tersurat" },
  "bi.inferential.main-idea": { subject: "bahasa-indonesia", lessonId: "tka-bi-ide-pokok" },
  "bi.inferential.character": { subject: "bahasa-indonesia", lessonId: "tka-bi-amanat-dan-tokoh" },
  "bi.inferential.message": { subject: "bahasa-indonesia", lessonId: "tka-bi-amanat-dan-tokoh" },
};
