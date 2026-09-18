# Requirements Document

## Introduction

Fitur ini merupakan perluasan dari aplikasi Expense & Budget Visualizer yang sudah ada. Tiga kapabilitas baru ditambahkan ke aplikasi web satu halaman yang sama:

1. **Profil Pengguna** — pengguna dapat menyimpan dan mengedit data pribadi (nama lengkap, tanggal lahir, nomor telepon) yang dipertahankan di localStorage.
2. **Pemasukan (Income)** — pengguna dapat mencatat sumber pemasukan dengan kategori, melihat riwayatnya, dan melihat total pemasukan.
3. **Tabungan (Savings)** — pengguna dapat mencatat alokasi tabungan per tujuan, melihat riwayatnya, dan melihat total tabungan.
4. **Saldo Bersih (Net Balance)** — Balance_Display yang sudah ada diperluas menjadi Saldo Bersih = Total Pemasukan − Total Pengeluaran − Total Tabungan.

Aplikasi tetap berjalan sepenuhnya di browser tanpa server backend, menggunakan satu file CSS (`css/style.css`) dan satu file JavaScript (`js/app.js`), serta memanfaatkan localStorage untuk seluruh persistensi data.

---

## Glossary

- **App**: Aplikasi web Budget Tracker secara keseluruhan.
- **Transaction**: Entri pengeluaran yang sudah ada; terdiri dari nama item, jumlah, dan kategori (Food, Transport, Fun).
- **Income_Entry**: Satu entri pemasukan yang terdiri dari nama/sumber, jumlah, dan kategori pemasukan.
- **Income_Category**: Klasifikasi Income_Entry, terbatas pada empat nilai: Gaji, Freelance, Bisnis, Lainnya.
- **Income_List**: Komponen UI yang menampilkan seluruh daftar Income_Entry.
- **Income_Form**: Komponen UI formulir untuk memasukkan data Income_Entry baru.
- **Savings_Entry**: Satu entri tabungan yang terdiri dari nama tujuan, jumlah yang disisihkan, dan tanggal.
- **Savings_List**: Komponen UI yang menampilkan seluruh daftar Savings_Entry.
- **Savings_Form**: Komponen UI formulir untuk memasukkan data Savings_Entry baru.
- **Net_Balance_Display**: Komponen UI yang menampilkan Saldo Bersih = Total Pemasukan − Total Pengeluaran − Total Tabungan; menggantikan atau memperluas Balance_Display yang sudah ada.
- **Profile**: Data pribadi pengguna yang terdiri dari nama lengkap, tanggal lahir, dan nomor telepon.
- **Profile_Form**: Komponen UI formulir untuk melihat dan mengedit data Profile.
- **Profile_Section**: Area UI (modal atau section) tempat Profile_Form ditampilkan.
- **Validator**: Logika validasi yang memastikan semua field yang wajib diisi sudah terisi dengan benar sebelum data disimpan.
- **Storage**: Antarmuka browser localStorage API yang menyimpan dan memuat seluruh data aplikasi.
- **Income_Validator**: Logika validasi khusus untuk field pada Income_Form.
- **Savings_Validator**: Logika validasi khusus untuk field pada Savings_Form.
- **Profile_Validator**: Logika validasi khusus untuk field pada Profile_Form.

---

## Requirements

### Requirement 8: Profil Pengguna

**User Story:** Sebagai pengguna, saya ingin menyimpan data pribadi saya (nama lengkap, tanggal lahir, nomor telepon) di aplikasi, sehingga aplikasi terasa lebih personal dan data saya tersimpan untuk referensi.

#### Acceptance Criteria

