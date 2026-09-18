# Requirements Document

## Introduction

Expense & Budget Visualizer adalah aplikasi web mobile-friendly yang membantu pengguna melacak pengeluaran harian mereka. Aplikasi ini berjalan sepenuhnya di browser tanpa backend server, menyimpan data menggunakan Local Storage, dan menampilkan distribusi pengeluaran dalam bentuk pie chart interaktif. Dibangun dengan HTML, CSS, dan Vanilla JavaScript murni.

## Glossary

- **App**: Aplikasi web Expense & Budget Visualizer secara keseluruhan.
- **Transaction**: Satu entri pengeluaran yang terdiri dari nama item, jumlah uang, dan kategori.
- **Transaction_List**: Komponen UI yang menampilkan seluruh daftar Transaction yang telah ditambahkan.
- **Input_Form**: Komponen UI formulir untuk memasukkan data Transaction baru.
- **Validator**: Logika validasi yang memastikan semua field pada Input_Form telah diisi sebelum data disimpan.
- **Balance_Display**: Komponen UI yang menampilkan total pengeluaran dari seluruh Transaction.
- **Chart**: Komponen pie chart yang menampilkan distribusi pengeluaran berdasarkan kategori.
- **Storage**: Antarmuka browser Local Storage API yang menyimpan dan memuat data Transaction.
- **Category**: Klasifikasi Transaction, terbatas pada tiga nilai: Food, Transport, Fun.

---

## Requirements

### Requirement 1: Menambah Transaksi

**User Story:** Sebagai pengguna, saya ingin mengisi formulir dengan nama item, jumlah, dan kategori, sehingga saya dapat mencatat pengeluaran baru ke dalam daftar.

#### Acceptance Criteria

1. THE Input_Form SHALL menyediakan field teks untuk nama item dengan panjang maksimal 100 karakter, field angka untuk jumlah uang dengan nilai antara 0.01 hingga 999.999.999,99, dan dropdown pilihan kategori dengan nilai Food, Transport, dan Fun.
2. WHEN pengguna menekan tombol submit pada Input_Form, THE Validator SHALL memeriksa bahwa field nama item, jumlah uang, dan kategori tidak kosong.
3. IF salah satu field pada Input_Form kosong saat tombol submit ditekan, THEN THE Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field mana yang belum diisi dan mencegah penambahan Transaction.
4. IF field jumlah uang pada Input_Form berisi nilai di luar rentang 0.01 hingga 999.999.999,99 saat tombol submit ditekan, THEN THE Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field jumlah uang tidak valid dan mencegah penambahan Transaction.
5. WHEN Validator memvalidasi semua field terisi dengan benar, THE App SHALL menambahkan Transaction baru ke Transaction_List dalam waktu kurang dari 1 detik.
6. WHEN Transaction baru berhasil ditambahkan, THE Input_Form SHALL mengosongkan semua field kembali ke kondisi awal.

---

### Requirement 2: Menampilkan Daftar Transaksi

**User Story:** Sebagai pengguna, saya ingin melihat seluruh daftar transaksi yang telah saya masukkan, sehingga saya dapat memantau riwayat pengeluaran saya.

#### Acceptance Criteria

1. THE Transaction_List SHALL menampilkan setiap Transaction dengan nama item (maksimal 100 karakter), jumlah uang (dalam format mata uang dengan 2 desimal), dan kategori secara bersamaan dalam satu baris entri.
2. WHILE terdapat lebih dari satu Transaction, THE Transaction_List SHALL dapat di-scroll secara vertikal untuk menampilkan seluruh entri; batas maksimal 1000 Transaction diberlakukan sebagai invariant oleh Storage sehingga scrollability tetap berlaku untuk semua jumlah Transaction yang valid.
3. THE Transaction_List SHALL menyediakan tombol hapus yang teridentifikasi secara unik pada setiap entri Transaction.
4. WHEN pengguna menekan tombol hapus pada sebuah entri, THE App SHALL menghapus Transaction tersebut dari Transaction_List dan memperbarui tampilan Transaction_List dalam waktu kurang dari 1 detik.
5. IF Transaction_List kosong (tidak ada Transaction yang tersimpan), THEN THE Transaction_List SHALL menampilkan pesan yang mengindikasikan bahwa belum ada transaksi yang dicatat.

