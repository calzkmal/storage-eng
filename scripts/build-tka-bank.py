"""Build original expanded SD practice. Existing six seed JSONs are never rewritten."""
import json, pathlib, sys
sys.dont_write_bytecode=True
from fractions import Fraction
sys.path.insert(0,str(pathlib.Path(__file__).parent/'tka'))
from build_math import item, num
from build_bi import TOPICS
ROOT=pathlib.Path(__file__).resolve().parent.parent
LESSONS=ROOT/'content/lessons';SETS=ROOT/'content/tka-sets'
SETS.mkdir(exist_ok=True)
AUDIT={}
MATH=[
('pecahan-senilai',1,1,'Pecahan senilai','math.fraction.equivalent','Pecahan senilai diperoleh dengan mengalikan atau membagi pembilang dan penyebut dengan bilangan sama yang bukan nol.','Nilai pecahan tetap meskipun jumlah bagiannya berubah. Sederhanakan dengan membagi kedua bilangan menggunakan faktor yang sama.'),
('membandingkan-pecahan',1,2,'Membandingkan pecahan','math.fraction.compare','Samakan penyebut atau gunakan perkalian silang untuk membandingkan pecahan positif.','Jika penyebut sama, pembilang terbesar menghasilkan pecahan terbesar. Bandingkan bagian dari keseluruhan yang sama besar.'),
('pecahan-desimal-persen',1,3,'Pecahan, desimal, dan persen','math.fraction.forms','Persen berarti per seratus. Ubah pecahan menjadi desimal melalui pembagian pembilang dengan penyebut.','Untuk menjadi persen, kalikan nilai pecahan atau desimal dengan 100%. Saat menjawab bilangan persen, tulis angkanya sesuai satuan dalam pertanyaan.'),
('operasi-campuran',1,4,'Operasi hitung campuran','math.number.operations','Urutan pengerjaan: tanda kurung, pangkat atau akar, perkalian dan pembagian, lalu penjumlahan dan pengurangan.','Operasi setingkat dikerjakan dari kiri ke kanan. Perhatikan tanda negatif; pengurangan dapat menghasilkan bilangan negatif.'),
('operasi-pecahan',1,5,'Operasi pecahan, desimal, dan persen','math.fraction.operations','Jumlahkan atau kurangkan pecahan setelah penyebut disamakan. Pecahan campuran dapat diubah menjadi pecahan biasa.','Perkalian pecahan mengalikan pembilang dan penyebut. Pembagian mengalikan dengan kebalikan pembagi. Sejajarkan nilai tempat pada operasi desimal; persen dihitung per seratus.'),
('fpb-kpk',1,6,'FPB dan KPK dalam soal cerita','math.number.factors','FPB adalah faktor terbesar yang membagi semua bilangan yang dibandingkan. KPK adalah kelipatan positif terkecil yang dimiliki bersama.','Pembagian benda menjadi paket sebanyak mungkin menggunakan FPB. Pertemuan kegiatan berulang menggunakan KPK, dengan awal kegiatan berlangsung bersama.'),
('perbandingan-skala',1,7,'Perbandingan senilai, berbalik nilai, dan skala','math.number.ratio','Perbandingan senilai memiliki hasil bagi tetap, misalnya harga barang dengan harga satuan yang sama. Perbandingan berbalik nilai memiliki hasil kali tetap untuk beban pekerjaan yang sama.','Skala adalah perbandingan ukuran gambar dengan ukuran sebenarnya dalam satuan sama. Pada skala 1 : n, panjang sebenarnya adalah panjang gambar dikali n.'),
('bangun-datar',2,1,'Sifat, keliling, dan luas bangun datar','math.geometry.plane','Keliling adalah panjang seluruh batas bangun. Luas adalah ukuran daerah di dalamnya. Persegi mempunyai empat sisi sama panjang; persegi panjang mempunyai dua pasang sisi berhadapan sejajar dan sama panjang.','Luas segitiga = alas × tinggi tegak lurus ÷ 2. Untuk lingkaran, keliling = 2πr dan luas = πr². Bedakan jari-jari dari diameter, serta satuan panjang dari satuan luas.'),
('bangun-ruang',2,2,'Bangun ruang, jaring-jaring, dan volume','math.geometry.solid','Volume mengukur isi ruang; luas permukaan menjumlahkan daerah seluruh sisi luar. Kubus mempunyai enam sisi persegi, dua belas rusuk, dan delapan titik sudut.','Balok: V = p × l × t; luas permukaan = 2(pl + pt + lt). Tabung: V = πr²t; luas permukaan tabung tertutup = 2πr(r + t). Jaring-jaring harus dapat dilipat tanpa sisi bertumpuk; tabung mempunyai dua lingkaran dan selimut persegi panjang.'),
('satuan-ukuran',2,3,'Konversi panjang, massa, waktu, dan volume','math.measurement.units','Ubah semua besaran ke satuan yang sama sebelum menghitung. 1 km = 1.000 m; 1 m = 100 cm; 1 kg = 1.000 g.','Waktu memakai dasar 60: 1 jam = 60 menit, 1 menit = 60 detik. Volume: 1 liter = 1.000 mL = 1.000 cm³; 1 m³ = 1.000 liter.'),
('kecepatan-jarak-waktu',2,4,'Kecepatan, jarak, dan waktu','math.measurement.speed','Kecepatan rata-rata = jarak total ÷ waktu total. Pada kecepatan tetap, jarak = kecepatan × waktu.','Waktu = jarak ÷ kecepatan. Satuan harus cocok: kilometer dengan jam untuk km/jam, atau meter dengan detik untuk m/detik. Ubah menit terlebih dahulu jika diperlukan.'),
('penyajian-data',3,1,'Tabel, diagram batang, dan piktogram','math.data.read','Baca judul, label, dan skala sebelum membandingkan data. Total didapat dengan menjumlahkan frekuensi; selisih dengan pengurangan.','Dalam piktogram, jumlah simbol dikalikan nilai setiap simbol. Diagram batang dapat ditulis sebagai tinggi dalam unit; perhatikan berapa objek yang diwakili satu unit.'),
('statistika',3,2,'Mean, median, dan modus','math.data.center','Mean atau rata-rata = jumlah seluruh nilai ÷ banyak nilai. Median adalah nilai tengah setelah data diurutkan.','Untuk banyak data genap, median adalah rata-rata dua nilai tengah. Modus adalah nilai yang paling sering muncul; contoh latihan ini mempunyai satu modus.'),
('pola-bilangan',4,1,'Pola dan barisan bilangan','math.algebra.pattern','Cari perubahan antarsuku: penambahan, pengurangan, atau perkalian yang teratur. Gunakan aturan yang sama untuk memprediksi suku berikutnya.','Pola kuadrat mempunyai suku ke-n sebesar n², dimulai dari n = 1. Periksa aturan terhadap semua suku yang disediakan sebelum menjawab.'),
('aljabar-sederhana',4,2,'Persamaan sederhana dengan x','math.algebra.equation','Huruf x mewakili bilangan yang belum diketahui. Lakukan operasi yang sama pada kedua ruas persamaan agar kesetaraan tetap berlaku.','Balik urutan operasi untuk menemukan x: singkirkan penjumlahan atau pengurangan, kemudian perkalian atau pembagian. Substitusikan hasil ke persamaan awal untuk memeriksanya.'),
]
LEVEL={'stage':'sd','grade':6,'program':'tka'}
TYPES=['multiple_choice','multiple_choice','multiple_choice','multiple_select','multiple_choice','statement_category','multiple_choice','multiple_select','statement_category']
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def base(eid,comp,explanation):return dict(id=eid,prompt='Baca dengan teliti; gunakan satuan yang disebutkan dalam pertanyaan.',competency=comp,explanation=explanation)