1. WHEN App dimuat di browser, THE App SHALL menampilkan tombol atau tautan untuk mengakses Profile_Section yang terlihat tanpa perlu melakukan scroll pada ukuran layar apapun yang didukung.
2. THE Profile_Form SHALL menyediakan field teks untuk nama lengkap dengan panjang maksimal 100 karakter, field tanggal untuk tanggal lahir yang tidak boleh melebihi tanggal hari ini, dan field teks untuk nomor telepon dengan panjang minimal 7 karakter dan panjang maksimal 20 karakter yang hanya menerima karakter digit (0–9), tanda tambah (+), spasi, dan tanda hubung (-).
3. WHEN pengguna menekan tombol simpan pada Profile_Form, THE Profile_Validator SHALL memeriksa bahwa field nama lengkap tidak kosong dan tidak hanya terdiri dari spasi, field tanggal lahir jika diisi tidak melebihi tanggal hari ini, dan field nomor telepon jika diisi hanya mengandung karakter yang valid sebelum menyimpan data Profile.
4. IF field nama lengkap pada Profile_Form kosong atau hanya terdiri dari spasi saat tombol simpan ditekan, THEN THE Profile_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field nama lengkap tidak valid, mempertahankan nilai field lainnya yang telah diisi pengguna, dan mencegah penyimpanan Profile.
5. IF field nomor telepon pada Profile_Form mengandung karakter selain digit, tanda tambah, spasi, atau tanda hubung, atau panjangnya kurang dari 7 karakter saat tombol simpan ditekan, THEN THE Profile_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi format nomor telepon tidak valid, mempertahankan nilai field lainnya yang telah diisi pengguna, dan mencegah penyimpanan Profile.
6. IF field tanggal lahir pada Profile_Form diisi dengan tanggal yang melebihi tanggal hari ini saat tombol simpan ditekan, THEN THE Profile_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi tanggal lahir tidak valid, mempertahankan nilai field lainnya yang telah diisi pengguna, dan mencegah penyimpanan Profile.
7. WHEN Profile_Validator memvalidasi nama lengkap tidak kosong, nomor telepon kosong atau berformat valid dengan panjang 7–20 karakter, dan tanggal lahir kosong atau tidak melebihi tanggal hari ini, THE Storage SHALL menyimpan data Profile ke localStorage dalam waktu kurang dari 500 milidetik.
8. WHEN Profile berhasil disimpan ke localStorage, THE App SHALL menampilkan pesan konfirmasi yang memberitahu pengguna bahwa data profil berhasil disimpan dan pesan tersebut tetap terlihat selama minimal 2 detik.
9. WHEN App dimuat di browser dan localStorage mengandung data Profile yang valid, THE Profile_Section SHALL menampilkan data Profile terkini sehingga pengguna dapat langsung melihat data yang tersimpan.
10. WHEN pengguna membuka Profile_Section, THE Profile_Form SHALL menampilkan data Profile yang saat ini tersimpan pada setiap field yang sesuai.
11. IF localStorage tidak mengandung data Profile saat App dimuat, THEN THE Profile_Form SHALL ditampilkan dalam keadaan kosong tanpa pesan error.
12. IF data Profile di localStorage tidak dapat di-parse atau tidak sesuai format yang valid saat App dimuat, THEN THE App SHALL mengabaikan data Profile yang rusak tersebut dan menampilkan Profile_Form dalam keadaan kosong tanpa pesan error.

---

### Requirement 9: Menambah dan Menampilkan Pemasukan

**User Story:** Sebagai pengguna, saya ingin mencatat sumber pemasukan saya dengan nama, jumlah, dan kategori, sehingga saya dapat melacak dari mana uang saya berasal.

#### Acceptance Criteria

