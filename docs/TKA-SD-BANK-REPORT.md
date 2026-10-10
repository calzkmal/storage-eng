# Laporan perluasan bank soal SD

Tanggal: 10 Oktober 2026, Asia/Jakarta. Cakupan mengikuti daftar pengguna; jumlah disetujui **3 set per topik**. Tidak ada push, PR, atau deployment aplikasi.

## Hasil

- **31 topik × 3 set × 9 soal = 837 soal**: 15 topik Math (405 soal) dan 16 topik BI (432 soal).
- **783 soal tambahan** dibanding rilis awal 54 soal: 25 topik baru dengan seed, ditambah 62 set supplemental pada seluruh 31 topik.
- Semua set memiliki 5 pilihan tunggal, 2 multi-select, dan 2 kategori pernyataan. Grading lokal, tanpa AI.
- Enam seed awal dan seluruh English seed/variasi dipertahankan identik.
- 48 stimulus BI sepanjang 154–185 kata. Dua konteks kelas tambahan tiap topik baru memakai catatan konsep yang sama dengan bacaan utama; pertanyaan berbeda dalam target klaim dan evaluasi positif/negatif, bukan 837 konsep yang seluruhnya terpisah.
- Materi, tujuan, contoh, feedback, kompetensi dan rekomendasi terdaftar untuk seluruh topik. Visual pecahan hanya diwajibkan pada topik pecahan.

## Cakupan

| Mapel | Kelompok | Topik | Set | Soal |
| --- | --- | --- | --- | --- |
| matematika | Bilangan | Pecahan senilai; Membandingkan dan mengurutkan pecahan; Pecahan, desimal, dan persen; Operasi hitung campuran; Operasi pecahan, desimal, dan persen; FPB dan KPK dalam soal cerita; Perbandingan senilai, berbalik nilai, dan skala | 21 | 189 |
| matematika | Geometri dan pengukuran | Sifat, keliling, dan luas bangun datar; Bangun ruang, jaring-jaring, dan volume; Konversi panjang, massa, waktu, dan volume; Kecepatan, jarak, dan waktu | 12 | 108 |
| matematika | Pengolahan data dan statistika | Tabel, diagram batang, dan piktogram; Mean, median, dan modus | 6 | 54 |
| matematika | Pola bilangan dan aljabar | Pola dan barisan bilangan; Persamaan sederhana dengan x | 6 | 54 |
| bahasa-indonesia | Pemahaman tekstual | Menemukan informasi tersurat; Kosakata umum, khusus, kajian, dan serapan; Denotasi, konotasi, dan ungkapan; Ikhtisar dan bagan informasi | 12 | 108 |
| bahasa-indonesia | Pemahaman inferensial | Ide pokok dan gagasan pendukung; Amanat dan sifat tokoh; Kalimat utama deduktif dan induktif; Tema, alur, latar, dan sudut pandang; Simpulan dan perubahan tokoh; Konjungsi, kalimat, dan majas | 18 | 162 |
| bahasa-indonesia | Evaluasi dan apresiasi | Membedakan fakta dan opini; Menilai teks dan mengaitkan kehidupan; Jenis teks dan informasi praktis | 9 | 81 |
| bahasa-indonesia | Ejaan dan tata bahasa | Huruf kapital dan tanda baca; Kata baku dan tidak baku; Sinonim dan antonim dalam konteks | 9 | 81 |

Cakupan ini adalah latihan SD sesuai permintaan pengguna; tidak mengklaim seluruh topik ada dalam kisi-kisi resmi TKA. Penilaian jaring-jaring saat ini berupa sifat dan jumlah bagian, serta data dalam bentuk tabel/baris/piktogram teks; tidak menambahkan editor diagram interaktif.

## Implementasi

- `content/lessons`: 25 seed baru; `content/tka-sets`: dua set tambahan per topik. Semua ID exercise lintas set unik dan stabil.
- Builder deterministik Python menyimpan sumber authoring di scripts/tka. Fraction menghitung kunci secara eksak; input audit aritmetika tersimpan di content/tka-math-audit.json.
- Cache Supabase dibagi per mapel karena respons seluruh bank melewati batas 2 MiB Next data cache. Ukuran raw response terukur saat pemisahan cache: English 875.617 byte, Math 370.301 byte, BI 869.942 byte.
- Loader lokal menampilkan tiga set dengan ID file:<lesson> dan sufiks :v2/:v3. Pada Supabase, semua set memakai UUID existing atau UUID yang baru dibuat.
- Seed TKA terpisah dari seed variasi English. Preflight menolak isi/version existing yang berbeda; tidak delete, recreate, atau mengganti active set. Snapshot seluruh row existing diperiksa sebelum/sesudah.
- `--sync-material` mengizinkan sinkronisasi material/objectives secara eksplisit saja. Perbedaan metadata lain atau isi set tetap ditolak sebelum write. `--sync-feedback` hanya mengubah penjelasan dan menolak perubahan ID, urutan, pertanyaan, pilihan atau kunci. `--sync-stimuli` menjaga ID stimulus tetap sama; historical attempt snapshot tidak diubah. Ini dipakai untuk memperbaiki 13 materi BI setelah QA menemukan alasan contoh yang kurang sesuai; set dan jawaban tidak berubah.