def math_set(topic,comp,version):
    exercises=[]
    for i,kind in enumerate(TYPES):
        k=(version-1)*67+i*11
        row=item(topic,k);eid=f'tka-math-{topic}-v{version}-q{i+1}'
        e=base(eid,comp,row['reason']);e['type']=kind
        if kind=='multiple_choice':
            v=row['value']; options=[num(v),num(v+1),num(v-1),num(v+2)]
            shift=(version+i)%4;options=options[shift:]+options[:shift]
            e.update(question=row['question'],options=options,answer=num(v));AUDIT[eid]=[{'expr':row['expr'],'shown':num(v),'correct':True}]
            e['explanation']+=f" Hasilnya {num(v)} dalam satuan yang ditanyakan."
        else:
            count=4 if kind=='multiple_select' else 3
            claims=[];truths=[];audit=[]
            for j in range(count):
                r=item(topic,k+j+1);truth=((j+version+i)%count in (0,2));shown=r['value'] if truth else r['value']+1
                text=f"{r['question']} Jawaban: {num(shown)}."
                explanation=f"{r['reason']} Nilai yang tepat adalah {num(r['value'])}."
                claims.append(dict(id=chr(97+j),text=text,explanation=explanation));truths.append(truth);audit.append(dict(expr=r['expr'],shown=num(shown),correct=truth))
            if kind=='multiple_select':e.update(question='Pilih semua perhitungan yang menghasilkan jawaban tepat.',options=claims,answer=[c['id'] for c,t in zip(claims,truths) if t])
            else:e.update(question='Tentukan benar atau salah untuk setiap perhitungan.',categories=[dict(id='yes',label='Benar'),dict(id='no',label='Salah')],statements=[dict(**c,answer='yes' if t else 'no') for c,t in zip(claims,truths)])
            e['explanation']='Periksa setiap soal secara terpisah. '+ ' '.join(c['explanation'] for c in claims)
            AUDIT[eid]=audit
        exercises.append(e)
    return exercises

