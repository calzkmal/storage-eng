# Audit konten TKA SD

Tanggal: 10 Oktober 2026, Asia/Jakarta. Pemeriksa: Codex, pass audit terpisah setelah penulisan. Ini bukan review manusia atau sertifikasi pemerintah.

## Acuan

Matriks resmi diperiksa lewat hasil terindeks sumber resmi pada 10 Oktober 2026. Fetch langsung halaman mengembalikan 502 dan PDF timeout; keterbatasan akses dicatat, bukan ditutupi. Materi awal sesuai butir pecahan senilai, perbandingan/pengurutan, relasi pecahan-desimal-persen; BI sesuai membaca tekstual/inferensial dan panjang prosa 150–200 kata.

- [Matriks Matematika SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd/matematika)
- [Matriks Bahasa Indonesia SD](https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sd/bahasa-indonesia)
- [Kerangka resmi Perkaban 47/2025](https://pusmendik.kemendikdasmen.go.id/tka/page/download_file/053354_47)

## Metode

Kunci Math dibandingkan dengan perhitungan independen dalam `scripts/audit-tka.ts`; visual diperiksa sebagai partisi sama besar dari satu keseluruhan. Kunci BI diperiksa ulang terhadap konteks lengkap: informasi eksplisit atau inferensi tindakan/rincian. Setiap kutipan di bawah dicek sebagai substring persis stimulus terkait. Semua bacaan orisinal; kunci hanya bergantung pada teks. Struktur tidak dianggap bukti kebenaran pedagogis.

## tka-bi-amanat-dan-tokoh

Amanat dan sifat tokoh: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.

- Bacaan `jembatan`: 176 kata; 3 soal berdekatan.
- Bacaan `catatan`: 183 kata; 3 soal berdekatan.
- Bacaan `layang`: 172 kata; 3 soal berdekatan.

### tka-bi-amanat-dan-tokoh-q1

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `jembatan`: “Ia meminta Dodi menunggu sebentar dan memanggil Pak Seno”
- Bukti `jembatan`: “Nisa tidak masuk ke parit sendiri.”
Alasan hubungan bukti/kunci: Nisa membantu Lala dengan memanggil orang dewasa dan tidak masuk sendiri ke parit. Dua tindakan ini mendukung kepedulian sekaligus kehati-hatian, bukan keberanian yang ceroboh.

### tka-bi-amanat-dan-tokoh-q2

Kompetensi: `bi.inferential.message`. Status: **lulus audit**.
- Bukti `jembatan`: “Lala menyeberang dengan bantuan Pak Seno.”
- Bukti `jembatan`: “memastikan semua kawan aman.”
Alasan hubungan bukti/kunci: Nisa meminta bantuan Pak Seno sehingga Lala dan bibit aman. Cerita menghubungkan bantuan dengan keselamatan, bukan meminta anak mengambil risiko.

### tka-bi-amanat-dan-tokoh-q3

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `jembatan`: “Nisa memegang kotak bibit dari tepi jalan”
- Bukti `jembatan`: “Dodi akhirnya ikut membantu membawa tas Lala.”
Alasan hubungan bukti/kunci: Sifat tokoh disimpulkan dari tindakannya. Pilih tindakan yang memberi bantuan nyata.
- Benar: Nisa memegang kotak bibit dari tepi jalan. Tindakan ini membantu Lala menyeberang tanpa membawa kotak.
- Benar: Dodi membantu membawa tas Lala. Dodi akhirnya ikut membantu kawan.
- Pengecoh: Dodi mula-mula mengajak segera pulang. Saat itu Dodi lebih memikirkan cepat pulang; belum membantu Lala.
- Pengecoh: Lala takut kotaknya jatuh. Ini perasaan Lala, bukan tindakan menolongnya.

### tka-bi-amanat-dan-tokoh-q4

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `catatan`: “memberi tahu teman-temannya apa yang sebenarnya terjadi.”
- Bukti `catatan`: “Ia meminta maaf karena tidak memeriksa tas sebelum berangkat.”
Alasan hubungan bukti/kunci: Bima menceritakan kejadian sebenarnya, meminta maaf, dan mencari cara melengkapi data. Kesalahan membawa buku tidak berarti seluruh tindakannya tidak bertanggung jawab.

### tka-bi-amanat-dan-tokoh-q5

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `catatan`: “Ia tidak menyalahkan teman-temannya.”
- Bukti `catatan`: “Santi masih membawa beberapa foto tanaman”
- Bukti `catatan`: “membuat daftar barang yang perlu dibawa.”
Alasan hubungan bukti/kunci: Cari tindakan tokoh sebagai bukti. Perasaan malu tidak sama dengan menyalahkan orang lain.
- Bima menyalahkan Santi karena catatan tertinggal. → Tidak Sesuai. Teks menyebut ia tidak menyalahkan teman-temannya.
- Santi membantu kelompok dengan foto pengamatan. → Sesuai. Foto yang dibawa Santi digunakan untuk menjelaskan perubahan tanaman.
- Bima berusaha mencegah kesalahan terulang. → Sesuai. Ia membuat daftar barang dan memasukkan buku ke tas.

### tka-bi-amanat-dan-tokoh-q6

Kompetensi: `bi.inferential.message`. Status: **lulus audit**.
- Bukti `catatan`: “kelompok melengkapi presentasi dengan data yang benar.”
- Bukti `catatan`: “memakai daftar persiapan bersama agar kesalahan serupa tidak terulang.”
Alasan hubungan bukti/kunci: Bima mengakui catatan tertinggal, melengkapi data yang benar, dan memperbaiki persiapan. Ini menunjukkan perbaikan setelah kesalahan, bukan tuntutan tidak pernah salah.

### tka-bi-amanat-dan-tokoh-q7

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `layang`: “Fajar memperbaiki ikatan dan memeriksa kembali panjang kedua sisi.”
- Bukti `layang`: “Fajar berencana memeriksa ikatan lagi”
Alasan hubungan bukti/kunci: Gunakan tindakan Fajar setelah bantuan, bukan tindakan kakaknya atau keadaan awal sebelum ia berubah.
- Benar: Fajar memperbaiki ikatan dan memeriksa kedua sisi. Ia mencoba memperbaiki sumber kesalahan.
- Benar: Fajar berencana memeriksa ikatan sebelum kegiatan berikutnya. Ia ingin melanjutkan perbaikan.
- Pengecoh: Fajar hampir membuang layang-layang pada awal cerita. Ini menunjukkan hampir menyerah sebelum berubah.
- Pengecoh: Mira membawa air minum. Ini tindakan Mira, bukan bukti ketekunan Fajar.

### tka-bi-amanat-dan-tokoh-q8

Kompetensi: `bi.inferential.character`. Status: **lulus audit**.
- Bukti `layang`: “Ia menunjukkan cara mengukur, lalu membiarkan Fajar menandai bagian yang perlu dipotong.”
- Bukti `layang`: “Mira memuji usaha Fajar yang mau memperbaiki hasil kerjanya.”
Alasan hubungan bukti/kunci: Mira menunjukkan cara mengukur dan memberi Fajar kesempatan menandai serta memperbaiki ikatan. Dari tindakan itu kita menyimpulkan bahwa ia membantu Fajar belajar, meski tujuan ini tidak diucapkan langsung.

### tka-bi-amanat-dan-tokoh-q9

Kompetensi: `bi.inferential.message`. Status: **lulus audit**.
- Bukti `layang`: “memperhatikan kesalahan lebih berguna daripada langsung menyerah.”
- Bukti `layang`: “Fajar memperbaiki ikatan dan memeriksa kembali panjang kedua sisi.”
Alasan hubungan bukti/kunci: Amanat menghubungkan masalah, tindakan perbaikan, dan hasil. Jangan hanya memakai kejadian hampir menyerah di awal.
- Belajar dari kesalahan dapat membantu kita memperbaiki karya. → Sesuai. Fajar melihat ketidakseimbangan lalu memperbaiki layang-layang.
- Kita harus langsung menyerah jika percobaan pertama gagal. → Tidak Sesuai. Fajar akhirnya mencoba lagi dan ingin melanjutkan perbaikan.
- Meminta bantuan dapat dilakukan sambil tetap berusaha sendiri. → Sesuai. Mira membantu mengukur dan memotong, Fajar menandai dan memperbaiki ikatan.

## tka-bi-ide-pokok

Ide pokok dan gagasan pendukung: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.

- Bacaan `air`: 175 kata; 3 soal berdekatan.
- Bacaan `sarapan`: 174 kata; 3 soal berdekatan.
- Bacaan `pohon`: 177 kata; 3 soal berdekatan.

### tka-bi-ide-pokok-q1

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `air`: “Sekolah Pelita mulai menampung air hujan untuk merawat kebun.”
- Bukti `air`: “Guru menjelaskan bahwa penampungan perlu dirawat agar manfaatnya bertahan.”
Alasan hubungan bukti/kunci: Awal teks mengenalkan pemanfaatan air hujan, lalu paragraf berikut menjelaskan kebersihan dan keselamatannya. Ide pokok mencakup seluruh uraian; daun kering hanyalah rincian.

### tka-bi-ide-pokok-q2

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `air`: “Sebelum memasang tong, petugas membersihkan atap dan saluran air.”
- Bukti `air`: “Sebuah saringan sederhana dipasang di mulut tong”
- Bukti `air`: “Petugas juga menandai batas penuh pada dinding tong.”
Alasan hubungan bukti/kunci: Membersihkan saluran, memasang saringan, dan menandai batas penuh adalah rincian yang mendukung persiapan penampungan. Kegiatan sore terdapat pada paragraf ketiga.

### tka-bi-ide-pokok-q3

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `air`: “Daun kering diangkat supaya aliran tidak tersumbat.”
- Bukti `air`: “Tong ditutup rapat setelah hujan berhenti agar tidak menjadi tempat nyamuk berkembang.”
Alasan hubungan bukti/kunci: Rincian pendukung harus berkaitan dengan perawatan dan sesuai teks, bukan sekadar menyebut tong.
- Benar: Saluran dibersihkan dari daun kering. Pembersihan mencegah saluran tersumbat.
- Benar: Tong ditutup rapat setelah hujan. Penutupan mencegah nyamuk berkembang.
- Pengecoh: Murid memanjat tong sendiri. Teks justru melarang memanjat sendiri.
- Pengecoh: Air tong selalu diminum murid. Teks menyebut air untuk menyiram, bukan diminum.

### tka-bi-ide-pokok-q4

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `sarapan`: “Sarapan membantu murid memulai kegiatan pagi dengan tenaga yang cukup.”
- Bukti `sarapan`: “Murid diajak melihat hubungan kebiasaan pagi dengan kesiapan beraktivitas.”
Alasan hubungan bukti/kunci: Pernyataan awal tentang tenaga, contoh Raka, dan catatan kebiasaan semuanya mendukung sarapan dan kesiapan beraktivitas. Menu roti hanya satu pilihan.

### tka-bi-ide-pokok-q5

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `sarapan`: “Saat kegiatan olahraga, ia merasa lemas dan sulit mengikuti gerakan.”
- Bukti `sarapan`: “Sarapan tidak harus berupa makanan mahal.”
- Bukti `sarapan`: “Murid diajak melihat hubungan kebiasaan pagi dengan kesiapan beraktivitas.”
Alasan hubungan bukti/kunci: Bedakan ide utama, contoh pendukung, dan kesimpulan yang bertentangan dengan teks.
- Cerita Raka memberi contoh hubungan kebiasaan pagi dengan kesiapan olahraga. → Sesuai. Raka lemas tanpa sarapan, lalu mengubah persiapan pagi agar sempat makan.
- Daftar menu menunjukkan bahwa sarapan harus mahal. → Tidak Sesuai. Teks menyatakan sarapan tidak harus makanan mahal.
- Catatan kebiasaan dipakai untuk memahami kesiapan beraktivitas. → Sesuai. Tujuan catatan disebut sebagai melihat hubungan kebiasaan pagi dengan kesiapan.

### tka-bi-ide-pokok-q6

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `sarapan`: “Guru meminta murid mencatat kebiasaan pagi selama satu minggu.”
- Bukti `sarapan`: “Kegiatan ini menekankan kebiasaan yang teratur serta perhatian pada kebutuhan setiap anak.”
Alasan hubungan bukti/kunci: Paragraf membahas catatan satu minggu dan tujuan penggunaannya. Membandingkan harga makanan secara jelas bukan tujuannya.

### tka-bi-ide-pokok-q7

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `pohon`: “Daunnya menghalangi sebagian sinar matahari sehingga tempat di bawah pohon lebih teduh.”
- Bukti `pohon`: “Akar pohon juga membantu air meresap ke tanah.”
Alasan hubungan bukti/kunci: Manfaat didukung oleh efek daun dan akar. Instruksi perawatan tidak boleh diubah menjadi larangan atau kewajiban yang tidak ada.
- Benar: Daun membuat tempat di bawah pohon lebih teduh. Rincian ini menjelaskan kenyamanan halaman.
- Benar: Akar membantu air meresap ke tanah. Rincian ini menjelaskan manfaat lingkungan.
- Pengecoh: Murid wajib memotong dahan sendiri. Teks tidak meminta murid memotong dahan.
- Pengecoh: Pohon tidak perlu dirawat setelah ditanam. Penanaman baru disertai jadwal perawatan.

### tka-bi-ide-pokok-q8

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `pohon`: “Pohon di halaman sekolah memberi manfaat yang dapat dirasakan murid.”
- Bukti `pohon`: “Perawatan dilakukan dengan cara sederhana dan teratur.”
Alasan hubungan bukti/kunci: Teks menjelaskan manfaat pohon, cara merawat, dan penanaman dengan jadwal perawatan. Bangku dan sampah adalah rincian, bukan fokus seluruh teks.

### tka-bi-ide-pokok-q9

Kompetensi: `bi.inferential.main-idea`. Status: **lulus audit**.
- Bukti `pohon`: “Mereka mencatat perbedaan rasa panas pada waktu yang sama.”
- Bukti `pohon`: “Perawatan dilakukan dengan cara sederhana dan teratur.”
- Bukti `pohon`: “Sekolah kemudian menanam dua pohon baru”
Alasan hubungan bukti/kunci: Ide utama mencakup beberapa rincian. Jangan memilih satu angka sebagai ide seluruh bacaan.
- Pengamatan rasa panas membantu menjelaskan manfaat tempat teduh. → Sesuai. Murid membandingkan tempat teduh dan terbuka pada waktu sama.
- Paragraf kedua terutama menjelaskan cara merawat pohon. → Sesuai. Rinciannya menyiram, membersihkan sampah, dan memeriksa dahan.
- Seluruh bacaan hanya membahas jumlah pohon baru. → Tidak Sesuai. Dua pohon baru hanya satu rincian di akhir; teks juga membahas manfaat dan perawatan.

## tka-bi-informasi-tersurat

Menemukan informasi tersurat: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.

- Bacaan `kebun`: 170 kata; 3 soal berdekatan.
- Bacaan `perpustakaan`: 173 kata; 3 soal berdekatan.
- Bacaan `sampah`: 168 kata; 3 soal berdekatan.

### tka-bi-informasi-tersurat-q1

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `kebun`: “kelompok kedua menanam bibit bayam”
Alasan hubungan bukti/kunci: Teks menyebut tugas setiap kelompok secara langsung. Kelompok kedua menanam bibit bayam; membuat label adalah tugas kelompok ketiga.

### tka-bi-informasi-tersurat-q2

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `kebun`: “Setiap Selasa dan Jumat, murid menyiram tanaman sebelum pelajaran dimulai.”
Alasan hubungan bukti/kunci: Kalimat tentang jadwal menyebut Selasa dan Jumat sebelum pelajaran. Jangan tertukar dengan waktu hujan pada malam hari.

### tka-bi-informasi-tersurat-q3

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `kebun`: “Mereka memakai enam pot bekas yang sudah dicuci.”
- Bukti `kebun`: “Setiap label berisi nama tanaman dan tanggal penanaman”
- Bukti `kebun`: “tetapi belum memanen tanaman.”
- Bukti `kebun`: “Tanah yang masih basah tidak perlu disiram lagi”
Alasan hubungan bukti/kunci: Informasi tersurat harus cocok dengan kalimat di teks. Bedakan pengamatan setelah tiga minggu dengan waktu panen.
- Benar: Ada enam pot bekas. Teks menyebut enam pot bekas yang dicuci.
- Benar: Label memuat tanggal penanaman. Nama tanaman dan tanggal penanaman tertulis pada label.
- Pengecoh: Bayam dipanen setelah tiga minggu. Setelah tiga minggu tanaman belum dipanen.
- Pengecoh: Tanah basah tetap harus disiram. Tanah yang masih basah tidak perlu disiram.

### tka-bi-informasi-tersurat-q4

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `perpustakaan`: “Setiap anggota boleh meminjam paling banyak dua buku selama satu minggu.”
Alasan hubungan bukti/kunci: Batas pinjaman adalah dua buku selama satu minggu. Dua kotak besar adalah wadah buku, bukan jumlah buku yang boleh dibawa semua anggota.

### tka-bi-informasi-tersurat-q5

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `perpustakaan`: “Kegiatan dimulai pukul sembilan pagi dan berakhir pukul sebelas siang.”
- Bukti `perpustakaan`: “Anak yang ingin meminjam buku harus membawa kartu anggota.”
- Bukti `perpustakaan`: “Pada Sabtu terakhir setiap bulan, ada kegiatan membaca cerita bersama.”
Alasan hubungan bukti/kunci: Cocokkan keterangan waktu dan syarat pada setiap pernyataan dengan teks.
- Pojok baca dimulai pukul sembilan pagi. → Sesuai. Jadwal tertulis pukul sembilan pagi sampai sebelas siang.
- Kartu anggota diperlukan untuk meminjam buku. → Sesuai. Teks menyatakan peminjam harus membawa kartu anggota.
- Kegiatan membaca cerita bersama diadakan setiap Sabtu. → Tidak Sesuai. Kegiatan bersama hanya pada Sabtu terakhir setiap bulan.

### tka-bi-informasi-tersurat-q6

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `perpustakaan`: “pojok baca dipindahkan ke teras perpustakaan.”
Alasan hubungan bukti/kunci: Teks menyebut teras perpustakaan sebagai tempat pengganti. Papan balai adalah tempat pengumuman, bukan tempat membaca pengganti.

### tka-bi-informasi-tersurat-q7

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `sampah`: “Kantong hijau digunakan untuk sisa makanan dan kulit buah.”
- Bukti `sampah`: “Kantong biru digunakan untuk kertas bersih yang tidak berminyak.”
- Bukti `sampah`: “Botol minum milik murid dibawa pulang”
- Bukti `sampah`: “Tidak ada kantong yang ditinggalkan di dekat pohon.”
Alasan hubungan bukti/kunci: Gunakan aturan yang dinyatakan dalam bacaan ini. Jangan memakai dugaan aturan warna dari tempat lain.
- Benar: Kulit buah di kantong hijau. Kantong hijau untuk sisa makanan dan kulit buah.
- Benar: Kertas bersih di kantong biru. Kantong biru untuk kertas bersih yang tidak berminyak.
- Pengecoh: Botol minum sendiri di kantong abu-abu. Botol murid dibawa pulang.
- Pengecoh: Semua kantong ditinggalkan dekat pohon. Tidak ada kantong ditinggalkan dekat pohon.

### tka-bi-informasi-tersurat-q8

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `sampah`: “Sebelum meninggalkan taman, setiap kelompok memeriksa area duduknya.”
Alasan hubungan bukti/kunci: Urutan kegiatan tertulis: sebelum meninggalkan taman, setiap kelompok memeriksa area duduknya. Tidak ada kegiatan membakar sampah dalam bacaan.

### tka-bi-informasi-tersurat-q9

Kompetensi: `bi.textual.explicit`. Status: **lulus audit**.
- Bukti `sampah`: “Pak Arif meminta setiap murid membawa botol minum dan kotak makan sendiri.”
- Bukti `sampah`: “aturan warna tersebut dibuat khusus untuk piknik mereka, bukan aturan semua tempat.”
- Bukti `sampah`: “Sesampainya di sekolah, murid mencatat jenis sampah yang paling banyak ditemukan”
Alasan hubungan bukti/kunci: Perhatikan batas aturan dan urutan tempat kegiatan.
- Murid membawa botol minum sendiri. → Sesuai. Permintaan itu disampaikan sebelum berangkat.
- Aturan warna berlaku di semua tempat. → Tidak Sesuai. Guru menyatakan aturan khusus untuk piknik mereka.
- Jenis sampah dicatat sesampainya di sekolah. → Sesuai. Catatan akan dibahas pada pelajaran berikutnya.

## tka-math-membandingkan-pecahan

Membandingkan dan mengurutkan pecahan: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.


### tka-math-membandingkan-pecahan-q1

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: Pembilang 5 > 2 pada penyebut sama 7.

### tka-math-membandingkan-pecahan-q2

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 1/6 < 2/6 = 1/3.

### tka-math-membandingkan-pecahan-q3

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 9/12 > 8/12.

### tka-math-membandingkan-pecahan-q4

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 3/4 dan 2/3 > 1/2; 2/5 < 1/2; 4/8 = 1/2.

### tka-math-membandingkan-pecahan-q5

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: Dengan penyebut 6: 2 < 3 < 5.

### tka-math-membandingkan-pecahan-q6

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 0,4 < 0,8; 3/12 < 4/12; 3/6 = 1/2.

### tka-math-membandingkan-pecahan-q7

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 4/8 > 3/8 liter.

### tka-math-membandingkan-pecahan-q8

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: Urutan a dan b meningkat; c menurun; d tertukar pada dua nilai awal.

### tka-math-membandingkan-pecahan-q9

Kompetensi: `math.fraction.compare`. Status: **lulus audit**.
Verifikasi hitung: 6/8 > 5/8; 2/6 = 1/3; 1/8 < 2/8 < 4/8.

## tka-math-pecahan-desimal-persen

Pecahan, desimal, dan persen: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.


### tka-math-pecahan-desimal-persen-q1

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 1/2 × 100 = 50%.

### tka-math-pecahan-desimal-persen-q2

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 1 ÷ 4 = 0,25.

### tka-math-pecahan-desimal-persen-q3

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 75/100 dibagi FPB 25 = 3/4.

### tka-math-pecahan-desimal-persen-q4

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 1/5 = 0,2 = 20%; 2/5 = 40%; 0,02 = 2%.

### tka-math-pecahan-desimal-persen-q5

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 3/5 × 100 = 60%.

### tka-math-pecahan-desimal-persen-q6

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 0,5 = 50%; 1/4 = 25%, bukan 40%; 0,1 = 10%.

### tka-math-pecahan-desimal-persen-q7

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 25/100 = 1/4.

### tka-math-pecahan-desimal-persen-q8

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: 0,8 = 80%; 3/4 = 75%; 0,3 = 30%; 1/5 = 20%.

### tka-math-pecahan-desimal-persen-q9

Kompetensi: `math.fraction.forms`. Status: **lulus audit**.
Verifikasi hitung: Terisi 75% = 3/4; sisa 100% − 75% = 25%.

## tka-math-pecahan-senilai

Pecahan senilai: 9 soal (5 pilihan tunggal, 2 multi-select, 2 kategori pernyataan). Tujuan, dua bagian materi, dua contoh, dan pembahasan diperiksa.


### tka-math-pecahan-senilai-q1

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: Visual: 2 bagian diarsir dari 4 partisi sama besar.

### tka-math-pecahan-senilai-q2

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 2 × 3 = 6 × 1; pilihan lain berbeda dari 1/3.

### tka-math-pecahan-senilai-q3

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 4 dan 8 dibagi FPB 4 menjadi 1 dan 2.

### tka-math-pecahan-senilai-q4

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 4/6 dan 6/9 = 2/3; 2/6 = 1/3; 3/4 berbeda.

### tka-math-pecahan-senilai-q5

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 3/4 × 12 = 9; 9/12 = 3/4.

### tka-math-pecahan-senilai-q6

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: Nilai: 0,5 = 0,5; 0,5 ≠ 0,25; 0,5 = 0,5.

### tka-math-pecahan-senilai-q7

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 3/6 = 1/2; dua keseluruhan disebut sama panjang.

### tka-math-pecahan-senilai-q8

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: 0,6 = 0,6; 0,25 = 0,25; 2/3 ≠ 3/4; 1/3 ≠ 1/6.

### tka-math-pecahan-senilai-q9

Kompetensi: `math.fraction.equivalent`. Status: **lulus audit**.
Verifikasi hitung: Membelah setiap bagian menggandakan kedua hitungan: 8/16 = 1/2; 4/16 = 1/4.

## Temuan dan penyelesaian

- Tidak ditemukan kunci hitung yang keliru dalam 27 soal Math pada pass independen.
- Seluruh evidence 27 soal BI cocok persis dengan stimulus. Inferensi amanat/tokoh ditandai lewat kompetensi, tidak dipresentasikan sebagai kutipan eksplisit.
- Aturan warna kantong pada teks piknik dibatasi pada cerita agar tidak membuat generalisasi ke semua fasilitas sampah.
- Semua 9 bacaan berada pada 168–183 kata. Tidak ada teks bank soal yang disalin.
- Review manusia terhadap bahasa dan pedagogi belum dilakukan; audit ini menyatakan hasil pemeriksaan agent dan aritmetika, bukan persetujuan ahli.