---

### Requirement 3: Menampilkan Total Saldo

**User Story:** Sebagai pengguna, saya ingin melihat total pengeluaran saya di bagian atas halaman, sehingga saya langsung mengetahui berapa banyak yang telah saya keluarkan.

#### Acceptance Criteria

1. THE Balance_Display SHALL menampilkan total penjumlahan seluruh jumlah uang dari semua Transaction yang ada di Transaction_List dalam format angka dengan 2 digit desimal dan pemisah ribuan (contoh: 1.234,56).
2. WHEN sebuah Transaction baru ditambahkan ke Transaction_List, THE Balance_Display SHALL memperbarui nilai total secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penambahan selesai.
3. WHEN sebuah Transaction dihapus dari Transaction_List, THE Balance_Display SHALL memperbarui nilai total secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penghapusan selesai.
4. IF Transaction_List kosong, THEN THE Balance_Display SHALL menampilkan nilai 0,00.
5. THE Balance_Display SHALL terlihat di bagian atas halaman tanpa perlu melakukan scroll pada ukuran layar apapun yang didukung aplikasi.

---

### Requirement 4: Visualisasi Pie Chart

**User Story:** Sebagai pengguna, saya ingin melihat pie chart yang menunjukkan distribusi pengeluaran per kategori, sehingga saya dapat memahami ke mana sebagian besar uang saya pergi.

#### Acceptance Criteria

1. THE Chart SHALL menampilkan distribusi pengeluaran dalam bentuk pie chart berdasarkan tiga kategori: Food, Transport, dan Fun, di mana ukuran setiap segmen merepresentasikan proporsi total pengeluaran kategori tersebut terhadap keseluruhan total pengeluaran.
2. WHEN sebuah Transaction baru ditambahkan ke Transaction_List, THE Chart SHALL memperbarui tampilan pie chart dalam waktu kurang dari 1 detik tanpa memerlukan reload halaman.
3. WHEN sebuah Transaction dihapus dari Transaction_List, THE Chart SHALL memperbarui tampilan pie chart dalam waktu kurang dari 1 detik tanpa memerlukan reload halaman.
4. WHERE kategori memiliki nilai total pengeluaran lebih dari nol, THE Chart SHALL menampilkan segmen untuk kategori tersebut beserta label nama kategori dan persentase proporsinya terhadap total pengeluaran, dibulatkan ke satu angka desimal.
5. IF semua kategori memiliki nilai total pengeluaran sama dengan nol, THEN THE Chart SHALL menampilkan pesan yang menginformasikan bahwa belum ada data pengeluaran untuk ditampilkan.

---

### Requirement 5: Persistensi Data dengan Local Storage

**User Story:** Sebagai pengguna, saya ingin data transaksi saya tetap tersimpan ketika saya menutup atau menyegarkan browser, sehingga saya tidak kehilangan riwayat pengeluaran saya.

#### Acceptance Criteria

1. WHEN sebuah Transaction baru ditambahkan, THE Storage SHALL menyimpan seluruh daftar Transaction terkini ke dalam browser Local Storage dalam format yang dapat dibaca kembali oleh App, dengan batas maksimal 1000 Transaction yang tersimpan.
2. WHEN sebuah Transaction dihapus, THE Storage SHALL memperbarui data di browser Local Storage dengan daftar Transaction terkini dalam format yang dapat dibaca kembali oleh App dalam waktu kurang dari 500 milidetik sejak operasi penghapusan selesai.
3. WHEN App dimuat di browser, THE Storage SHALL membaca data Transaction dari browser Local Storage sebelum App merender konten apapun dan memuat kembali seluruh Transaction ke Transaction_List dalam waktu kurang dari 1000 milidetik.
4. IF browser Local Storage tidak mengandung data Transaction saat App dimuat, THEN THE App SHALL menampilkan Transaction_List dalam keadaan kosong tanpa menampilkan pesan error.
5. IF data di browser Local Storage tidak dapat di-parse atau tidak sesuai format yang valid saat App dimuat, THEN THE App SHALL menghapus data yang rusak tersebut dari Local Storage dan menampilkan Transaction_List dalam keadaan kosong tanpa pesan error.
6. IF operasi penulisan ke browser Local Storage gagal karena kuota penyimpanan penuh atau izin ditolak browser, THEN THE App SHALL menampilkan pesan error yang menginformasikan pengguna bahwa data tidak berhasil disimpan, sementara Transaction terakhir yang ditambahkan tetap terlihat di Transaction_List secara in-memory namun tidak tercermin dalam Local Storage.

