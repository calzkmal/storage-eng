# Laporan implementasi dan verifikasi TKA SD

Tanggal: **10 Oktober 2026, Asia/Jakarta**. Environment: macOS, Node 26.5.0, Next.js 16.3.4, React 19.2.8. Workspace: `/Users/cindyram/Documents/Muti/Prototype`.

**Status: seluruh implementasi rilis awal dan verifikasi lokal selesai; gate database nyata belum terpenuhi. Jangan menyatakan rilis penuh terverifikasi sebelum SC-11 dan bagian DB dari SC-09 selesai.** Tidak ada push, PR, deployment, migration produksi, atau seed produksi yang dijalankan.

## Yang diimplementasikan

- Landing tiga mapel dan `/subjects/[subject]`, kategori per mapel, back link dari runner/sets/hasil, serta not-found untuk ID tidak dikenal. URL English dan semua ID lama dipertahankan.
- Schema default English untuk konten lama; metadata TKA berupa level, objectives, material, stimulus, visual pecahan, evidence dan kompetensi. Renderer memakai field terkontrol dan teks yang di-escape React.
- Enam seed TKA, masing-masing 9 soal: total **54 soal**, komposisi per lesson 5 single-choice, 2 multi-select, 2 kategori pernyataan. Tiga lesson Math dan tiga lesson BI lengkap dengan dua bagian materi dan dua worked examples; setiap Math punya visual pecahan; BI memiliki tiga bacaan orisinal per lesson (168–183 kata), masing-masing tiga soal berdekatan.
- Grading lokal exact-set untuk multi-select, all-statements-correct untuk kategori. Feedback menjelaskan pilihan tepat, terlewat, keliru, dan tiap pernyataan. TKA tidak masuk jalur grading AI.
- Materi/bacaan dapat dibuka tanpa kehilangan pilihan. Urutan TKA terkurasi, termasuk replay dengan `shuffle=1`. Scroll kembali ke awal saat ganti soal/bacaan. Review satu putaran untuk TKA; English mempertahankan retry loop lama.
- Hasil percobaan pertama, persentase dibulatkan terdekat, deduplikasi tautan materi berdasarkan kompetensi; completion tidak menyatakan penguasaan. Guard ref mencegah pemeriksaan/finish ganda; tombol utama mengabaikan aktivasi berulang dalam 400 ms agar double-click tidak melewati pembahasan.
- Filter query mapel pada progres/riwayat. Progres “Semua” mengelompokkan semua kategori English, lalu Math, lalu BI. Query history tetap dibatasi signed-cookie learner dan difilter sebelum limit 600 attempt. Tidak ada pagination/cursor existing yang perlu dimigrasikan. Respons filter lama dibatalkan/diabaikan.
- Attempt snapshot version 1 memuat stimulus terkait, evidence, penjelasan dan detail feedback; display pilihan/pernyataan disimpan sebagai label terbaca. Context maksimal 16 KiB, body attempt 32 KiB, field display tetap maksimal 600 karakter. Subject/kompetensi/context serta grading lokal TKA divalidasi sebagai kombinasi. Telemetry tetap client-reported, bukan skor otoritatif.
- Migration additive `20261010090000_tka_subjects.sql`, metadata pada loader/select/view/upsert, default English di DB, index history per learner/subject. Kolom view ditambahkan di akhir, `security_invoker` dan revoke grants dipertahankan. `lesson_overview` telah dihapus migration lama dan tidak dihidupkan kembali.
- Seed additive dan idempotent, opsi `--subject`, tanpa pruning lesson/set. Read konten tidak auto-seed. Fallback menggabungkan lesson lokal yang belum tersedia/valid di DB dengan metadata lengkap. English-only eligibility untuk builder/seed variasi; validasi tetap ketat pada 15 variasi tiap English lesson.
- README, audit per exercise, pengujian regresi, localhost HTTP smoke, dan screenshot QA.

## Baseline sebelum perubahan

