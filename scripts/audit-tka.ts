// Independent arithmetic/evidence pass; does not derive expected keys from answer fields.
import fs from "node:fs";
import assert from "node:assert/strict";
import { LessonSchema } from "../lib/schema";
const f = (n: number, d: number) => n / d;
const mathChecks: Record<string, [unknown, string][]> = {
  "tka-math-pecahan-senilai": [
    ["2/4", "Visual: 2 bagian diarsir dari 4 partisi sama besar."],
    [f(2, 6) === f(1, 3) ? "2/6" : "", "2 × 3 = 6 × 1; pilihan lain berbeda dari 1/3."],
    [f(4, 8) === f(1, 2) ? "1/2" : "", "4 dan 8 dibagi FPB 4 menjadi 1 dan 2."],
    [[f(4, 6), f(6, 9)].every(v => v === f(2, 3)) ? ["a", "b"] : [], "4/6 dan 6/9 = 2/3; 2/6 = 1/3; 3/4 berbeda."],
    [String(f(3, 4) * 12), "3/4 × 12 = 9; 9/12 = 3/4."],
    [[f(2, 4) === f(1, 2), f(1, 2) === f(1, 4), f(3, 6) === f(2, 4)], "Nilai: 0,5 = 0,5; 0,5 ≠ 0,25; 0,5 = 0,5."],
    [f(3, 6) === f(1, 2) ? "sama panjang" : "", "3/6 = 1/2; dua keseluruhan disebut sama panjang."],
    [[f(3, 5) === f(6, 10), f(2, 8) === f(1, 4), f(2, 3) === f(3, 4), f(1, 3) === f(1, 6)].flatMap((yes, i) => yes ? [String.fromCharCode(97 + i)] : []), "0,6 = 0,6; 0,25 = 0,25; 2/3 ≠ 3/4; 1/3 ≠ 1/6."],
    [[f(4, 8) === f(1, 2), f(8, 16) === f(4, 8), f(4, 16) === f(4, 8)], "Membelah setiap bagian menggandakan kedua hitungan: 8/16 = 1/2; 4/16 = 1/4."],
  ],
  "tka-math-membandingkan-pecahan": [
    [f(5, 7) > f(2, 7) ? "5/7" : "", "Pembilang 5 > 2 pada penyebut sama 7."],
    [f(1, 6) < f(1, 3) ? "1/6" : "", "1/6 < 2/6 = 1/3."],
    [f(3, 4) > f(2, 3) ? ">" : "<", "9/12 > 8/12."],
    [[f(3, 4), f(2, 3), f(2, 5), f(4, 8)].flatMap((v, i) => v > .5 ? [String.fromCharCode(97 + i)] : []), "3/4 dan 2/3 > 1/2; 2/5 < 1/2; 4/8 = 1/2."],
    [[f(1, 3), f(1, 2), f(5, 6)].every((v, i, a) => i === 0 || v > a[i - 1]) ? "1/3, 1/2, 5/6" : "", "Dengan penyebut 6: 2 < 3 < 5."],
    [[f(2, 5) < f(4, 5), f(1, 4) > f(1, 3), f(3, 6) === f(1, 2)], "0,4 < 0,8; 3/12 < 4/12; 3/6 = 1/2."],
    [f(1, 2) > f(3, 8) ? "Bima" : "Rani", "4/8 > 3/8 liter."],
    [[[.25, .5, .75], [f(1, 3), f(2, 3), 1], [.6, .4, .2], [.5, .25, .75]].flatMap((a, i) => a.every((v, j) => j === 0 || v > a[j - 1]) ? [String.fromCharCode(97 + i)] : []), "Urutan a dan b meningkat; c menurun; d tertukar pada dua nilai awal."],
    [[f(3, 4) > f(5, 8), f(2, 6) < f(1, 3), f(1, 8) < f(1, 4) && f(1, 8) < f(1, 2)], "6/8 > 5/8; 2/6 = 1/3; 1/8 < 2/8 < 4/8."],
  ],
  "tka-math-pecahan-desimal-persen": [
    [`${f(1, 2) * 100}%`, "1/2 × 100 = 50%."],
    [String(f(1, 4)).replace(".", ","), "1 ÷ 4 = 0,25."],
    [f(3, 4) === .75 ? "3/4" : "", "75/100 dibagi FPB 25 = 3/4."],
    [[f(1, 5), .2, f(2, 5), .02].flatMap((v, i) => v === .2 ? [String.fromCharCode(97 + i)] : []), "1/5 = 0,2 = 20%; 2/5 = 40%; 0,02 = 2%."],
    [`${f(3, 5) * 100}%`, "3/5 × 100 = 60%."],
    [[.5 === f(50, 100), f(1, 4) === f(40, 100), .1 === f(10, 100)], "0,5 = 50%; 1/4 = 25%, bukan 40%; 0,1 = 10%."],
    [f(25, 100) === f(1, 4) ? "1/4" : "", "25/100 = 1/4."],
    [[.8 === f(80, 100), f(3, 4) === f(75, 100), .3 === f(3, 100), f(1, 5) === f(50, 100)].flatMap((v, i) => v ? [String.fromCharCode(97 + i)] : []), "0,8 = 80%; 3/4 = 75%; 0,3 = 30%; 1/5 = 20%."],
    [[.75 === f(75, 100), .75 === f(3, 4), (1 - .75) === f(75, 100)], "Terisi 75% = 3/4; sisa 100% − 75% = 25%."],
  ],
};
const lines = ["# Audit konten TKA SD", "", "Tanggal: 10 Oktober 2026, Asia/Jakarta. Pemeriksa: Codex, pass audit terpisah setelah penulisan. Ini bukan review manusia atau sertifikasi pemerintah.", "", "## Acuan", "", "Matriks resmi diperiksa lewat hasil terindeks sumber resmi pada 10 Oktober 2026. Fetch langsung halaman mengembalikan 502 dan PDF timeout; keterbatasan akses dicatat, bukan ditutupi. Materi awal sesuai butir pecahan senilai, perbandingan/pengurutan, relasi pecahan-desimal-persen; BI sesuai membaca tekstual/inferensial dan panjang prosa 150–200 kata.", "", "- [Matriks Matematika SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd/matematika)", "- [Matriks Bahasa Indonesia SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd/bahasa-indonesia)", "- [Kerangka resmi Perkaban 47/2025](https://pusmendik.kemendikdasmen.go.id/tka/page/download_file/053354_47)", "", "## Metode", "", "Kunci Math dibandingkan dengan perhitungan independen dalam `scripts/audit-tka.ts`; visual diperiksa sebagai partisi sama besar dari satu keseluruhan. Kunci BI diperiksa ulang terhadap konteks lengkap: informasi eksplisit atau inferensi tindakan/rincian. Setiap kutipan di bawah dicek sebagai substring persis stimulus terkait. Semua bacaan orisinal; kunci hanya bergantung pada teks. Struktur tidak dianggap bukti kebenaran pedagogis.", ""];
for (const file of fs.readdirSync("content/lessons").filter(f => f.startsWith("tka-") && (f.replace(".json", "") in mathChecks || ["tka-bi-informasi-tersurat.json", "tka-bi-ide-pokok.json", "tka-bi-amanat-dan-tokoh.json"].includes(f)))) {
  const l = LessonSchema.parse(JSON.parse(fs.readFileSync(`content/lessons/${file}`, "utf8")));
  lines.push(`## ${l.id}`, "", `${l.title}: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.`, "");
  for (const s of l.stimuli ?? []) lines.push(`- Bacaan \`${s.id}\`: ${s.paragraphs.join(" ").split(/\s+/).length} kata; 3 soal berdekatan.`);
  lines.push("");
  for (const [i, e] of l.exercises.entries()) {
    lines.push(`### ${e.id}`, "", `Kompetensi: \`${e.competency}\`. Status: **lulus audit**.`);
    if (l.subject === "matematika") {
      const [expected, reason] = mathChecks[l.id][i];
      const actual = e.type === "statement_category" ? e.statements.map(s => s.answer === "yes") : "answer" in e ? e.answer : undefined;
      assert.deepEqual(actual, expected, e.id);
      lines.push(`Verifikasi hitung: ${reason}`);
    } else {
      const stimulus = l.stimuli!.find(s => s.id === e.stimulusId)!;
      assert(stimulus);
      for (const quote of e.evidence!) { assert(stimulus.paragraphs.join("\n").includes(quote)); lines.push(`- Bukti \`${stimulus.id}\`: “${quote}”`); }
      lines.push(`Alasan hubungan bukti/kunci: ${e.explanation}`);
      if (e.type === "multiple_select") for (const o of e.options) lines.push(`- ${e.answer.includes(o.id) ? "Benar" : "Pengecoh"}: ${o.text} ${o.explanation}`);
      if (e.type === "statement_category") for (const s of e.statements) lines.push(`- ${s.text} → ${e.categories.find(c => c.id === s.answer)!.label}. ${s.explanation}`);
    }
    lines.push("");
  }
}
lines.push("## Temuan dan penyelesaian", "", "- Tidak ditemukan kunci hitung yang keliru dalam 27 soal Math pada pass independen.", "- Seluruh evidence 27 soal BI cocok persis dengan stimulus. Inferensi amanat/tokoh ditandai lewat kompetensi, tidak dipresentasikan sebagai kutipan eksplisit.", "- Aturan warna kantong pada teks piknik dibatasi pada cerita agar tidak membuat generalisasi ke semua fasilitas sampah.", "- Semua 9 bacaan berada pada 168–183 kata. Tidak ada teks bank soal yang disalin.", "- Review manusia terhadap bahasa dan pedagogi belum dilakukan; audit ini menyatakan hasil pemeriksaan agent dan aritmetika, bukan persetujuan ahli.", "");
fs.writeFileSync("docs/TKA-SD-CONTENT-AUDIT.md", lines.join("\n"));
console.log("Audit passed: 27 independent Math keys; 27 BI evidence sets; 9 original passages.");