---

### Requirement 6: Kompatibilitas Browser dan Responsivitas Mobile

**User Story:** Sebagai pengguna, saya ingin menggunakan aplikasi ini di berbagai browser dan perangkat mobile, sehingga saya dapat mencatat pengeluaran kapan saja dan di mana saja.

#### Acceptance Criteria

1. THE App SHALL berfungsi dengan benar pada browser Chrome, Firefox, Edge, dan Safari versi yang dirilis dalam 2 tahun terakhir, mencakup kemampuan menampilkan data, menyimpan data, dan menjalankan seluruh fitur inti tanpa error pada browser tersebut.
2. THE App SHALL menampilkan layout yang dapat digunakan pada lebar layar mulai dari 320px hingga 1920px, sehingga seluruh elemen antarmuka — termasuk form input, daftar transaksi, dan visualisasi — dapat dilihat dan dioperasikan tanpa scroll horizontal dan tanpa elemen yang terpotong atau tumpang tindih.
3. THE App SHALL dapat dibuka dan digunakan sebagai file HTML standalone tanpa memerlukan server backend, sehingga seluruh fitur inti — termasuk input data, penyimpanan, dan visualisasi — berjalan sepenuhnya melalui mekanisme penyimpanan lokal browser.
4. IF ukuran layar kurang dari 768px, THEN THE App SHALL menampilkan layout kolom tunggal di mana elemen navigasi, form input, dan visualisasi disusun secara vertikal dan dapat dioperasikan menggunakan input sentuh (touch) tanpa memerlukan hover atau klik kanan.
5. IF fitur atau API browser yang diperlukan tidak tersedia pada browser yang digunakan, THEN THE App SHALL menampilkan pesan yang menginformasikan pengguna bahwa browser tersebut tidak didukung dan merekomendasikan browser alternatif yang kompatibel.

---

### Requirement 7: Struktur File dan Kode

**User Story:** Sebagai developer, saya ingin struktur proyek yang bersih dan terorganisir, sehingga kode mudah dibaca dan dipelihara.

#### Acceptance Criteria

1. THE App SHALL menggunakan tepat satu file CSS yang berada di dalam folder `css/` dan file tersebut direferensikan melalui tepat satu elemen `<link rel="stylesheet">` di dalam elemen `<head>` pada file HTML utama; tidak ada file CSS tambahan yang diperbolehkan di luar folder `css/` maupun di dalam folder `css/` selain satu file tersebut.
2. THE App SHALL menggunakan tepat satu file JavaScript kustom yang berada di dalam folder `js/` dan file tersebut direferensikan melalui tepat satu elemen `<script src>` yang mengarah ke file lokal tersebut di dalam file HTML utama; tidak ada file JavaScript kustom tambahan yang diperbolehkan di luar folder `js/` maupun di dalam folder `js/` selain satu file tersebut.
3. THE App SHALL dibangun hanya menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework front-end seperti React atau Vue, CSS preprocessor seperti Sass atau Less, maupun build tool seperti Webpack atau Vite; kepatuhan diverifikasi dengan tidak adanya referensi ke package manager manifest (seperti `package.json`) atau modul `node_modules` yang digunakan pada saat runtime.
4. THE App HANYA diperbolehkan memuat library eksternal (seperti Chart.js) melalui elemen `<script>` dengan atribut `src` yang mengarah ke URL CDN eksternal (dimulai dengan `https://`); setiap library eksternal yang digunakan harus dimuat dengan cara ini dan jumlah elemen `<script>` yang mengarah ke CDN tidak boleh melebihi 5 buah.