def math_lessons():
    for topic,cat,order,title,comp,p1,p2 in MATH:
        lid=f'tka-math-{topic}';file=LESSONS/f'{lid}.json'
        sets=[math_set(topic,comp,v) for v in (1,2,3)]
        if topic not in ('pecahan-senilai','membandingkan-pecahan','pecahan-desimal-persen'):
            examples=[]
            for k in (0,1):
                r=item(topic,k);examples.append(dict(type='worked_example',question=r['question'],steps=[r['reason']],conclusion=f"Jawaban: {num(r['value'])} dalam satuan yang ditanyakan."))
            material=[dict(type='paragraph',title='Konsep dan aturan',text=p1),dict(type='paragraph',title='Langkah dan pemeriksaan',text=p2),*examples]
            if comp.startswith('math.fraction.'):material.insert(2,dict(type='fraction',visual=dict(numerator=2,denominator=4)))
            write(file,dict(id=lid,subject='matematika',category=cat,order=order,title=title,level=LEVEL,objectives=[f'Menyelesaikan soal {title.lower()} dan menjelaskan langkahnya.'],material=material,exercises=sets[0]))
        else:
            # Original seeds stay unchanged; remove unused generated audit entries.
            for e in sets[0]:AUDIT.pop(e['id'],None)
        write(SETS/f'{lid}.json',sets[1:])

SCENARIOS=[
'''Kelompok kelas enam menyiapkan bahan untuk pameran literasi sekolah. Mereka bekerja di ruang baca pada Rabu sore. Setiap anggota memperoleh tugas: membaca sumber, mencatat gagasan, menyunting kalimat, atau memeriksa hasil akhir. Guru meminta mereka menjelaskan alasan pilihan kepada teman, bukan hanya menyalin jawaban. Jika ada dua pendapat berbeda, kelompok kembali membaca bagian yang berkaitan sebelum mengambil keputusan.

Hasil kerja akan dibaca oleh murid kelas lain dan orang tua. Karena itu, penjelasan harus jelas dan sesuai informasi. Kelompok memberi judul, menyusun bagian secara teratur, lalu meminta seorang teman membaca draf tanpa penjelasan tambahan. Dari pertanyaan teman tersebut, mereka mengetahui bagian yang masih perlu diperbaiki. Catatan yang diperiksa bersama berisi pokok-pokok berikut.''',
'''Di kelas enam, murid mengikuti lokakarya membaca dan menyunting. Bu Guru membagikan catatan untuk dibahas berpasangan. Seorang murid membaca bagian awal, sedangkan pasangannya menyebutkan bukti yang mendukung penafsiran. Mereka berganti peran setelah beberapa menit agar semua anggota berlatih. Jawaban yang berbeda dicatat dahulu, kemudian dibandingkan dengan konteks lengkap, bukan diputuskan berdasarkan siapa yang berbicara paling keras.

Pada akhir kegiatan, pasangan menulis penjelasan singkat untuk pembaca yang tidak mengikuti diskusi. Mereka berusaha menjaga arti, menggunakan kalimat jelas, dan membedakan informasi dari dugaan. Tulisan diperiksa kembali sebelum ditempel di papan kelas. Guru menghargai alasan yang sesuai dengan bacaan, bukan jawaban panjang yang tidak menjawab pertanyaan. Berikut beberapa pokok dalam catatan yang mereka periksa.'''
]