1. THE Income_Form SHALL menyediakan field teks untuk nama/sumber pemasukan dengan panjang maksimal 100 karakter, field angka untuk jumlah pemasukan dengan nilai antara 0.01 hingga 999.999.999,99, dan dropdown pilihan kategori dengan nilai Gaji, Freelance, Bisnis, dan Lainnya.
2. WHEN pengguna menekan tombol submit pada Income_Form, THE Income_Validator SHALL memeriksa bahwa field nama/sumber, jumlah, dan kategori tidak kosong.
3. IF salah satu field pada Income_Form kosong saat tombol submit ditekan, THEN THE Income_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field mana yang belum diisi dan mencegah penambahan Income_Entry.
4. IF field jumlah pada Income_Form berisi nilai di luar rentang 0.01 hingga 999.999.999,99 saat tombol submit ditekan, THEN THE Income_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field jumlah tidak valid dan mencegah penambahan Income_Entry.
5. IF Income_Validator memvalidasi semua field terisi dengan benar, THEN THE App SHALL menambahkan Income_Entry baru ke Income_List dalam waktu kurang dari 1 detik.
6. WHEN Income_Entry baru berhasil ditambahkan, THE Income_Form SHALL mengosongkan semua field kembali ke kondisi awal.
7. THE Income_List SHALL menampilkan setiap Income_Entry dengan nama/sumber (maksimal 100 karakter), jumlah dalam format mata uang lokal dengan simbol "Rp", pemisah ribuan berupa titik, dan 2 angka desimal (contoh: Rp 1.000,00), serta kategori secara bersamaan dalam satu baris entri.
8. WHILE tinggi total Income_List melebihi tinggi area tampilan yang tersedia, THE Income_List SHALL dapat di-scroll secara vertikal untuk menampilkan seluruh entri.
9. THE Income_List SHALL menyediakan tombol hapus pada setiap Income_Entry yang secara visual terkait dengan entri tersebut sehingga pengguna dapat mengidentifikasi entri mana yang akan dihapus.
10. WHEN pengguna menekan tombol hapus pada sebuah entri Income_Entry, THE App SHALL menghapus Income_Entry tersebut dari Income_List dan memperbarui tampilan Income_List dalam waktu kurang dari 1 detik.
11. IF Income_List kosong, THEN THE Income_List SHALL menampilkan pesan yang mengindikasikan bahwa belum ada pemasukan yang dicatat.

---

### Requirement 10: Total Pemasukan

**User Story:** Sebagai pengguna, saya ingin melihat total seluruh pemasukan saya, sehingga saya mengetahui berapa total uang yang telah masuk.

#### Acceptance Criteria

1. THE App SHALL menampilkan total penjumlahan seluruh jumlah dari semua Income_Entry yang ada dalam format angka dengan 2 digit desimal dan pemisah ribuan menggunakan simbol "Rp" (contoh: Rp 1.234,56).
2. WHEN sebuah Income_Entry baru ditambahkan, THE App SHALL memperbarui tampilan total pemasukan secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penambahan selesai.
3. WHEN sebuah Income_Entry dihapus, THE App SHALL memperbarui tampilan total pemasukan secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penghapusan selesai.
4. IF Income_List kosong, THEN THE App SHALL menampilkan nilai total pemasukan sebesar Rp 0,00.

---

### Requirement 11: Menambah dan Menampilkan Tabungan

**User Story:** Sebagai pengguna, saya ingin mencatat alokasi tabungan saya dengan nama tujuan, jumlah, dan tanggal, sehingga saya dapat memantau berapa yang telah saya sisihkan.

#### Acceptance Criteria