Git awal: commit `08f730c`; branch existing `feat/agents`. Ada `docs/` untracked berisi rencana pengguna. Dokumen tersebut dipertahankan tanpa perubahan dan disertakan dalam commit dokumentasi.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| Inventaris | 18 lesson English, 162 seed exercises, 18 file variasi × 15 = 270 variasi; 288 set English jika tersimpan di DB, satu seed per lesson dalam fallback lokal |
| `npm run validate` | Percobaan sandbox terkena EPERM pada socket IPC tsx; `node --import tsx` lulus, kemudian command npm yang sama lulus di luar sandbox |
| `npm run typecheck` | Lulus |
| `npm run lint` | Lulus |
| `npm run build` | Percobaan sandbox terkena EPERM tsx; build berikutnya lulus. Konfigurasi DB existing tidak dapat dihubungi (`fetch failed`), konten English memakai fallback; ini kondisi baseline, bukan regresi |
| Next.js docs | Routing dynamic params Promise, generateStaticParams, route handlers, cache dan panduan tanpa Cache Components dibaca; repo tidak menyalakan Cache Components |
| Migration | Seluruh sembilan migration existing dibaca; view aktif terakhir adalah lesson_sets dan lesson_active, bukan definisi tabel pertama |

## Pemeriksaan otomatis final

| Command | Hasil |
| --- | --- |
| `npm run validate` | Lulus: 24 lesson + seluruh 270 variasi English. Slot mapel/kategori/order, evidence, stimulus, metadata, format, visual, dan enam ID wajib diperiksa |
| `npm run test` | **10 test lulus**, 0 gagal. Mencakup 54 kunci TKA, 162 seed English, 270 variasi English, exact-set/order-independent, missing/extra/duplicate/unknown answers, kategori tidak lengkap/salah, metadata/evidence/visual invalid, skor/review, bounded context, kombinasi payload, legacy results dan storage unavailable |
| `npm run audit:tka` | Lulus: 27 kunci Math dibandingkan hitung independen, 27 set evidence BI cocok persis. Detail tiap exercise ada pada TKA-SD-CONTENT-AUDIT.md |
| `npm run typecheck` | Lulus |
| `npm run lint` | Lulus |
| `npm run build` tanpa Supabase | Lulus: tiga katalog, seluruh 24 lesson/sets/done diprerender; history/attempt API tetap dynamic |
| Build DB failure | Lulus setelah cache dipindahkan: 52 kegagalan fetch DB dummy localhost ditangkap dan 52 diagnosis “using bundled files”; seluruh route TKA diprerender dengan fallback lengkap. Tidak memakai endpoint produksi |
| `npm run build:variations` | Lulus: 270 variasi English. Output deterministik tidak mengubah file existing; tidak membuat variasi TKA |
| `npm run smoke:local` | Lulus: **78 page routes**, 4 not-found routes, history enum filters, valid TKA payload tanpa cookie menghasilkan `stored:false`, invalid AI/context/missing-context ditolak 400, body berlebih ditolak 413 |
| `git diff --check` | Lulus |
| Perbandingan konten English | Diff dari baseline pada content/lessons dan content/variations hanya enam JSON TKA baru; semua English tetap identik |

Bukti log pemeriksaan tersedia pada eksekusi chat; log sementara selama pengerjaan berada di `/tmp/tka-*.log`. Tidak memasukkan env/key ke laporan atau artifact. Smoke hanya mengizinkan localhost dan tidak mengirim signed learner cookie, sehingga tidak menyimpan attempt.

## Browser QA aktual

Production server diuji di `http://localhost:3100`, dengan Supabase, Gemini dan OpenRouter dinonaktifkan melalui environment override. Profil QA menggunakan nama “Uji TKA” pada origin lokal khusus; tidak mengubah profil produksi. Tab QA ditutup dan viewport override dipulihkan setelah selesai.