def bi_set(lid,comp,stimuli,pools,version):
    result=[];patterns=[['multiple_choice','multiple_choice','multiple_select'],['multiple_choice','statement_category','multiple_choice'],['multiple_select','multiple_choice','statement_category']]
    for g,(stim,pool) in enumerate(zip(stimuli,pools)):
        yes,no=pool[:2]; reasons=pool[2] if len(pool)>2 else {}; evidence=list(dict.fromkeys(p[1] for p in yes));positive=[p[0] for p in yes];negative=no
        for slot,kind in enumerate(patterns[g]):
            eid=f'{lid}-v{version}-q{len(result)+1}'
            e=base(eid,comp,'Gunakan konteks bacaan. '+ ' '.join(positive));e.update(type=kind,stimulusId=stim['id'],evidence=evidence,prompt='Nilai makna dan informasi berdasarkan bacaan yang disediakan.')
            offset=(version-1+slot+g)%3
            if kind=='multiple_choice':
                # Version 2 tests a misconception; other versions focus different supported claims.
                false_focus=version==2
                answer=negative[offset] if false_focus else positive[offset]
                options=[answer,*((positive if false_focus else negative))]
                shift=(slot+version+g)%4;options=options[shift:]+options[:shift]
                e.update(question='Pernyataan mana yang '+('tidak didukung oleh' if false_focus else 'tepat berdasarkan')+' bacaan?',options=options,answer=answer)
                e['explanation']=('Pernyataan ini tidak didukung oleh bacaan. ' if false_focus else 'Pernyataan ini sesuai konteks bacaan. ')+reasons.get(answer,' '.join(positive))
            else:
                chosen=[(positive[offset],True),(negative[(offset+1)%3],False),(positive[(offset+1)%3],True)]
                if kind=='multiple_select':chosen.append((negative[(offset+2)%3],False))
                # Alternate position of true options across versions.
                shift=(version+g)%len(chosen);chosen=chosen[shift:]+chosen[:shift]
                claims=[dict(id=chr(97+j),text=t,explanation=('Sesuai dengan konteks. ' if truth else 'Tidak didukung oleh konteks. ')+reasons.get(t,' '.join(positive))) for j,(t,truth) in enumerate(chosen)]
                if kind=='multiple_select':e.update(question='Pilih semua pernyataan yang tepat berdasarkan bacaan.',options=claims,answer=[c['id'] for c,(_,truth) in zip(claims,chosen) if truth])
                else:e.update(question='Apakah tiap pernyataan sesuai dengan bacaan?',categories=[dict(id='yes',label='Sesuai'),dict(id='no',label='Tidak sesuai')],statements=[dict(**c,answer='yes' if truth else 'no') for c,(_,truth) in zip(claims,chosen)])
            if kind!='multiple_choice' and reasons: e['explanation']='Periksa tiap klaim berdasarkan bukti. '+' '.join(reasons[t] for t,_ in chosen)
            result.append(e)
    return result

