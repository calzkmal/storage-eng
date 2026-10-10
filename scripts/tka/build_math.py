"""Deterministic authored math item templates. Python Fraction keeps exact keys."""
from fractions import Fraction
from math import gcd, sqrt, prod

def calc(e):
    if not isinstance(e,list): return Fraction(e)
    op,*v=e; a=[calc(x) for x in v]
    if op=='add':return sum(a)
    if op=='sub':return a[0]-a[1]
    if op=='mul':return prod(a)
    if op=='div':return a[0]/a[1]
    if op=='pow':return a[0]**int(a[1])
    if op=='sqrt':return Fraction(int(sqrt(a[0])))
    if op=='gcd':return Fraction(gcd(int(a[0]),int(a[1])))
    if op=='lcm':return Fraction(int(a[0]*a[1])//gcd(int(a[0]),int(a[1])))
    if op=='median':return sorted(a)[len(a)//2] if len(a)%2 else (sorted(a)[len(a)//2-1]+sorted(a)[len(a)//2])/2
    if op=='mode':return max(a,key=a.count)
    if op=='max':return max(a)
    if op=='min':return min(a)
    if op=='gt':return Fraction(a[0]>a[1])
    if op=='eq':return Fraction(a[0]==a[1])
    raise ValueError(op)

def num(v):
    v=Fraction(v)
    return str(v.numerator) if v.denominator==1 else (str(float(v)).rstrip('0').rstrip('.').replace('.',',') if v.denominator in (2,4,5,8,10,20,25,40,50,100) else f'{v.numerator}/{v.denominator}')

def item(topic,k):
    a=2+k%7;b=3+(k//7)%6;c=2+(k//3)%5;n=1+k%4
    def q(text,e,reason):return dict(question=text,expr=e,value=calc(e),reason=reason)
    f=lambda x,y:['div',x,y]
    if topic=='pecahan-senilai':
        return q(f'Pecahan {a}/{a*b} disederhanakan dengan membagi pembilang dan penyebut dengan {a}. Berapa nilai pecahan itu?',f(1,b),f'{a} ÷ {a} = 1 dan {a*b} ÷ {a} = {b}; nilainya 1/{b}.')
    if topic=='membandingkan-pecahan':
        return q(f'Manakah nilai terbesar di antara {a}/{a+b} dan {a+1}/{a+b}?',['max',f(a,a+b),f(a+1,a+b)],'Pada penyebut sama, pembilang yang lebih besar memberi nilai pecahan lebih besar.')
    if topic=='pecahan-desimal-persen':
        return q(f'Berapa persen yang setara dengan {n}/5?', ['mul',f(n,5),100],f'{n}/5 dikalikan 100%. Tulis jawabannya sebagai bilangan persen, tanpa tanda %.')
    if topic=='operasi-campuran':
        cases=[(f'{a} + {b} × {c}', ['add',a,['mul',b,c]],'Perkalian dikerjakan sebelum penjumlahan.'),(f'({a} + {b}) × {c}',['mul',['add',a,b],c],'Kerjakan bagian dalam tanda kurung lebih dahulu.'),(f'{a}² + √{b*b}',['add',['pow',a,2],['sqrt',b*b]],'Pangkat dan akar dikerjakan sebelum penjumlahan.'),(f'−{a} + {b} × {c}',['add',-a,['mul',b,c]],'Perkalian dahulu; lalu jumlahkan bilangan dengan memperhatikan tanda.'),(f'{a*b} ÷ {b} − {c}',['sub',['div',a*b,b],c],'Pembagian dikerjakan sebelum pengurangan.'),(f'{a*b*c} ÷ {b} × {c}',['mul',['div',a*b*c,b],c],'Perkalian dan pembagian setingkat: kerjakan dari kiri ke kanan.')]
        text,e,r=cases[k%len(cases)];return q(f'Hitung {text}.',e,r)
    if topic=='operasi-pecahan':
        cases=[(f'{a}/{a+b} + {b}/{a+b}',['add',f(a,a+b),f(b,a+b)],'Penyebut sama: jumlahkan pembilang.'),(f'{a+b}/{b} − {a}/{b}',['sub',f(a+b,b),f(a,b)],'Kurangkan pembilang karena penyebut sama.'),(f'{a}/3 × 3/{b}',['mul',f(a,3),f(3,b)],'Kalikan pembilang dan penyebut, kemudian sederhanakan.'),(f'{a}/4 ÷ {b}/4',['div',f(a,4),f(b,4)],'Pembagian pecahan menjadi perkalian dengan kebalikan pembagi.'),(f'{a} 1/2 + {b} 1/2',['add',a,f(1,2),b,f(1,2)],'Jumlahkan bagian bulat dan pecahan; dua setengah menjadi satu.'),(f'{a},5 + {b},25',['add',f(2*a+1,2),f(4*b+1,4)],'Sejajarkan nilai tempat desimal sebelum menjumlahkan.'),(f'{n*10}% dari {a*10}',['mul',f(n,10),a*10],'Ubah persen menjadi pecahan per seratus, lalu kalikan.')]
        text,e,r=cases[k%len(cases)];return q(f'Berapa hasil {text}?',e,r)
    if topic=='fpb-kpk':
        if k%2:return q(f'Dua bel berbunyi setiap {a*n} dan {b*n} menit. Keduanya baru berbunyi bersama. Berapa menit lagi keduanya berbunyi bersama?', ['lcm',a*n,b*n],'Waktu pertemuan berikutnya adalah KPK dua selang waktu.')
        return q(f'Ada {a*n} pensil dan {b*n} penghapus. Semua dibagi menjadi paket sebanyak mungkin dengan isi tiap paket sama, tanpa sisa. Berapa paket?', ['gcd',a*n,b*n],'Jumlah paket maksimum adalah FPB dua banyak barang.')
    if topic=='perbandingan-skala':
        cases=[(f'{a} buku berharga Rp{a*b*1000}. Berapa rupiah harga {c} buku yang sama?',['mul',c,b,1000],'Perbandingan senilai: harga per buku dikali jumlah buku.'),(f'{a} pekerja menyelesaikan tugas dalam {b*c} hari. Dengan kemampuan sama, berapa hari jika pekerjanya {a*b} orang?',['div',['mul',a,b*c],a*b],'Untuk pekerjaan tetap, jumlah pekerja × waktu tetap.'),(f'Skala denah 1 : {b*100}. Panjang gambar {a} cm. Berapa cm panjang sebenarnya?',['mul',a,b*100],'Panjang sebenarnya = panjang gambar × penyebut skala.'),(f'Jarak sebenarnya {a*b*100} cm, skala 1 : {b*100}. Berapa cm jarak pada denah?',['div',a*b*100,b*100],'Gunakan satuan sama, lalu bagi jarak sebenarnya dengan penyebut skala.')]
        return q(*cases[k%4])
    if topic=='bangun-datar':
        cases=[(f'Persegi bersisi {a} cm. Berapa cm kelilingnya?',['mul',4,a],'Keliling persegi = 4 × sisi.'),(f'Persegi bersisi {b} cm. Berapa cm² luasnya?',['pow',b,2],'Luas persegi = sisi × sisi.'),(f'Persegi panjang berukuran {a+b} cm × {a} cm. Berapa cm² luasnya?',['mul',a+b,a],'Luas persegi panjang = panjang × lebar.'),(f'Persegi panjang berukuran {a+b} cm × {a} cm. Berapa cm kelilingnya?',['mul',2,['add',a+b,a]],'Keliling = 2 × (panjang + lebar).'),(f'Segitiga beralas {2*a} cm dan tinggi tegak lurus {b} cm. Berapa cm² luasnya?',['div',['mul',2*a,b],2],'Luas segitiga = alas × tinggi ÷ 2.'),(f'Lingkaran berjari-jari {7*n} cm. Gunakan π = 22/7. Berapa cm kelilingnya?',['mul',2,f(22,7),7*n],'Keliling lingkaran = 2 × π × jari-jari.'),(f'Lingkaran berjari-jari {7*n} cm. Gunakan π = 22/7. Berapa cm² luasnya?',['mul',f(22,7),['pow',7*n,2]],'Luas lingkaran = π × jari-jari².'),('Berapa pasang sisi sejajar yang dimiliki persegi panjang?',2,'Sisi berhadapan sejajar: ada dua pasang.'),('Segitiga mempunyai berapa sisi?',3,'Segitiga dibatasi oleh tiga ruas garis.')]
        return q(*cases[k%9])
    if topic=='bangun-ruang':
        cases=[(f'Kubus berusuk {a} cm. Berapa cm³ volumenya?',['pow',a,3],'Volume kubus = rusuk³.'),(f'Kubus berusuk {a} cm. Berapa cm² luas permukaannya?',['mul',6,['pow',a,2]],'Enam sisi persegi, masing-masing seluas rusuk².'),(f'Balok berukuran {a} cm × {b} cm × {c} cm. Berapa cm³ volumenya?',['mul',['mul',a,b],c],'Volume balok = panjang × lebar × tinggi.'),(f'Balok berukuran {a} cm × {b} cm × {c} cm. Berapa cm² luas permukaannya?',['mul',2,['add',['mul',a,b],['mul',a,c],['mul',b,c]]],'Jumlahkan luas tiga pasang sisi yang berhadapan.'),(f'Tabung berjari-jari {7*n} cm dan tinggi {a} cm. π = 22/7. Berapa cm³ volumenya?',['mul',['mul',f(22,7),['pow',7*n,2]],a],'Volume tabung = luas alas lingkaran × tinggi.'),(f'Tabung tertutup berjari-jari {7*n} cm dan tinggi {a} cm. π = 22/7. Berapa cm² luas permukaannya?',['mul',['mul',2,f(22,7)],['mul',7*n,['add',7*n,a]]],'Luas permukaan tabung = 2πr(r + t).'),('Jaring-jaring kubus tersusun dari berapa persegi sama besar?',6,'Kubus mempunyai enam sisi persegi; susunan harus dapat dilipat tanpa tumpang tindih.'),('Jaring-jaring tabung tertutup memiliki berapa lingkaran?',2,'Ada satu lingkaran alas dan satu lingkaran tutup, serta satu persegi panjang untuk selimut.'),('Kubus mempunyai berapa titik sudut?',8,'Empat titik sudut pada sisi bawah dan empat pada sisi atas.')]
        return q(*cases[k%9])
    if topic=='satuan-ukuran':
        cases=[(f'{a} km = berapa meter?',['mul',a,1000],'1 km = 1.000 m.'),(f'{b} kg = berapa gram?',['mul',b,1000],'1 kg = 1.000 g.'),(f'{a} jam {b} menit = berapa menit?',['add',['mul',a,60],b],'1 jam = 60 menit.'),(f'{a} liter = berapa mililiter?',['mul',a,1000],'1 liter = 1.000 mL.'),(f'{a} m³ = berapa liter?',['mul',a,1000],'1 m³ = 1.000 liter.'),(f'{a} menit = berapa detik?',['mul',a,60],'1 menit = 60 detik.'),(f'{a*100} cm = berapa meter?',['div',a*100,100],'1 m = 100 cm.'),(f'{b*1000} cm³ = berapa liter?',['div',b*1000,1000],'1 liter = 1.000 cm³.')]
        return q(*cases[k%8])
    if topic=='kecepatan-jarak-waktu':
        cases=[(f'Sepeda menempuh {a*b} km dalam {a} jam. Berapa km/jam kecepatan rata-ratanya?',['div',a*b,a],'Kecepatan = jarak ÷ waktu.'),(f'Bus bergerak dengan kecepatan tetap {b*10} km/jam selama {a} jam. Berapa km jaraknya?',['mul',b*10,a],'Jarak = kecepatan × waktu.'),(f'Mobil menempuh {a*b*10} km dengan kecepatan tetap {b*10} km/jam. Berapa jam waktu tempuhnya?',['div',a*b*10,b*10],'Waktu = jarak ÷ kecepatan.'),(f'Pelari menempuh {a*60} meter dalam {a} menit. Berapa meter/detik kecepatan rata-ratanya?',['div',a*60,a*60],'Ubah menit menjadi detik dahulu: 1 menit = 60 detik.')]
        return q(*cases[k%4])
    if topic=='penyajian-data':
        data=[a,b,c,a+b];table=f'Data buku dipinjam: Senin {a}, Selasa {b}, Rabu {c}, Kamis {a+b}.'
        cases=[(table+' Berapa total buku selama empat hari?',['add',*data],'Jumlahkan keempat frekuensi.'),(table+' Berapa selisih Kamis dan Senin?',['sub',a+b,a],'Selisih dihitung dengan pengurangan.'),(f'Piktogram apel: Rani {"●"*a}, Bima {"●"*b}. Satu ● berarti 2 apel. Berapa apel Bima?',['mul',b,2],'Banyak simbol dikali nilai tiap simbol.'),(f'Diagram batang kantin: air {a} unit, susu {b} unit, jus {c} unit. Satu unit berarti 5 botol. Berapa total botol?',['mul',['add',a,b,c],5],'Jumlahkan tinggi batang, lalu kalikan skala 5.')]
        return q(*cases[k%4])
    if topic=='statistika':
        data=[a,a,b,b+c,a+b+c];text=', '.join(map(str,data))
        cases=[(f'Data: {text}. Berapa rata-ratanya?',['div',['add',*data],len(data)],'Rata-rata = jumlah data ÷ banyak data.'),(f'Data: {text}. Berapa mediannya?',['median',*data],'Urutkan seluruh data; ambil nilai tengah.'),(f'Data: {a}, {b+10}, {a}, {c+20}, {a}. Berapa modusnya?',['mode',a,b+10,a,c+20,a],'Modus adalah nilai yang paling sering muncul.'),(f'Data: {a}, {a+2}, {a+4}, {a+6}. Berapa mediannya?',['median',a,a+2,a+4,a+6],'Pada empat data terurut, median adalah rata-rata dua nilai tengah.')]
        return q(*cases[k%4])
    if topic=='pola-bilangan':
        cases=[(f'Barisan {a}, {a+b}, {a+2*b}, {a+3*b}, ... . Berapa suku berikutnya?',['add',a,['mul',4,b]],'Selisih antarsuku tetap.'),(f'Barisan {a}, {a*2}, {a*4}, {a*8}, ... . Berapa suku berikutnya?',['mul',a,16],'Setiap suku dikalikan 2.'),(f'Barisan 1, 4, 9, 16, ... . Berapa suku ke-{a+4}?',['pow',a+4,2],'Suku ke-n adalah n².'),(f'Barisan {a+4*b}, {a+3*b}, {a+2*b}, {a+b}, ... . Berapa suku berikutnya?',a,'Setiap suku berkurang dengan selisih yang sama.')]
        return q(*cases[k%4])
    if topic=='aljabar-sederhana':
        cases=[(f'x + {b} = {a+b}. Berapa x?',['sub',a+b,b],'Kurangi kedua ruas dengan bilangan yang sama.'),(f'{b}x = {a*b}. Berapa x?',['div',a*b,b],'Bagi kedua ruas dengan koefisien x.'),(f'{b}x + {c} = {a*b+c}. Berapa x?',['div',['sub',a*b+c,c],b],'Kurangi konstanta dahulu, lalu bagi dengan koefisien.'),(f'x/{b} = {a}. Berapa x?',['mul',a,b],'Kalikan kedua ruas dengan pembagi.'),(f'x − {b} = −{a+b}. Berapa x?',['add',-(a+b),b],'Tambah kedua ruas dengan b, tetap perhatikan tanda negatif.')]
        return q(*cases[k%5])
    raise ValueError(topic)