1. THE Savings_Form SHALL menyediakan field teks untuk nama tujuan tabungan dengan panjang maksimal 100 karakter, field angka untuk jumlah yang disisihkan dengan nilai antara 0.01 hingga 999.999.999,99, dan field tanggal untuk tanggal tabungan disisihkan (wajib diisi) yang secara default menampilkan tanggal hari ini.
2. WHEN pengguna menekan tombol submit pada Savings_Form, THE Savings_Validator SHALL memeriksa bahwa field nama tujuan, jumlah, dan tanggal tidak kosong.
3. IF salah satu field wajib (nama tujuan, jumlah, atau tanggal) pada Savings_Form kosong saat tombol submit ditekan, THEN THE Savings_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field mana yang belum diisi, mempertahankan nilai field lainnya yang telah diisi, dan mencegah penambahan Savings_Entry.
4. IF field jumlah pada Savings_Form berisi nilai di luar rentang 0.01 hingga 999.999.999,99 saat tombol submit ditekan, THEN THE Savings_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field jumlah tidak valid, mempertahankan nilai field nama tujuan dan tanggal yang telah diisi, dan mencegah penambahan Savings_Entry.
5. IF field nama tujuan pada Savings_Form berisi lebih dari 100 karakter saat tombol submit ditekan, THEN THE Savings_Validator SHALL menampilkan pesan kesalahan yang mengidentifikasi field nama tujuan melebihi batas karakter, mempertahankan nilai field jumlah dan tanggal yang telah diisi, dan mencegah penambahan Savings_Entry.
6. IF Savings_Validator memvalidasi semua field wajib terisi dengan benar, THEN THE App SHALL menambahkan Savings_Entry baru ke Savings_List dalam waktu kurang dari 1 detik.
7. WHEN Savings_Entry baru berhasil ditambahkan, THE Savings_Form SHALL mengosongkan field nama tujuan dan jumlah kembali ke kondisi kosong, dan field tanggal direset ke tanggal hari ini.
8. THE Savings_List SHALL menampilkan setiap Savings_Entry dengan nama tujuan (ditampilkan maksimal dalam satu baris, terpotong dengan elipsis jika panjang teks melebihi lebar kolom nama tujuan yang tersedia), jumlah dalam format mata uang lokal (contoh: Rp 1.000,00), dan tanggal dalam format DD/MM/YYYY secara bersamaan dalam satu baris entri.
9. WHILE tinggi total Savings_List melebihi tinggi area tampilan yang tersedia, THE Savings_List SHALL dapat di-scroll secara vertikal untuk menampilkan seluruh entri.
10. THE Savings_List SHALL menyediakan tombol hapus pada setiap Savings_Entry yang secara visual terkait dengan entri tersebut.
11. WHEN pengguna menekan tombol hapus pada sebuah entri Savings_Entry, THE App SHALL menghapus Savings_Entry tersebut dari Savings_List dan memperbarui tampilan Savings_List dalam waktu kurang dari 1 detik.
12. IF Savings_List kosong, THEN THE Savings_List SHALL menampilkan pesan yang mengindikasikan bahwa belum ada tabungan yang dicatat.

---

### Requirement 12: Total Tabungan

**User Story:** Sebagai pengguna, saya ingin melihat total seluruh tabungan yang telah saya sisihkan, sehingga saya mengetahui berapa total dana yang telah dialokasikan untuk tabungan.

#### Acceptance Criteria

1. THE App SHALL menampilkan total penjumlahan seluruh jumlah dari semua Savings_Entry yang ada dalam format angka dengan 2 digit desimal dan pemisah ribuan menggunakan simbol "Rp" (contoh: Rp 1.234,56).
2. WHEN sebuah Savings_Entry baru ditambahkan, THE App SHALL memperbarui tampilan total tabungan secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penambahan selesai.
3. WHEN sebuah Savings_Entry dihapus, THE App SHALL memperbarui tampilan total tabungan secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah penghapusan selesai.
4. IF Savings_List kosong, THEN THE App SHALL menampilkan nilai total tabungan sebesar Rp 0,00.

---

### Requirement 13: Saldo Bersih (Net Balance)

**User Story:** Sebagai pengguna, saya ingin melihat saldo bersih saya yang mencerminkan pemasukan dikurangi pengeluaran dan tabungan, sehingga saya mengetahui kondisi keuangan saya secara keseluruhan secara sekilas.

#### Acceptance Criteria