REASONS={
'kosakata':['Termometer mengukur suhu, bukan panjang.','Teks menyatakan istilah khusus tidak selalu sulit; penggunaannya bergantung pada bidang.'],
'makna-kata':['Sambutan hangat menggambarkan keramahan, bukan suhu ruangan.','Rendah hati menjelaskan sikap tidak sombong, bukan letak organ tubuh.'],
'ikhtisar-bagan':['Ikhtisar mempertahankan isi pokok secara singkat, bukan menyalin semua kalimat.','Alur yang dijelaskan adalah pengumpulan, penimbangan, pencatatan, kemudian pengolahan.'],
'kalimat-utama':['Pemilihan kalimat utama didasarkan pada gagasan dan hubungan makna, bukan panjang kalimat.','Judul menamai seluruh tulisan; kalimat utama memuat gagasan pokok suatu paragraf.'],
'unsur-cerita':['Kata aku menunjukkan narator terlibat sebagai tokoh, sehingga sudut pandangnya orang pertama.','Buku ditemukan di bawah karton dalam kotak bahan pameran.'],
'simpulan':['Tama berlatih satu kalimat setiap hari dan masih perlu kartu saat tampil.','Teman memberi saran tanpa mengejek, sehingga Tama mendapat dukungan.'],
'kebahasaan-majas':['Bintang kelas adalah metafora bagi murid berprestasi; tidak memberi benda tindakan manusia.','Para sudah menunjukkan jamak; pengulangan murid-murid membuat bentuk itu berlebihan.'],
'fakta-opini':['Selera Riko hanya pendapat pribadi; tidak dapat digeneralisasi kepada semua murid.','Catatan tersebut hanya mencatat satu hari, sehingga tidak membuktikan kebiasaan selama satu tahun.'],
'penilaian-teks':['Kritik menilai isi dengan bukti dan alasan, bukan menyerang pribadi penulis.','Pengumuman belum mencantumkan tanggal lengkap dan penanggung jawab.'],
'jenis-teks':['Narasi menceritakan rangkaian peristiwa; dalam bacaan contohnya perjalanan Sari.','Deskripsi kebun menggambarkan ciri tempat; proses sebab-akibat hujan merupakan eksplanasi.'],
'huruf-kapital-tanda-baca':['Kata kota tidak selalu berkapital; kapital dipakai sesuai fungsi nama diri dan awal kalimat.','Kalimat berita diakhiri titik; tanda tanya dipakai untuk pertanyaan.'],
'kata-baku':['Bentuk bakunya aktivitas, sedangkan aktifitas merupakan bentuk tidak baku.','Kebiasaan percakapan tidak cukup menentukan bentuk baku; gunakan kamus sebagai acuan.'],
'sinonim-antonim':['Dalam ukuran lebar jalan, sempit berlawanan dengan lebar; pendek mengacu pada panjang.','Sinonim mempunyai konteks dan nuansa sehingga tidak selalu dapat dipertukarkan.'],
}

THIRD_REASONS={'kosakata': 'Bagian memiliki cakupan umum; akar adalah salah satu bagian tertentu.', 'makna-kata': 'Panjang tangan dapat berarti suka mencuri, bukan rajin membantu.', 'ikhtisar-bagan': 'Ringkasan mempertahankan isi teks dan tidak menambahkan hasil yang tidak dilaporkan.', 'kalimat-utama': 'Kalimat terakhir paragraf kedua merangkum contoh, sehingga gagasan utama berada di akhir.', 'unsur-cerita': 'Tema cerita adalah persahabatan, kerja sama, dan ketelitian; tidak ada persaingan olahraga.', 'simpulan': 'Cerita hanya menjelaskan perkembangan Tama; tidak membuktikan waktu yang sama bagi semua orang.', 'kebahasaan-majas': 'Laporan tidak langsung mengubah aku menjadi Beni serta ini menjadi itu, tanpa mengutip ucapan secara langsung.', 'fakta-opini': 'Pendapat tentang selera atau kenyamanan bukan hasil pengukuran objektif yang dapat berlaku bagi semua orang.', 'penilaian-teks': 'Pengalaman dapat dibandingkan dengan bacaan, tetapi fakta bacaan tetap dipertahankan.', 'jenis-teks': 'Jenis teks dikenali dari tujuan dan cara penyajian, bukan hanya panjang tulisan.', 'huruf-kapital-tanda-baca': 'Pada kalimat Rani membawa buku, subjek dan predikat tidak dipisahkan oleh koma.', 'kata-baku': 'Nama diri orang dan tempat tidak boleh diubah hanya karena mirip kata umum.', 'sinonim-antonim': 'Bersih dan kotor berlawanan makna, bukan bersinonim.'}

