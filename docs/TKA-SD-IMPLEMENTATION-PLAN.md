# Implementation Plan: Ekspansi TKA SD Kelas 6

Status: **draft siap untuk handoff; implementasi belum dimulai**.  
Tanggal: **10 Oktober 2026**, Asia/Jakarta.  
Workspace: `/Users/cindyram/Documents/Muti/Prototype`.  
Bahasa produk: Bahasa Indonesia untuk navigasi bersama dan materi TKA; contoh dan konten Bahasa Inggris tetap sesuai mapelnya.

## 1. Tujuan dan hasil yang diharapkan

Perluas prototype latihan Bahasa Inggris menjadi aplikasi belajar dengan tiga pilihan mapel:

1. Bahasa Inggris: seluruh pelajaran dan latihan yang sudah ada.
2. TKA SD kelas 6: Matematika.
3. TKA SD kelas 6: Bahasa Indonesia.

Rilis awal harus menyediakan enam pelajaran TKA yang lengkap, bukan sekadar menu atau daftar materi. Anak dapat memilih mapel, membaca materi, mengerjakan soal, memahami pembahasan, mengulang kesalahan, dan melihat hasil serta progres mapel tersebut.

Prinsip utama:

- Satu tujuan belajar yang jelas per pelajaran.
- Satu soal per layar, dengan stimulus atau bacaan tetap dapat diakses.
- Pembahasan mengajarkan alasan jawaban, bukan hanya menunjukkan kunci.
- Nilai percobaan pertama dibedakan dari latihan ulang.
- Pengalaman belajar tetap nyaman di HP.
- Fondasi Bahasa Inggris dan data pengguna lama tetap berfungsi.
- Konten TKA memakai kunci terverifikasi; latihan tidak bergantung pada layanan AI.

## 2. Instruksi untuk agent pelaksana

Dokumen ini adalah spesifikasi implementasi, bukan bukti bahwa implementasi atau deployment sudah dilakukan.

Sebelum menulis kode:

1. Baca `AGENTS.md` dan instruksi repository yang berlaku.
2. Periksa `git status` dan perubahan pengguna. Jangan menimpa perubahan yang tidak terkait.
3. Baca panduan Next.js lokal yang relevan di `node_modules/next/dist/docs/`, khususnya routing, static rendering, cache, dan route handlers. Versi terpasang saat dokumen dibuat adalah Next.js `16.3.4`.
4. Catat baseline validasi, typecheck, lint, dan build. Kegagalan baseline harus dibedakan dari regresi perubahan ini.
5. Inspeksi seluruh migration berurutan sebelum membuat migration baru; jangan mengandalkan definisi tabel pertama saja.
6. Ikuti keputusan default dalam dokumen ini. Tanyakan hanya jika ada konflik nyata atau perubahan keputusan produk yang berdampak besar.
7. Selesaikan implementasi dan verifikasi lokal yang dapat dilakukan. Jika database uji atau kredensial tidak tersedia, laporkan keterbatasan itu dengan jelas.

Dokumen ini tidak memberi izin tersendiri untuk deployment, publish, atau menjalankan migration dan seed terhadap database produksi. Siapkan perubahan dan instruksi rilis; gunakan otorisasi dari tugas implementasi untuk tindakan eksternal.

## 3. Referensi kurikulum dan batas klaim

Referensi resmi yang diperiksa saat perencanaan:

- [Pusmendik: kerangka Matematika SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd).
- [Pusmendik: kerangka Bahasa Indonesia SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd/bahasa-indonesia).
- [Pusmendik: informasi dan format TKA](https://pusmendik.kemendikdasmen.go.id/tka/).

Matematika mencakup bilangan, geometri dan pengukuran, serta data. Bahasa Indonesia berfokus pada membaca teks informasi dan fiksi, dengan pemahaman tekstual, pemahaman inferensial, serta evaluasi dan apresiasi.

Sebelum menyusun konten final, agent memeriksa kembali matriks resmi dan mencatat tanggal akses. Jika halaman tidak dapat diakses, gunakan dokumen resmi alternatif dan jelaskan sumbernya. Jangan mengganti acuan dengan perkiraan dari situs bank soal.

Enam pelajaran awal adalah pembagian produk yang kita usulkan. Ini bukan keseluruhan silabus TKA, prediksi soal ujian, atau klaim bahwa aplikasi adalah layanan resmi pemerintah. Gunakan label “Latihan TKA SD” atau “Persiapan TKA SD”. Skor latihan adalah skor internal aplikasi, bukan skor resmi TKA.

## 4. Kondisi repository yang sudah diverifikasi

| Bagian | Kondisi saat perencanaan | Implikasi |
| --- | --- | --- |
| Stack | Next.js, React, TypeScript, Tailwind, Zod, Supabase | Gunakan stack dan pola komponen yang tersedia |
| Home | `app/page.tsx` langsung menampilkan pelajaran English Practice | Perlu landing pilihan mapel dan halaman katalog mapel |
| Pelajaran | `content/lessons/*.json`, dibaca `lib/content.ts` | Pertahankan layout flat agar perubahan loader minimal |
| Schema | `lib/schema.ts`: kategori numerik, judul, intro string, exercises | Tambah metadata mapel, materi TKA, stimulus, dan format soal |
| Kategori | `lib/categories.ts` hanya memuat kategori grammar | Kategori harus dibedakan per mapel |
| Runner | `components/LessonRunner.tsx`: materi, main, review, hasil | Reuse alur; sesuaikan stimulus, feedback, dan skor |
| Intro | `LessonIntro.tsx` membaca baris pertama sebagai aturan dan sisanya sebagai contoh | Format ini belum cukup untuk materi terstruktur TKA |
| Jenis soal | MCQ, fill blank, word order, matching, flip sentence, free write | MCQ bisa dipakai; perlu multi-select dan kategori pernyataan |
| Grading | `lib/grading.ts`, sebagian jenis memakai AI | Tambah grading deterministik untuk format TKA |
| Progres lokal | Key `ep:finished`, hasil sesi `ep:result:<lessonId>` | Jangan rename/reset key lama |
| Identitas | Nama lokal; identitas server dari signed HttpOnly cookie | Tetap gunakan identitas yang sama untuk semua mapel |
| Riwayat | `attempts`, fase main/review, snapshot soal/jawaban sebagai string | Tambah konteks TKA dan filter tanpa merusak baris lama |
| Set | Seed + variasi disimpan sebagai exercises JSONB | Pertahankan ID set lama dan model penyimpanan |
| Validasi | Slot unik sekarang `category.order` | Ubah menjadi `subject.category.order` |
| Variasi | Builder khusus grammar; seed variasi menuntut file setiap lesson | Lesson TKA seed-only tidak boleh mematahkan pipeline English |

README menyebut 18 pelajaran English dan 16 set per pelajaran. Agent harus memeriksa jumlah aktual sebagai baseline; angka itu bukan alasan untuk menulis ulang konten English.

## 5. Scope rilis awal

### 5.1 Wajib masuk rilis awal

- Landing dengan tiga pilihan mapel.
- Katalog dan kategori terpisah per mapel.
- Enam pelajaran TKA, masing-masing satu seed set dengan 8–10 soal.
- Materi terstruktur, contoh, visual pecahan, dan bacaan bersama.
- Tiga format latihan: single-choice, multi-select, statement-category.
- Grading lokal, feedback, pengulangan kesalahan, hasil percobaan pertama.
- Progres dan riwayat yang dapat difilter per mapel.
- Dukungan konten lokal dan Supabase dengan perilaku belajar yang setara.
- Migration, seed, validator, dokumentasi, dan verifikasi regresi.

### 5.2 Di luar rilis awal

- Seluruh silabus Matematika dan Bahasa Indonesia sekaligus.
- Timer, simulasi ujian penuh, skor resmi, atau prediksi nilai TKA.
- AI tutor/chat, AI grading TKA, atau generasi soal saat anak membuka pelajaran.
- Akun, login, dashboard orang tua/guru, pembayaran, leaderboard, XP, streak.
- Adaptive learning otomatis atau klaim “sudah menguasai” berdasarkan satu sesi.
- Lima belas variasi TKA per pelajaran.
- Resume sesi yang belum selesai, sinkronisasi progres lintas perangkat, atau mode offline PWA.
- Redesign total dan rename paket npm atau seluruh namespace penyimpanan.

## 6. Keputusan default produk

| Keputusan | Default yang harus dipakai |
| --- | --- |
| Identitas mapel | `english`, `matematika`, `bahasa-indonesia` |
| Judul landing sementara | “Pilih pelajaranmu”; tidak memerlukan keputusan branding baru |
| Navigasi bersama | Bahasa Indonesia: Materi, Latihan, Periksa, Lanjut, Progres, Riwayat |
| ID lesson English | Tetap persis seperti sekarang |
| ID lesson TKA | Prefix `tka-math-` atau `tka-bi-`, unik secara global |
| Konten rilis awal | 6 lesson, 1 seed set per lesson, 8–10 soal per set |
| Panjang bacaan latihan BI | Target 150–200 kata per bacaan prosa, selaras kerangka yang diperiksa; periksa lagi sebelum final |
| Skor | 1 poin per soal benar pada percobaan pertama; tanpa poin parsial |
| Review TKA | Satu putaran ulang untuk setiap soal yang salah pada main |
| AI | TKA seluruhnya lokal; English mempertahankan jalur grading sekarang |
| Urutan soal TKA | Urutan terkurasi; kelompok bacaan tetap berdekatan |
| Penyimpanan | Pertahankan JSON flat dan tables yang ada, tambah field seperlunya |
| Progres | Set selesai, bukan nilai penguasaan kompetensi |

Catatan review: runner sekarang dapat memasukkan kembali jawaban salah saat fase review, sehingga anak bisa terus mengulang. Untuk TKA, batasi menjadi satu putaran ulang agar anak tidak terjebak. Perubahan ini khusus TKA; jangan mengubah perilaku English tanpa kebutuhan yang teruji. Keputusan ini memperjelas konsep “ulang soal salah” untuk rilis awal.

## 7. Requirements fungsional

### FR-01 — Pemilihan mapel

- `/` menampilkan kartu Bahasa Inggris, Matematika, dan Bahasa Indonesia.
- Kartu TKA menyebut “TKA SD kelas 6” dan menjelaskan fokus singkat.
- Setiap kartu membuka katalog mapel yang benar.
- Nama learner dan tautan Progres/Riwayat tetap dapat diakses.
- Pemilihan mapel tidak membuat identitas learner baru.

### FR-02 — Katalog dan navigasi

- Tambahkan `/subjects/[subject]` sebagai katalog mapel.
- Katalog hanya memuat lesson milik mapel tersebut.
- Tampilkan kategori, judul, jumlah soal, serta set selesai/total set.
- Lesson tetap memakai `/lesson/[id]`, `/sets`, dan `/done` yang tersedia.
- Back dari lesson dan hasil kembali ke katalog mapelnya.
- Semua link lama ke lesson English tetap valid.
- Subject atau lesson tidak dikenal menampilkan not-found, bukan katalog kosong palsu.
- Katalog tidak menampilkan bab yang belum dibuat seolah-olah dapat dimainkan.

### FR-03 — Materi sebelum latihan

- Pelajaran TKA memiliki tujuan belajar, 2–4 bagian penjelasan singkat, dan 2–3 contoh.
- Contoh Matematika menunjukkan langkah dan alasan; minimal satu visual yang relevan pada setiap lesson pecahan.
- Contoh BI menunjukkan cara menemukan bukti teks; pisahkan jawaban eksplisit dan kesimpulan.
- Tampilkan tombol “Mulai latihan” yang jelas.
- Anak dapat membuka materi dari runner tanpa kehilangan jawaban yang sedang dipilih.
- Legacy intro English tetap dapat dirender tanpa konversi massal.

### FR-04 — Bacaan dan stimulus

- Satu bacaan dapat dipakai beberapa soal melalui `stimulusId`.
- Bacaan muncul sebelum pertanyaan dan tetap tersedia sebelum/sesudah Periksa.
- Di HP, bacaan boleh dilipat/dibuka; state pilihan jawaban tidak hilang.
- Saat masuk ke bacaan baru, judul dan konteks baru harus jelas.
- Saat review, soal tetap merujuk bacaan yang benar.
- Pada lesson TKA, `?shuffle=1` tidak boleh memecah kelompok atau menghilangkan stimulus. Default sederhana: abaikan shuffle soal TKA.
- Stimulus berupa teks biasa terstruktur dan visual tervalidasi; tidak menerima arbitrary HTML.

### FR-05 — Single-choice

- Gunakan format `multiple_choice` yang sudah ada jika kompatibel.
- Satu pilihan aktif; Periksa hanya aktif setelah anak memilih.
- Pilihan terkunci setelah diperiksa.
- Jawaban benar dan penjelasan terlihat jelas tanpa mengandalkan warna saja.

### FR-06 — Multi-select

- Tambah jenis `multiple_select`.
- Instruksi: “Pilih semua jawaban yang benar. Jawaban benar lebih dari satu.”
- 3–5 pilihan dengan ID stabil, sedikitnya dua jawaban benar dan sedikitnya satu pengecoh.
- Anak dapat mencentang dan membatalkan pilihan sebelum Periksa.
- Benar hanya jika himpunan ID pilihan sama persis dengan kunci; urutan tidak memengaruhi nilai.
- Kurang satu jawaban, tambahan jawaban salah, atau semua pilihan dicentang dinilai salah.
- Setelah Periksa, jelaskan jawaban benar, jawaban terlewat, dan pilihan yang keliru.

### FR-07 — Kategori pernyataan

- Tambah jenis `statement_category` dengan 2–4 pernyataan.
- Setiap pernyataan memiliki ID, teks, kategori kunci, dan penjelasan.
- Kategori dikonfigurasi per soal, misalnya Benar/Salah atau Sesuai/Tidak Sesuai.
- Periksa aktif hanya jika seluruh pernyataan sudah dijawab.
- Seluruh kategori harus tepat agar soal mendapat 1 poin.
- Feedback menunjukkan hasil dan penjelasan setiap pernyataan.
- Gunakan susunan vertikal di HP; tidak mewajibkan tabel lebar.

### FR-08 — Feedback edukatif

- Setiap soal memiliki pembahasan spesifik yang tetap terlihat jika jawaban benar.
- Matematika: tunjukkan langkah, konsep, dan satu miskonsepsi yang relevan.
- BI: tampilkan bukti dari bacaan dan jelaskan hubungan bukti dengan jawaban.
- Jangan hanya memakai “Jawaban benar adalah B” atau pujian generik.
- Hindari mempermalukan anak. Gunakan “Coba lihat langkah ini” atau “Perhatikan bagian bacaan ini”.
- Tidak ada panggilan API AI untuk mengecek jawaban TKA.

### FR-09 — Hasil dan pengulangan

- Catat benar/salah main saat Periksa pertama kali; perubahan state atau klik ganda tidak menggandakan skor.
- Persentase = `benarMain / jumlahSoalMain × 100`, dibulatkan konsisten ke bilangan bulat terdekat.
- Multi-select dan statement-category dihitung satu soal, bukan jumlah opsi/pernyataan.
- Setelah main, tampilkan bahwa review adalah latihan ulang; skor awal tidak berubah.
- Soal salah main diulang satu kali pada fase review TKA.
- Jawaban salah pada review tidak masuk antrean lagi; tetap diberi pembahasan.
- Selesai main dan review berarti set selesai, meskipun masih ada salah di review.
- Hasil menyebut “Hasil percobaan pertama”, jumlah benar/total, dan materi yang perlu diulang.
- Tautan materi ulang berasal dari kompetensi soal salah, deduplikasi, dan hanya menunjuk lesson yang tersedia.
- Jangan memakai label “penguasaan” atau “lulus TKA”.

### FR-10 — Progres per mapel

- `/progress` mendukung Semua, Bahasa Inggris, Matematika, Bahasa Indonesia.
- Gunakan query `?subject=...` untuk filter yang dapat ditautkan.
- Hitungan selesai/total memakai hanya lesson pada filter aktif.
- Semua mapel dikelompokkan terlebih dahulu per subject, kemudian kategori.
- Set lokal `file:<lessonId>` tetap dihitung sesuai mekanisme existing.
- Nilai 100% progres berarti seluruh set tersedia selesai, bukan seluruh silabus TKA dikuasai.
- Empty state dan storage tidak tersedia tidak menyebabkan crash.

### FR-11 — Riwayat per mapel

- `/history` memiliki filter mapel yang konsisten dengan progres.
- Riwayat menampilkan mapel, lesson, soal, jawaban anak, jawaban benar, serta fase main/review.
- TKA multi-select dan pernyataan ditampilkan dengan label yang terbaca, bukan JSON mentah.
- Riwayat BI menyertakan konteks bacaan yang diperlukan untuk memahami soal.
- Riwayat lama tanpa field baru tetap tampil; jangan memaksakan snapshot baru pada baris lama.
- Identitas tetap berasal dari signed cookie; filter mapel tidak memperluas akses learner.
- Hapus riwayat/profil mempertahankan perilaku existing dan mencakup semua mapel; label jelaskan scope penghapusan.

### FR-12 — Content pipeline dan fallback

- Seluruh lesson TKA lolos validasi otomatis sebelum build/seed.
- Konten lokal memungkinkan seluruh lesson TKA dimainkan tanpa Supabase dan tanpa AI key.
- Ketika Supabase tidak dapat dihubungi, konten TKA lokal tetap lengkap termasuk materi dan stimulus.
- `seed:supabase` menyimpan metadata, materi, dan stimulus baru selain exercises.
- `build:variations` tidak menjalankan builder grammar untuk TKA.
- `seed:variations` tidak gagal hanya karena TKA belum punya file variasi.
- Kelengkapan variasi English tetap diperiksa; jangan sekadar skip semua file hilang.
- Tidak menghapus/recreate set English yang sudah dipakai learner sebagai bagian penambahan TKA.

## 8. Requirements nonfungsional

| ID | Requirement | Cara verifikasi |
| --- | --- | --- |
| NFR-01 | Mobile nyaman pada 360, 390, dan 768 px | Periksa landing, katalog, materi, tiga jenis soal, feedback, dan hasil |
| NFR-02 | Tidak ada horizontal overflow halaman | Visual QA pada viewport yang ditentukan |
| NFR-03 | Target klik minimal 44 × 44 px, fokus terlihat | Inspeksi komponen dan navigasi keyboard |
| NFR-04 | Label checkbox/radio terbaca screen reader; warna bukan satu-satunya indikator | Inspeksi markup, keyboard, dan feedback |
| NFR-05 | Teks bacaan mudah dibaca; ukuran sekitar 16–18 px dengan line-height memadai | Visual QA teks terpanjang |
| NFR-06 | Materi/katalog tidak menunggu AI atau fetch per soal | Network inspection satu sesi TKA |
| NFR-07 | Signed cookie, RLS, server-only credentials, dan rate limits tetap terjaga | Review diff API dan migration |
| NFR-08 | Semua path utama bebas runtime/hydration error | Browser QA dan production build |
| NFR-09 | Tidak ada library besar hanya untuk pecahan sederhana | Review dependency diff |
| NFR-10 | JSON konten tidak merender arbitrary HTML/JS | Schema dan renderer memakai field terkontrol |

## 9. Spesifikasi enam pelajaran awal

Gunakan kategori numerik yang independen per subject. Untuk rilis awal, Math memakai kategori 1 “Pecahan”; BI memakai kategori 1 “Pemahaman tekstual” dan kategori 2 “Pemahaman inferensial”. Setiap kategori memiliki order kontigu mulai dari 1.

| ID lesson | Category/order | Tujuan | Kompetensi soal |
| --- | --- | --- | --- |
| `tka-math-pecahan-senilai` | 1/1 | Memahami bagian dari keseluruhan dan mengenali pecahan senilai | `math.fraction.equivalent` |
| `tka-math-membandingkan-pecahan` | 1/2 | Membandingkan dan mengurutkan pecahan dengan alasan | `math.fraction.compare` |
| `tka-math-pecahan-desimal-persen` | 1/3 | Menghubungkan pecahan sederhana, desimal, dan persen | `math.fraction.forms` |
| `tka-bi-informasi-tersurat` | 1/1 | Menemukan informasi yang dinyatakan langsung dalam teks | `bi.textual.explicit` |
| `tka-bi-ide-pokok` | 2/1 | Menyimpulkan ide pokok dan mengenali gagasan pendukung | `bi.inferential.main-idea` |
| `tka-bi-amanat-dan-tokoh` | 2/2 | Menyimpulkan sifat tokoh dan amanat dari tindakan/peristiwa | `bi.inferential.character`, `bi.inferential.message` |

### 9.1 Komposisi soal

- Math: target 9 soal per lesson, terdiri dari 5 single-choice, 2 multi-select, 2 statement-category.
- BI: target 9 soal per lesson, terdiri dari 5 single-choice, 2 multi-select, 2 statement-category.
- Jumlah final boleh 8–10 jika alasan pedagogis jelas; setiap lesson tetap memakai ketiga format.
- BI: 2–3 bacaan per lesson, masing-masing untuk 3–4 soal; tidak ada soal tanpa konteks yang diperlukan.
- Lesson informasi tersurat: gunakan bacaan informasi sederhana dengan topik dekat keseharian anak.
- Lesson ide pokok: gunakan teks informasi yang punya gagasan utama dan pendukung jelas.
- Lesson amanat/tokoh: gunakan cerita fiksi orisinal dengan konflik sederhana dan bukti tindakan tokoh.
- Main set bergerak dari pemahaman dasar menuju penerapan/penalaran; label level adalah internal produk, bukan klaim distribusi resmi TKA.

### 9.2 Standar konten

- Buat bacaan dan soal orisinal; jangan menyalin bank soal atau cerita berhak cipta tanpa izin.
- Hindari pertanyaan yang memerlukan pengetahuan di luar teks pada lesson tersurat/ide pokok.
- Pecahan pada visual memiliki bagian sama besar; area dan hitungan harus sesuai.
- Perbandingan visual memakai keseluruhan dengan ukuran sama agar tidak menyesatkan.
- Pecahan sederhana, desimal, dan persen menggunakan nilai yang tepat dan sesuai tujuan awal.
- Gunakan koma desimal pada tampilan Bahasa Indonesia secara konsisten.
- Pilihan salah masuk akal dan menggambarkan miskonsepsi, bukan jawaban asal.
- Bukti BI harus berupa kutipan persis yang ada dalam stimulus terkait.
- Setiap kunci diverifikasi dengan perhitungan atau bukti teks yang dapat diaudit.
- Lakukan pemeriksaan terpisah dari proses penulisan; validator struktur tidak menggantikan pemeriksaan isi.

## 10. Rancangan data yang direkomendasikan

Ini kontrak konseptual. Agent boleh memperbaiki nama/detail kecil agar cocok dengan kode, tetapi perilaku, validasi, dan kompatibilitas di bawah wajib dipenuhi. Jangan membangun CMS atau framework konten generik.

### 10.1 Lesson

Pertahankan `id`, `category`, `order`, `title`, `intro`, dan `exercises`. Tambahkan:

| Field | Tipe/aturan |
| --- | --- |
| `subject` | Enum tiga subject; default `english` untuk payload legacy |
| `level` | Untuk TKA: `{ stage: "sd", grade: 6, program: "tka" }`; optional pada English |
| `objectives` | Array 1–3 tujuan, wajib TKA |
| `material` | Array blok materi terkontrol, wajib TKA |
| `stimuli` | Array stimulus dengan ID unik dalam lesson; optional untuk Math, wajib untuk BI |

Blok materi cukup mendukung paragraph, worked example, dan fraction visual. Worked example memiliki pertanyaan, langkah, dan kesimpulan. Render legacy `intro` jika `material` tidak ada.

Stimulus cukup mendukung teks: ID, judul, array paragraf, dan atribusi jika memang diperlukan. Visual pecahan dapat menjadi field terstruktur pada materi/soal; gunakan renderer yang sama agar konsisten.

Untuk MVP, stimuli berada pada lesson dan seed set hanya merujuk ID. Jika variasi BI dibuat kelak, harus ada kontrak stimulus per-set atau ID baru yang tetap tersedia; itu bukan pekerjaan rilis awal. Jangan merancang variasi yang mengganti teks stimulus yang sudah dipakai soal lama.

### 10.2 Exercise

Pertahankan union exercise existing. Untuk soal TKA, tambahkan field:

- `competency`: satu kode kompetensi yang terdaftar dan sesuai subject.
- `stimulusId`: optional pada Math, wajib pada BI.
- `visual`: optional fraction model terstruktur.
- `evidence`: optional daftar kutipan persis; wajib BI.
- `explanation`: tetap wajib untuk semua exercise.

`multiple_select`:

- `question`: teks pertanyaan.
- `options`: `{ id, text, explanation }[]`.
- `answer`: array ID benar yang unik, minimal dua.
- `explanation` umum tetap ada untuk pembahasan konsep.

`statement_category`:

- `question`: instruksi/konteks pertanyaan.
- `categories`: dua kategori `{ id, label }` dengan ID unik.
- `statements`: `{ id, text, answer, explanation }[]`.
- `answer` setiap pernyataan merujuk ID kategori yang tersedia.

Single-choice boleh tetap memakai jawaban berbasis string untuk menghindari migrasi English. Jika ID-based options diperkenalkan, harus ada adapter legacy dan pengujian kompatibilitas; tidak wajib untuk rilis ini.

### 10.3 Fraction visual

Gunakan model sederhana, misalnya `{ numerator, denominator }`, dan label aksesibel. Numerator/denominator integer, denominator positif; visual bagian dari satu keseluruhan membatasi `0 <= numerator <= denominator`. Batasi denominator yang dirender, misalnya maksimal 12 untuk rilis awal.

Gunakan SVG/HTML/CSS lokal. Semua partisi memiliki ukuran sama; `aria-label` menyebut nilai pecahan. Jangan menggunakan image generation atau dependency chart untuk visual ini.

### 10.4 Jawaban dan feedback

`AnswerValue` existing memiliki string, string array, dan map. Reuse string array untuk multi-select dan map statement ID → category ID; dispatch selalu berdasarkan exercise type agar tidak tertukar dengan word order/matching.

Feedback TKA perlu menyimpan detail per opsi/pernyataan. Tambahkan tipe terstruktur minimal untuk detail ini; jangan memasukkan markup panjang ke string kunci jawaban.

`correctAnswerText`, `answerText`, `exerciseSummary`, `canCheck`, `gradeLocal`, retry, hasil, dan history renderer harus menangani seluruh tipe baru secara konsisten.

### 10.5 Validasi konten

Tambahkan pemeriksaan:

- `subject.category.order` unik dan order kontigu per subject/category.
- Subject/category terdaftar; metadata TKA wajib lengkap.
- ID lesson global unik; ID exercise global unik untuk seed files.
- Stimulus reference ada; ID stimulus tidak duplikat.
- BI wajib memiliki evidence dan evidence terdapat pada stimulus terkait.
- Kompetensi sesuai mapel dan dikenal dalam registry.
- Multi-select: option ID unik, kunci subset opsi, kunci unik, jumlah benar/pengecoh memenuhi aturan.
- Statement-category: ID unik, kategori lengkap, setiap kunci kategori valid.
- Fraction visual integer/range valid.
- Setiap TKA lesson 8–10 soal, tanpa exercise English-only atau AI-graded.
- Kelengkapan keenam jenis English existing diperiksa pada kumpulan English, bukan diwajibkan pada setiap mapel.
- Variations tetap divalidasi terhadap union schema baru tanpa mewajibkan TKA punya variasi.

## 11. Database, API, dan kompatibilitas

### 11.1 Migration additive

Buat migration baru; jangan edit migration historis yang sudah diterapkan.

Perubahan rekomendasi pada `lessons`:

- `subject text not null default 'english'`, dengan check tiga subject.
- `level jsonb`, `objectives jsonb`, `material jsonb`, `stimuli jsonb` nullable untuk kompatibilitas legacy.
- Tambahkan constraint/index hanya yang benar-benar diperlukan query baru.
- Audit view `lesson_sets`, `lesson_active`, dan `lesson_overview`; perbarui view yang masih dipakai loader atau script.
- Pada `CREATE OR REPLACE VIEW`, perhatikan kompatibilitas urutan/nama kolom existing; jangan menyebabkan drop cascade pada objek lain.
- Pertahankan `security_invoker`, RLS, dan revoke grants existing.

Perubahan rekomendasi pada `attempts`:

- `subject text not null default 'english'` agar history lama langsung dapat difilter.
- `competency text` nullable.
- `context jsonb` nullable untuk snapshot TKA minimal: versi context, stimulus yang dipakai, evidence, dan detail opsi/pernyataan yang diperlukan saat replay.
- Jangan memasukkan seluruh lesson/set ke setiap attempt.
- Pertahankan kolom question/user_answer/correct_answer untuk display legacy; nilai baru ditulis sebagai teks yang mudah dibaca.

Snapshot memastikan bacaan dan pembahasan history tidak berubah hanya karena file konten diedit. Context harus berasal dari exercise/stimulus yang tervalidasi, bukan HTML bebas. Batasi ukuran dan struktur context pada API; default batas 16 KiB per context dan tetap di bawah batas body keseluruhan yang ada. Periksa apakah batas string existing 600 karakter perlu disesuaikan untuk display format baru; jangan memperlebar tanpa kebutuhan.

### 11.2 API dan loader

- Update tipe lesson overview, set row, select DB, mapping, seed upsert, dan fallback.
- Pastikan metadata tidak hilang antara parsing JSON, query DB, props page, dan runner.
- Tulis subject/competency/context pada attempt TKA; legacy request tanpa field baru default ke English.
- Validasi subject enum, context schema, dan kombinasi field sebelum insert.
- Jika metadata subject dinilai dari request, dokumentasikan bahwa ini telemetry latihan, bukan nilai resmi/otoritatif. Jangan mengurangi pemeriksaan learner cookie.
- History filter divalidasi server-side; selalu batasi query ke learner yang sedang aktif.
- Perhatikan pagination history: filter harus diterapkan sebelum limit/pagination, bukan sesudah memfilter satu halaman di client.
- Jika cursor/pagination sudah ada, reset saat subject berubah dan cegah response filter lama menimpa yang baru.
- Cache katalog tidak boleh bergantung pada identitas learner; status personal tetap di client.

### 11.3 Preservasi data dan script

- Jangan rename ID lesson, exercise, set, cookie, dan localStorage English.
- Existing records yang tidak memiliki subject diperlakukan sebagai English.
- Jangan memanggil seed `--force` terhadap seluruh konten sebagai jalan pintas.
- Penambahan TKA memakai seed idempotent; menjalankan ulang tidak menggandakan seed set.
- Script `seed:variations` sekarang menghapus variasi lalu membuat ulang, yang dapat memengaruhi `learner_sets` melalui cascade. Jangan menjalankannya sebagai bagian rutin ekspansi TKA. Ini risiko existing yang perlu dicatat, bukan alasan melakukan refactor unrelated.
- Perbaiki pemilihan lesson eligible pada builder/seed variasi agar TKA seed-only valid dan pipeline English tetap ketat.
- Jika migration belum diterapkan pada DB configured, tampilkan/log diagnosis yang jelas; jangan mengklaim metadata tersimpan jika DB path diam-diam gagal.

## 12. Peta file implementasi

Path berikut relatif terhadap workspace; nama file baru adalah rekomendasi.

| Area | File yang perlu diperiksa/diubah |
| --- | --- |
| Subject registry | Baru `lib/subjects.ts`; `lib/categories.ts` |
| Content schema | `lib/schema.ts`; baru registry kompetensi jika diperlukan |
| Loader/seed | `lib/content.ts`, `scripts/seed-supabase.ts` |
| Landing/catalog | `app/page.tsx`; baru `app/subjects/[subject]/page.tsx`; `components/LessonList.tsx`, `LessonCard.tsx` |
| Material/stimulus | `LessonIntro.tsx`; komponen baru materi, stimulus, dan FractionVisual |
| Exercises | `components/exercises/ExerciseView.tsx`, `types.ts`; dua komponen baru |
| Grading | `lib/grading.ts`, `FeedbackPanel.tsx` |
| Lesson flow | `LessonRunner.tsx`, `LessonDone.tsx`, `LessonSets.tsx`, TopBar/BottomBar |
| Routes existing | `app/lesson/[id]/page.tsx`, `/sets/page.tsx`, `/done/page.tsx` |
| Result/progress | `lib/storage.ts`, `app/progress/page.tsx`, `ProgressView.tsx` |
| History/API | `lib/learner.ts`, `app/api/attempts/route.ts`, `app/api/history/route.ts`, `HistoryView.tsx` |
| Validation/variations | `scripts/validate-content.ts`, `scripts/build-variations.ts`, `scripts/seed-variations.ts` |
| Database | Migration baru di `supabase/migrations/` |
| Content | Enam JSON baru di `content/lessons/` |
| Documentation | `README.md`; audit konten dan laporan verifikasi di `docs/` |

Jangan ubah prompt/grammar scope AI English kecuali perubahan tipe membutuhkan kompatibilitas. Jenis TKA tidak masuk jalur AI.

## 13. Urutan implementasi dan acceptance gate

### Tahap 0 — Baseline dan pemetaan

Tasks:

- Jalankan pemeriksaan existing dan catat hasil.
- Hitung lesson/set English aktual.
- Baca docs Next.js lokal yang relevan.
- Audit seluruh aliran metadata, grading, API history, cache, dan views DB.

Gate: agent memiliki baseline jelas dan tidak ada keputusan kritis yang tersembunyi.

### Tahap 1 — Fondasi multi-mapel

Tasks:

- Subject registry, kategori per subject, default legacy.
- Extend lesson schema dan loader/seed mapping.
- Landing tiga mapel dan route katalog.
- Subject-aware labels/back links.
- Siapkan migration additive dan tipe DB.

Gate: English dapat dibuka dari landing baru, lesson lama tetap valid, filter katalog tidak mencampur kategori. TKA yang belum punya konten tidak ditampilkan sebagai lesson playable.

### Tahap 2 — Dua pelajaran contoh lengkap

Tasks:

- Implement material renderer, FractionVisual, shared stimulus.
- Implement multi-select dan statement-category beserta grading dan feedback.
- Selesaikan `tka-math-pecahan-senilai` dan `tka-bi-informasi-tersurat`.
- Implement review TKA satu putaran, hasil main, dan access materi ulang.
- Sambungkan snapshot attempt/history yang diperlukan.

Gate: kedua pelajaran selesai dari landing sampai hasil tanpa AI, dengan semua format soal dan stimulus saat review. Ini checkpoint untuk menilai UX; tidak perlu menghentikan implementasi jika agent sudah diberi otorisasi menyelesaikan seluruh rilis awal.

### Tahap 3 — Lengkapi konten dan pipeline

Tasks:

- Tulis empat lesson sisanya.
- Tambah validator lintas subject, evidence, visual, dan kunci.
- Pisahkan eligibility builder/seed variasi.
- Periksa isi tiap soal dan buat catatan audit.
- Verifikasi local fallback dan DB path pada environment uji yang tersedia.

Gate: 6 lesson TKA, total 48–60 soal, seluruh content valid; pipeline English tidak gagal karena TKA seed-only.

### Tahap 4 — Progres, riwayat, dan integrasi

Tasks:

- Subject filters, empty states, pagination/filter reset.
- Riwayat format baru dengan konteks bacaan.
- Hasil percobaan pertama dan rekomendasi materi berdasarkan kompetensi.
- Uji data legacy, finish state, replay set, dan browser navigation.

Gate: progres/history konsisten lintas mapel dan skor tidak naik akibat review.

### Tahap 5 — Verifikasi dan handoff

Tasks:

- Jalankan pemeriksaan otomatis yang relevan dan browser QA.
- Perbaiki defect dalam scope ini.
- Update README untuk setup migration, seed, struktur subject, dan fitur baru.
- Buat laporan verification dengan hasil aktual, bukan checklist yang diasumsikan lulus.
- Siapkan instruksi rilis dan risiko data existing.

Gate: seluruh success criteria di bagian 15 terverifikasi atau dinyatakan belum terverifikasi beserta blocking condition nyata. Jangan menyatakan selesai penuh bila gate wajib belum diuji.

## 14. Strategi verifikasi

### 14.1 Pemeriksaan repository

Jalankan baseline dan setelah perubahan:

```bash
npm run validate
npm run typecheck
npm run lint
npm run build
```

`build` menjalankan validasi melalui prebuild. Jangan menggunakan `next dev` sebagai satu-satunya bukti cache/routing production bekerja.

### 14.2 Pengujian logika yang bermakna

Repository belum memiliki test script pada `package.json` yang diperiksa. Tambahkan test ringan dengan runtime existing bila diperlukan; tidak perlu framework besar. Fokus pada grading, schema, dan backward compatibility:

| Kasus | Expected |
| --- | --- |
| Legacy lesson tanpa subject/material | Parse sebagai English, intro lama berfungsi |
| Math category 1/order 1 dan English category 1/order 1 | Valid karena slot subject berbeda |
| Dua Math lesson dengan slot sama | Validator gagal |
| Multi-select kunci A,C; jawaban C,A | Benar |
| Multi-select kunci A,C; jawaban A | Salah |
| Multi-select kunci A,C; jawaban A,B,C | Salah |
| Duplicate/unknown option ID dalam konten atau jawaban | Ditolak/ditangani secara eksplisit, tidak membuat hasil benar palsu |
| Statement-category semua tepat | Benar |
| Statement-category satu keliru | Salah dan feedback menunjuk pernyataan tersebut |
| Statement-category belum lengkap | Periksa disabled |
| StimulusId hilang/evidence tidak terdapat di bacaan | Validator gagal |
| Visual denominator nol/bagian melebihi total | Validator gagal |
| Salah di main kemudian benar di review | Skor main tetap salah; review tidak menaikkan skor awal |
| Salah di review TKA | Tidak masuk antrean review lagi; sesi tetap dapat selesai |
| History legacy tanpa context | Render existing berhasil |
| History TKA context | Label pilihan/pernyataan dan bacaan terbaca |

### 14.3 Browser QA end-to-end

Periksa minimal pada 360, 390, 768 px:

1. Learner existing membuka landing dan masuk English tanpa kehilangan progres.
2. Learner baru memilih nama lalu menyelesaikan lesson TKA.
3. Jalankan satu Math dan satu BI lesson dengan pola jawaban benar/salah campuran.
4. Coba ketiga format, buka tutup materi/bacaan, lalu Periksa.
5. Pastikan jawaban tidak hilang saat membuka materi dan bacaan.
6. Pastikan feedback panjang tidak tertutup bottom bar dan scroll tidak macet.
7. Review soal BI tetap memakai bacaan tepat; review salah dapat selesai.
8. Hasil main sesuai perhitungan manual, progres selesai bertambah satu set.
9. History filter hanya menampilkan mapel yang dipilih; pindah filter cepat tidak mencampur response.
10. Buka ulang set selesai dan URL lesson English lama.
11. Coba unknown subject/lesson, empty history, unavailable storage, dan DB failure jika environment memungkinkan.
12. Periksa keyboard: tab, radio/checkbox, buka bacaan, submit, continue.
13. Network panel: tidak ada request AI dalam sesi TKA.

Reload di tengah sesi mengikuti perilaku existing; resume bukan requirement rilis awal. Refresh hasil harus tidak crash jika session result tidak tersedia.

### 14.4 Database QA

Gunakan database lokal/disposable atau environment uji yang sudah diotorisasi:

- Apply semua migrations dari baseline dan migration baru.
- Verifikasi lesson lama default English.
- Seed enam lesson; ulangi seed dan pastikan tidak menggandakan set.
- Verifikasi query view memuat subject/material/stimuli.
- Simulasikan attempts main/review untuk TKA dan legacy.
- Uji filter history di server, termasuk pagination.
- Periksa learner_sets dan set English lama tidak berkurang karena seed TKA.
- Verifikasi fallback lokal saat database tidak tersedia.

Jika DB uji tidak tersedia, migration dapat disiapkan dan direview, tetapi tandai pengujian DB sebagai pending. Build sukses saja tidak membuktikan migration SQL benar.

## 15. Success criteria dan definition of done

Rilis awal dinyatakan selesai ketika semua kriteria berikut terpenuhi:

| ID | Success criterion | Bukti minimum |
| --- | --- | --- |
| SC-01 | Landing membuka tiga katalog mapel yang benar | Browser QA ketiga kartu |
| SC-02 | Semua lesson English existing dan URL-nya tetap berfungsi | Baseline comparison + smoke semua jenis English |
| SC-03 | Ada tepat enam lesson TKA rilis awal, masing-masing 8–10 soal | Validator dan inventaris konten |
| SC-04 | Seluruh TKA lesson mempunyai tujuan, materi, 2–3 contoh, dan pembahasan lengkap | Content audit per lesson |
| SC-05 | Ketiga format soal bekerja dan dinilai benar sesuai aturan | Pengujian grading + browser QA |
| SC-06 | Bacaan selalu tersedia pada main, feedback, dan review BI | Browser QA dengan soal dari bacaan berbeda |
| SC-07 | Semua kunci Math memiliki verifikasi hitung; BI memiliki bukti teks | Dokumen content audit dengan checklist exercise ID |
| SC-08 | Skor main tidak berubah oleh review; review TKA tidak membuat loop tanpa akhir | Pengujian state dan sesi jawaban salah |
| SC-09 | Progres/history filter benar dan legacy data tetap terbaca | QA dengan data campuran |
| SC-10 | Sesi TKA lengkap berjalan tanpa Supabase/AI key | Browser QA local fallback + network inspection |
| SC-11 | DB path menyimpan metadata/stimulus/attempt context dengan benar | Pengujian migration dan seed pada DB uji |
| SC-12 | Script English variations tetap bekerja dan tidak menuntut variasi TKA | Validasi/build script, tanpa mutation DB produksi |
| SC-13 | Tidak ada overflow pada viewport target; controls dapat dipakai keyboard | Visual QA dan accessibility smoke |
| SC-14 | Validate, typecheck, lint, build lulus tanpa regresi baru | Log ringkas pemeriksaan aktual |
| SC-15 | README, migration instructions, content audit, dan verification report tersedia | File handoff final |

SC-11 harus tetap pending jika DB uji tidak tersedia; jangan mengubahnya menjadi lulus berdasarkan review kode. Keterbatasan baseline yang tidak terkait dicatat, dengan bukti bahwa perubahan ini tidak memperburuknya.

## 16. Risiko spesifik dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Kategori dua mapel bercampur | Subject-qualified registry, grouping, dan validation slots |
| Payload lama rusak oleh field wajib baru | Default English; field TKA diwajibkan kondisional |
| Bacaan hilang saat review/shuffle | Lookup stimulus berdasarkan ID; urutan TKA terkurasi |
| Bentuk jawaban array/map salah dipahami | Dispatch grading/serialization berdasarkan exercise type |
| Skor naik karena jawaban ulang | Simpan hasil main sekali; review terpisah |
| Anak terjebak pengulangan | Review TKA satu putaran |
| Materi/stimuli hanya tersedia lokal | Seed/select/view mapping diuji end-to-end |
| Riwayat tidak dapat dipahami setelah konten diedit | Snapshot context minimal pada attempts TKA |
| Variasi TKA mematahkan builder English | Eligibility eksplisit per subject; strictness English tetap |
| Seed variasi menghapus completion lama | Tidak jalankan replace variasi English untuk ekspansi ini |
| Skor/pembahasan benar secara struktur tetapi salah isi | Audit hitung/bukti terpisah dari validasi schema |
| Scope membesar jadi platform lengkap | Ikuti batas enam lesson; backlog dipisahkan |

## 17. Handoff deliverables

Agent implementasi menyerahkan:

1. Kode lengkap untuk seluruh scope rilis awal.
2. Enam lesson JSON dan visual yang diperlukan.
3. Migration additive beserta urutan penerapan.
4. Validator dan seed/build script yang kompatibel.
5. Pengujian logika grading/schema/state yang relevan.
6. `docs/TKA-SD-CONTENT-AUDIT.md`: lesson/exercise ID, kompetensi, verifikasi kunci, bukti BI, pemeriksa, dan isu yang ditemukan/diselesaikan.
7. `docs/TKA-SD-VERIFICATION.md`: baseline, checks, tanggal, environment, hasil, viewport, DB verification, keterbatasan, dan checklist SC-01 sampai SC-15.
8. README diperbarui dan instruksi seed/migration yang jelas.
9. Ringkasan perubahan, bukti verifikasi, dan pekerjaan pending yang benar-benar masih ada.

Tidak perlu membuat PR, commit, atau deployment jika tugas implementasi tidak memintanya.

## 18. Backlog setelah rilis awal

Urutan rekomendasi, bukan requirement saat ini:

1. Math: operasi pecahan, bilangan cacah, FPB/KPK.
2. BI: kosakata dan ungkapan, ringkasan/bagan, perubahan karakter/latar.
3. Math: bangun datar/ruang, pengukuran, waktu/kecepatan, sudut, data.
4. BI: evaluasi kesesuaian informasi, relevansi kehidupan sehari-hari, apresiasi.
5. Variasi soal terverifikasi dengan kontrak stimulus per-set.
6. Latihan campuran dan simulasi ujian setelah cakupan materi memadai.

## 19. Prompt singkat untuk memulai agent implementasi

> Implementasikan scope rilis awal dalam `docs/TKA-SD-IMPLEMENTATION-PLAN.md` pada repository ini. Baca instruksi repository dan panduan Next.js lokal sebelum menulis kode. Ikuti requirements, keputusan default, urutan tahap, dan success criteria dalam dokumen. Mulai dari baseline, kemudian fondasi multi-mapel dan dua pelajaran contoh lengkap; lanjutkan sampai keenam lesson, progress/history, pipeline, migration, dan verifikasi selesai. Pertahankan kompatibilitas data serta fitur English. Catat audit konten dan hasil verifikasi aktual. Jangan deploy atau mengubah database produksi tanpa otorisasi. Jika sebuah check membutuhkan environment yang tidak tersedia, selesaikan pekerjaan lain dan laporkan check yang pending beserta alasan konkret.