1. THE Net_Balance_Display SHALL menampilkan Saldo Bersih yang dihitung dengan rumus: Total Pemasukan − Total Pengeluaran − Total Tabungan, dalam format angka dengan 2 digit desimal dan pemisah ribuan (contoh: Rp 1.234,56 atau −Rp 1.234,56), di mana nilai Total Pemasukan, Total Pengeluaran, dan Total Tabungan masing-masing tidak boleh bernilai negatif.
2. WHEN sebuah Income_Entry, Transaction, atau Savings_Entry ditambahkan atau dihapus, THE Net_Balance_Display SHALL memperbarui nilai Saldo Bersih secara otomatis tanpa memuat ulang halaman dalam waktu kurang dari 1 detik setelah operasi tersebut selesai.
3. THE Net_Balance_Display SHALL terlihat sepenuhnya di bagian atas halaman tanpa perlu melakukan scroll vertikal maupun horizontal pada lebar layar antara 320px hingga 2560px.
4. IF nilai Saldo Bersih lebih besar dari nol, THEN THE Net_Balance_Display SHALL menampilkan nilai tersebut dalam warna yang secara visual berbeda dari warna yang digunakan untuk Saldo Bersih negatif dan nol, di mana perbedaan warna tersebut memenuhi rasio kontras minimum 4,5:1 terhadap warna latar belakang.
5. IF nilai Saldo Bersih kurang dari nol, THEN THE Net_Balance_Display SHALL menampilkan nilai tersebut dalam warna yang secara visual berbeda dari warna yang digunakan untuk Saldo Bersih positif dan nol, di mana perbedaan warna tersebut memenuhi rasio kontras minimum 4,5:1 terhadap warna latar belakang.
6. IF Total Pemasukan, Total Pengeluaran, dan Total Tabungan semuanya bernilai nol, THEN THE Net_Balance_Display SHALL menampilkan nilai Rp 0,00 dalam warna yang digunakan untuk Saldo Bersih nol.
7. IF nilai Saldo Bersih sama dengan nol namun setidaknya satu dari Total Pemasukan, Total Pengeluaran, atau Total Tabungan bernilai lebih dari nol, THEN THE Net_Balance_Display SHALL menampilkan nilai Rp 0,00 dalam warna yang secara visual berbeda dari warna yang digunakan untuk Saldo Bersih positif maupun negatif, di mana perbedaan warna tersebut memenuhi rasio kontras minimum 4,5:1 terhadap warna latar belakang.
8. IF operasi penambahan atau penghapusan Income_Entry, Transaction, atau Savings_Entry gagal diselesaikan, THEN THE Net_Balance_Display SHALL mempertahankan nilai Saldo Bersih terakhir yang valid sebelum operasi tersebut dimulai.

---

### Requirement 14: Persistensi Data Income dan Savings

**User Story:** Sebagai pengguna, saya ingin data pemasukan dan tabungan saya tetap tersimpan ketika saya menutup atau menyegarkan browser, sehingga saya tidak kehilangan riwayat keuangan saya.

#### Acceptance Criteria

1. WHEN sebuah Income_Entry baru ditambahkan, THE Storage SHALL menyimpan seluruh daftar Income_Entry terkini ke dalam localStorage dalam format yang dapat dibaca kembali oleh App, dengan batas maksimal 1000 Income_Entry yang tersimpan.
2. WHEN sebuah Income_Entry dihapus, THE Storage SHALL memperbarui data Income_Entry di localStorage dengan daftar terkini dalam waktu kurang dari 500 milidetik sejak operasi penghapusan selesai.
3. WHEN sebuah Savings_Entry baru ditambahkan, THE Storage SHALL menyimpan seluruh daftar Savings_Entry terkini ke dalam localStorage dalam format yang dapat dibaca kembali oleh App, dengan batas maksimal 1000 Savings_Entry yang tersimpan.
4. WHEN sebuah Savings_Entry dihapus, THE Storage SHALL memperbarui data Savings_Entry di localStorage dengan daftar terkini dalam waktu kurang dari 500 milidetik sejak operasi penghapusan selesai.
5. WHEN App dimuat di browser, THE Storage SHALL membaca data Income_Entry dan Savings_Entry dari localStorage sebelum App merender konten apapun dan memuat kembali seluruh entri ke Income_List dan Savings_List masing-masing dalam waktu kurang dari 1000 milidetik.
6. IF localStorage tidak mengandung data Income_Entry atau Savings_Entry saat App dimuat, THEN THE App SHALL menampilkan Income_List dan Savings_List dalam keadaan kosong tanpa menampilkan pesan error.
7. IF data Income_Entry atau Savings_Entry di localStorage tidak dapat di-parse atau tidak sesuai format yang valid saat App dimuat, THEN THE App SHALL menghapus data yang rusak tersebut dan menampilkan list yang bersangkutan dalam keadaan kosong tanpa pesan error.
8. IF operasi penulisan data Income_Entry atau Savings_Entry ke localStorage gagal karena kuota penyimpanan penuh atau izin ditolak browser, THEN THE App SHALL menampilkan pesan error yang menginformasikan pengguna bahwa data tidak berhasil disimpan, sementara entri yang baru ditambahkan tetap terlihat secara in-memory.