## Supabase nyata

Proyek configured existing tetap jqmjrizticeszylzqpas. Tidak perlu tabel atau migration tambahan untuk perluasan ini.

| Pemeriksaan | Hasil |
| --- | --- |
| Baseline sebelum ekspansi | 24 lessons, 294 sets, 16 completions, 297 attempts |
| Seed pertama | 25 seed baru dan 62 supplemental sets; 49 lessons dan 381 total sets |
| English | Tetap 18 lessons dan 288 sets |
| TKA/SD | Tepat 31 lessons, 93 sets, 837 soal; isi set tersimpan cocok JSON |
| Preservation pertama | Seluruh row 24 lesson, 294 set, 16 completion dan 297 attempt sebelumnya identik |
| Seed kedua | 0 supplemental set dibuat; semua 381 set, 49 lesson, completion dan attempt identik |
| Perbaikan feedback/bacaan | Penjelasan 39 set pada 13 topik BI baru diperjelas per klaim; 26 konteks tambahan dilengkapi dengan gagasan utuh. Soal, kunci, urutan dan ID set/stimulus dipertahankan; attempt snapshot lama tetap utuh |
| Perbaikan materi | Material/objectives 13 lesson BI baru disinkronkan. Verifikasi pertama salah melaporkan beda hash karena urutan key JSONB; comparator diperbaiki menjadi canonical content. Seed final kembali membuat 0 set tambahan dan preservation lulus |
| API topik baru | Bangun ruang dan fakta/opini, plus English: 14 attempt main/review, 3 completion, snapshot version 1, subject filters dan signed-cookie isolation lulus |
| History limit | Filter Math tetap melihat 6 attempt setelah 601 attempt English yang lebih baru; Semua tetap dibatasi 600 |
| Perbandingan akhir read-only | Seluruh 31 row lesson_active dan 93 row lesson_sets: metadata, material, stimulus dan seluruh exercise cocok persis dengan bank final |
| Cleanup | Dua profil QA dan semua attempt/completion QA dibersihkan; data existing kembali identik |

## Pemeriksaan lokal

- Validasi: 49 lesson, 270 variasi English, dan 62 supplemental TKA sets lulus.
- 13 regression tests lulus; semua 837 solusi dapat dinilai, display ≤600 karakter dan payload attempt/context valid.
- Audit awal 27 Math dan 27 BI tetap lulus; perluasan memeriksa 798 klaim numerik dengan evaluator JS terpisah dari generator Python, serta seluruh 432 set evidence soal BI.
- `typecheck`, `lint`, build tanpa DB, dan build dengan Supabase aktif lulus. Build final setelah koreksi feedback/stimulus tidak memiliki error cache/fetch/fallback.
- Localhost smoke: 153 page routes, 4 not-found routes, validasi history dan payload attempt lulus.
- Browser: tiga set fallback terlihat; set ketiga Math dapat dibuka. Tiga set UUID Supabase terlihat; katalog BI menampilkan 4 kelompok dan total 16 topik; set kedua fakta/opini membuka materi; satu jawaban dinilai tepat dengan feedback. Profile browser lama berasal dari sesi offline sehingga attempt QA itu ditolak FK (tidak tersimpan); penyimpanan nyata diuji terpisah lewat profil API baru yang sah.
- Review manual materi BI menemukan alasan contoh yang tidak terkait secara tepat dan memperbaikinya. Review ahli/manusia belum dilakukan.
- Pemeriksaan lokal dan live saat rilis awal tetap tercatat di TKA-SD-VERIFICATION.md; angka di dokumen awal merupakan baseline, laporan ini menggambarkan ekspansi terbaru.

## Commit

- 491de49: perluasan konten dan dukungan tiga set.
- 5c84810: validasi bank, audit aritmetika, regression checks.
- 81c25b2: validasi telemetry seluruh 837 soal dan history topik baru.
- 296f887: perbaikan alasan worked examples BI dan preflight/sync material terkontrol.
- 432b28e: fingerprint preservation yang mengabaikan urutan key JSONB, dengan regression test untuk perubahan isi.
- b8a2650: cache per mapel untuk menjaga entry di bawah batas Next.js.
- 5cea9c0: feedback BI spesifik dengan update explanation-only yang terkontrol.
- 6b61bbf: konteks tambahan BI dibuat mandiri tanpa mengubah ID stimulus.
- f31f9d8: regression test dukungan klaim dalam konteks mandiri.
- Commit dokumentasi akhir: README, laporan ini dan bukti browser; lihat git log untuk hash.

Push dan PR tetap diserahkan kepada pengguna.
