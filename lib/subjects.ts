export const SUBJECTS = {
  english: { title: "Bahasa Inggris", description: "Latihan grammar dan kalimat Bahasa Inggris." },
  matematika: { title: "Matematika", description: "Latihan SD kelas 6 · Bilangan, geometri, pengukuran, data, dan aljabar." },
  "bahasa-indonesia": { title: "Bahasa Indonesia", description: "Latihan SD kelas 6 · Pemahaman bacaan, evaluasi teks, ejaan, dan tata bahasa." },
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
  "math.number.operations": { subject: "matematika", lessonId: "tka-math-operasi-campuran" },
  "math.fraction.operations": { subject: "matematika", lessonId: "tka-math-operasi-pecahan" },
  "math.number.factors": { subject: "matematika", lessonId: "tka-math-fpb-kpk" },
  "math.number.ratio": { subject: "matematika", lessonId: "tka-math-perbandingan-skala" },
  "math.geometry.plane": { subject: "matematika", lessonId: "tka-math-bangun-datar" },
  "math.geometry.solid": { subject: "matematika", lessonId: "tka-math-bangun-ruang" },
  "math.measurement.units": { subject: "matematika", lessonId: "tka-math-satuan-ukuran" },
  "math.measurement.speed": { subject: "matematika", lessonId: "tka-math-kecepatan-jarak-waktu" },
  "math.data.read": { subject: "matematika", lessonId: "tka-math-penyajian-data" },
  "math.data.center": { subject: "matematika", lessonId: "tka-math-statistika" },
  "math.algebra.pattern": { subject: "matematika", lessonId: "tka-math-pola-bilangan" },
  "math.algebra.equation": { subject: "matematika", lessonId: "tka-math-aljabar-sederhana" },
  "bi.textual.vocabulary": { subject: "bahasa-indonesia", lessonId: "tka-bi-kosakata" },
  "bi.textual.meaning": { subject: "bahasa-indonesia", lessonId: "tka-bi-makna-kata" },
  "bi.textual.organize": { subject: "bahasa-indonesia", lessonId: "tka-bi-ikhtisar-bagan" },
  "bi.inferential.structure": { subject: "bahasa-indonesia", lessonId: "tka-bi-kalimat-utama" },
  "bi.inferential.story": { subject: "bahasa-indonesia", lessonId: "tka-bi-unsur-cerita" },
  "bi.inferential.conclusion": { subject: "bahasa-indonesia", lessonId: "tka-bi-simpulan" },
  "bi.inferential.language": { subject: "bahasa-indonesia", lessonId: "tka-bi-kebahasaan-majas" },
  "bi.evaluation.fact-opinion": { subject: "bahasa-indonesia", lessonId: "tka-bi-fakta-opini" },
  "bi.evaluation.critique": { subject: "bahasa-indonesia", lessonId: "tka-bi-penilaian-teks" },
  "bi.evaluation.genre": { subject: "bahasa-indonesia", lessonId: "tka-bi-jenis-teks" },
  "bi.rules.punctuation": { subject: "bahasa-indonesia", lessonId: "tka-bi-huruf-kapital-tanda-baca" },
  "bi.rules.standard": { subject: "bahasa-indonesia", lessonId: "tka-bi-kata-baku" },
  "bi.rules.relations": { subject: "bahasa-indonesia", lessonId: "tka-bi-sinonim-antonim" },
};

export function compareLessons(a: { subject: Subject; category: number; order: number }, b: { subject: Subject; category: number; order: number }): number {
  return SUBJECT_IDS.indexOf(a.subject) - SUBJECT_IDS.indexOf(b.subject) || a.category - b.category || a.order - b.order;
}