---

### Requirement 15: Integrasi dengan Struktur File dan Kode yang Ada

**User Story:** Sebagai developer, saya ingin fitur baru terintegrasi sepenuhnya ke dalam satu file CSS dan satu file JavaScript yang sudah ada, sehingga struktur proyek tetap bersih dan konsisten dengan keputusan arsitektur yang sudah ada.

#### Acceptance Criteria

1. THE App SHALL mengimplementasikan seluruh logika baru fitur Profil Pengguna, Pemasukan, dan Tabungan di dalam satu file JavaScript yang sudah ada (`js/app.js`) tanpa menambahkan file JavaScript kustom tambahan.
2. THE App SHALL mengimplementasikan seluruh gaya visual baru untuk fitur Profil Pengguna, Pemasukan, dan Tabungan di dalam satu file CSS yang sudah ada (`css/style.css`) tanpa menambahkan file CSS tambahan.
3. THE App SHALL mempertahankan fungsionalitas pengeluaran (Transaction_List, Balance_Display lama, Chart) yang sudah ada tanpa regresi setelah penambahan fitur baru.
4. THE App SHALL mempertahankan tema visual dark navy/gold yang sudah ada pada semua komponen UI baru yang ditambahkan untuk fitur Profil Pengguna, Pemasukan, dan Tabungan.
5. THE App SHALL menampilkan layout yang dapat digunakan pada lebar layar mulai dari 320px hingga 1920px untuk semua komponen UI baru, sehingga seluruh elemen antarmuka baru dapat dilihat dan dioperasikan tanpa scroll horizontal dan tanpa elemen yang terpotong atau tumpang tindih.
6. IF ukuran layar kurang dari 768px, THEN THE App SHALL menampilkan semua komponen UI baru dalam layout kolom tunggal yang dapat dioperasikan menggunakan input sentuh tanpa memerlukan hover atau klik kanan.
7. THE App SHALL mempertahankan batasan tidak menggunakan framework front-end, CSS preprocessor, maupun build tool; semua fitur baru diimplementasikan hanya menggunakan HTML, CSS, dan Vanilla JavaScript.

---

### Requirement 16: Validasi Input Profil, Pemasukan, dan Tabungan

**User Story:** Sebagai pengguna, saya ingin mendapat umpan balik yang jelas jika saya memasukkan data yang tidak valid, sehingga saya dapat memperbaiki input sebelum data disimpan.

#### Acceptance Criteria

1. WHEN pengguna mencoba menyimpan Profile_Form dengan field nama lengkap yang hanya terdiri dari spasi, THE Profile_Validator SHALL menolak input tersebut dan menampilkan pesan kesalahan yang mengidentifikasi field nama lengkap tidak valid.
2. WHEN pengguna mencoba menambahkan Income_Entry dengan field nama/sumber yang hanya terdiri dari spasi, THE Income_Validator SHALL menolak input tersebut dan menampilkan pesan kesalahan yang mengidentifikasi field nama/sumber tidak valid.
3. WHEN pengguna mencoba menambahkan Savings_Entry dengan field nama tujuan yang hanya terdiri dari spasi, THE Savings_Validator SHALL menolak input tersebut dan menampilkan pesan kesalahan yang mengidentifikasi field nama tujuan tidak valid.
4. IF Income_Form atau Savings_Form berisi input yang tidak valid saat tombol submit ditekan, THEN THE App SHALL tidak mengubah daftar Income_Entry atau Savings_Entry, total pemasukan, total tabungan, maupun data di localStorage.
5. WHEN Income_Validator atau Savings_Validator menampilkan pesan kesalahan pada sebuah field, THE App SHALL memindahkan fokus keyboard ke field pertama yang memiliki kesalahan agar pengguna dapat segera memperbaikinya.
6. THE App SHALL menampilkan semua pesan kesalahan validasi dalam Bahasa Indonesia yang jelas dan non-teknis.