| Kasus | Hasil observasi |
| --- | --- |
| Landing → tiga katalog | Ketiga kartu membuka katalog yang tepat; English 18 lesson, Math 3, BI 3 |
| Math sesi lengkap | Pecahan senilai: salah main q1/q4/q6 → 6/9 = 67%; ketiga soal review tetap salah; sesi selesai, tanpa antrean baru; rekomendasi materi hanya satu tautan |
| BI sesi lengkap | Informasi tersurat: salah main q1/q5/q8 → 6/9 = 67%; q1 benar saat review, q5/q8 salah; skor tetap 6/9; bacaan kebun/perpustakaan/piknik tetap sesuai |
| Materi dan stimulus | Pilihan 1/4 tetap aktif setelah buka/tutup materi; pilihan BI tetap aktif setelah buka/tutup materi dan bacaan. Bacaan dan evidence tersedia saat feedback dan review |
| Tiga format | Checkbox dapat dipilih/dibatalkan; kurang satu kunci menunjukkan “terlewat”; kategori belum lengkap membuat Periksa disabled; seluruh detail tersedia dengan teks, bukan warna saja |
| Progres | Satu set Math kemudian satu set BI menambah completion file lokal; filter Math 1/3, BI 1/3; Semua menampilkan grouping mapel yang benar setelah fix |
| English regresi | Satu sesi lengkap Present Continuous: MCQ, fill blank (Enter), word order, matching (termasuk dua right labels sama), flip sentence, free write. Free write tanpa AI tampil model answer fallback dan sesi dapat selesai |
| Replay/shuffle | TKA `shuffle=1` tetap mulai dengan q1 dan bacaan pertama; set selesai dapat dibuka ulang |
| History | Empty state tanpa DB tidak crash; filter cepat Math → BI → English berakhir pada filter English tanpa respons lama tercampur. Live history campuran perlu DB uji |
| Klik ganda | Periksa double-click tetap q1 dengan feedback; Lanjut double-click hanya pindah ke q2 yang belum dijawab, tidak melewati soal |
| Keyboard | Checkbox Space, radio Space, input Enter diuji; fokus terlihat; fieldset/legend/labels diperiksa. Tidak dilakukan audit screen reader lengkap |
| Error | Console error/warn kosong pada QA final; production build dan smoke bebas error routing/hydration yang teramati |
| AI TKA | Semua 54 grade adalah local; sesi lengkap berjalan dengan kedua AI key kosong. Server tidak mencatat panggilan ai/grade selama sesi TKA; log panggilan fallback hanya muncul saat free-write English. Browser API tidak menyediakan network panel, jadi tidak mengklaim trace network panel lengkap |
| Storage | Test fungsi storage tanpa window/storage tidak melempar exception; legacy result parse berhasil. Pengaturan browser untuk memblokir storage seluruh origin tidak diubah |

Screenshot landing, katalog, materi, single-choice, multiple-select, statement-category, feedback, reading, dan result disimpan di `docs/qa/` pada **360, 390, 768 px** (tinggi 900 px untuk matriks capture). Kedua sesi utama juga diuji pada tinggi 800/844/1024. Lebar scroll dokumen sama dengan viewport di seluruh capture; inspeksi visual tidak menemukan konten melebar. Runner memakai scroll internal; screenshot viewport tidak menampilkan seluruh materi/bacaan sekaligus, dan scroll manual memastikan pembahasan panjang tetap dapat diakses di atas bottom bar. Target interaksi baru minimal 44 px melalui label/control wrapper.

## Database: pending nyata

Tidak ada Supabase CLI, psql, atau Docker tersedia di PATH, serta tidak ada database disposable/test yang diidentifikasi dan diotorisasi. DB configured existing gagal dihubungi pada baseline. Karena itu **SC-11 belum terverifikasi**. Build/smoke/mock bukan bukti migration SQL sudah berhasil diterapkan.

Yang telah dilakukan: audit urutan migration, review kolom/view/RLS/grants, bounded snapshot parsing, API validation, konten lokal tanpa DB, dan fallback build dengan endpoint dummy localhost yang tidak tersedia. Tidak menjalankan `seed:supabase`, `seed:variations`, atau migration ke DB configured.

Yang wajib dilakukan pada DB uji sebelum rilis:

1. Terapkan migration baseline berurutan lalu `20261010090000_tka_subjects.sql`; pastikan lesson/attempt lama default `english`.
2. Simpan jumlah dan ID exercise_sets/learner_sets English; seed Math dan BI dua kali melalui `--subject`; pastikan satu seed setiap TKA dan jumlah/ID completion English tetap.
3. Query `lesson_sets` dan `lesson_active`; cocokkan level/objectives/material/stimuli dan buka kedua lesson contoh melalui DB path.
4. Buat signed-cookie learner uji; simpan attempt main/review English dan TKA, termasuk kedua format baru; periksa snapshot dan filter sebelum limit. Coba learner berbeda dan pastikan akses tetap terisolasi.
5. Uji history campuran, perubahan filter cepat, deletion profil/history semua mapel, dan DB outage terhadap aplikasi yang telah memakai DB set.
6. Setelah hasil tercatat, ubah status SC-09/SC-11 berdasarkan bukti DB tersebut. Baru pertimbangkan rilis sesuai proses pengguna.

Risiko existing `seed:variations`: menghapus/recreate variasi English dapat menghapus learner_sets melalui cascade. Jangan jalankan untuk ekspansi TKA. Completion `file:<lessonId>` tetap device-local dan tidak menjadi completion UUID DB secara otomatis; ini mekanisme existing, bukan sinkronisasi baru.

## Success criteria

| ID | Status | Bukti / batas |
| --- | --- | --- |
| SC-01 | Lulus lokal | Ketiga kartu dan katalog dibuka lewat browser |
| SC-02 | Lulus lokal | Semua 18 URL English smoke; enam format browser; seed/variasi English identik dan lolos regresi |
| SC-03 | Lulus | 6 × 9 = 54 soal, tiga format setiap lesson |
| SC-04 | Lulus | Tujuan, dua bagian, dua contoh, penjelasan; audit per lesson |
| SC-05 | Lulus | Exact-set/kategori tests dan browser mixed answers |
| SC-06 | Lulus | Tiga stimulus pada main/feedback/review BI; evidence tepat |
| SC-07 | Lulus audit agent | 27 hitung independen + 27 set bukti; belum review ahli/manusia |
| SC-08 | Lulus | Kedua sesi 6/9 = 67%, review salah selesai; guard klik ganda |
| SC-09 | Parsial; DB pending | Progres lokal, filter/empty history, snapshot parsing dan legacy tests lulus; riwayat campuran real DB belum diuji |
| SC-10 | Lulus lokal | Math/BI selesai tanpa DB/AI keys; 54 soal gradeLocal; batas network inspection dijelaskan |
| SC-11 | **Pending** | Tidak ada DB uji yang tersedia/diotorisasi; migration/seed belum dieksekusi |
| SC-12 | Lulus nonmutating | Builder 270 variasi unchanged; English-only seed selection direview, seed variasi tidak dijalankan |
| SC-13 | Lulus smoke | Capture 360/390/768, tanpa overflow teramati, checkbox/radio/Enter; bukan audit aksesibilitas formal |
| SC-14 | Lulus | Validate, 10 tests, typecheck, lint, production builds |
| SC-15 | Lulus | README, migration setup, audit, laporan ini, screenshot |

## Commit dan handoff

Perubahan di-commit per kelompok pada branch existing `feat/agents`:

- `71808c6`: fondasi mapel, schema, migration, format/grading baru.
- `88ec018`: materi, stimulus, runner/review/hasil, progres/history.
- `0505f25`: enam lesson, validator dan regression tests.
- `bc04b3e`: grouping, seed additive, audit hitung, reset scroll.
- `a8d8756`: rapid-action guard, target sentuh, smoke lokal.
- `d74eb3d`: fase main/review dan jawaban benar selalu tampil dalam riwayat.
- Commit dokumentasi akhir: README, rencana unchanged, audit, verification, dan bukti QA; lihat `git log` untuk hash.

Push, PR, dan proses rilis diserahkan kepada pengguna.