def bi_lessons():
    for topic,cat,order,title,comp,text,yes,no in TOPICS:
        lid='tka-bi-'+topic
        paragraphs=text.split('\n\n')
        # A full narrative and two different classroom contexts with source-based instructional notes.
        stimuli=[dict(id=lid+'-bacaan-1',title=title+' dalam bacaan',paragraphs=paragraphs,attribution='Teks orisinal untuk latihan ini.')]
        quotes='Pokok catatan: '+ '; '.join('«'+q+'»' for _,q in yes)
        for j,scenario in enumerate(SCENARIOS):
            variant=scenario.split('\n\n')+[quotes, 'Setelah itu, mereka menandai kata penting dan membaca ulang kalimat sebelum serta sesudahnya. Catatan tidak langsung diterima hanya karena ditulis rapi; isinya tetap dibandingkan dengan penjelasan yang sedang dipelajari.']
            stimuli.append(dict(id=f'{lid}-bacaan-{j+2}',title=['Diskusi pameran literasi','Catatan lokakarya'][j],paragraphs=variant,attribution='Teks orisinal untuk latihan ini.'))
        material=[dict(type='paragraph',title='Cara membaca',text='Baca seluruh konteks dan hubungkan rincian dengan pertanyaan. '+yes[0][0]),dict(type='paragraph',title='Periksa alasan',text='Jangan memilih berdasarkan satu kata yang tampak sama. '+yes[1][0]+' '+yes[2][0])]
        material += [dict(type='worked_example',question='Apakah pernyataan berikut sesuai dengan bacaan: '+no[i],steps=['Temukan bagian yang menjelaskan gagasan terkait.',REASONS[topic][i]],conclusion='Tidak sesuai. '+REASONS[topic][i]) for i in (0,1)]
        reasons={claim:'Bacaan mendukung penjelasan ini: '+quote for claim,quote in yes}
        reasons.update({claim:reason for claim,reason in zip(no,[*REASONS[topic],THIRD_REASONS[topic]])})
        sets=[bi_set(lid,comp,stimuli,[(yes,no,reasons)]*3,v) for v in (1,2,3)]
        write(LESSONS/(lid+'.json'),dict(id=lid,subject='bahasa-indonesia',category=cat,order=order,title=title,level=LEVEL,objectives=['Menentukan jawaban dan bukti yang tepat pada topik '+title.lower()+'.'],material=material,stimuli=stimuli,exercises=sets[0]))
        write(SETS/(lid+'.json'),sets[1:])
    # Supplement original BI seeds using original passage facts and distractors.
    for topic in ('informasi-tersurat','ide-pokok','amanat-dan-tokoh'):
        lid='tka-bi-'+topic;lesson=json.loads((LESSONS/(lid+'.json')).read_text());pools=[]
        for stimulus in lesson['stimuli']:
            exercises=[e for e in lesson['exercises'] if e['stimulusId']==stimulus['id']]
            yes=[];no=[]
            for e in exercises:
                if e['type']=='multiple_choice':
                    yes.append((f"Untuk pertanyaan «{e['question']}», jawaban yang tepat ialah «{e['answer']}».",e['evidence'][0]))
                    no.extend(f"Untuk pertanyaan «{e['question']}», jawaban yang tepat ialah «{o}»." for o in e['options'] if o!=e['answer'])
                elif e['type']=='multiple_select':
                    yes.extend((o['text'],e['evidence'][0]) for o in e['options'] if o['id'] in e['answer']);no.extend(o['text'] for o in e['options'] if o['id'] not in e['answer'])
                else:
                    yes.extend((s['text'],e['evidence'][0]) for s in e['statements'] if s['answer']=='yes');no.extend(s['text'] for s in e['statements'] if s['answer']!='yes')
            assert len(yes)>=3 and len(no)>=3,(lid,stimulus['id'])
            pools.append((yes[:3],no[:3]))
        write(SETS/(lid+'.json'),[bi_set(lid,lesson['exercises'][0]['competency'],lesson['stimuli'],pools,v) for v in (2,3)])

def registry():
    p=ROOT/'lib/subjects.ts';s=p.read_text();marker='\n};\n\nexport function compareLessons'
    entries=[]
    for topic,_,_,_,comp,*_ in MATH:entries.append((comp,'matematika','tka-math-'+topic))
    for topic,_,_,_,comp,*_ in TOPICS:entries.append((comp,'bahasa-indonesia','tka-bi-'+topic))
    for comp,subject,lid in entries:
        if '"'+comp+'":' not in s:s=s.replace(marker,f'\n  "{comp}": {{ subject: "{subject}", lessonId: "{lid}" }},'+marker)
    p.write_text(s)

if __name__=='__main__':
    registry();math_lessons();bi_lessons();write(ROOT/'content/tka-math-audit.json',AUDIT)
    print('Built 31 TKA topics × 3 sets × 9 exercises = 837 questions; six original seeds preserved.')
