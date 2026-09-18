# Implementation Plan: Profile, Income & Savings

## Overview

Rencana ini memperluas aplikasi Budget Tracker yang sudah ada dengan menambahkan navigasi tab, fitur pemasukan, tabungan, profil pengguna, dan Saldo Bersih. Semua kode baru ditulis ke dalam file yang sudah ada (`js/app.js`, `css/style.css`, `index.html`) tanpa membuat file tambahan. Arsitektur Module Pattern (IIFE) yang sudah ada dipertahankan dan diperluas.

---

## Tasks

- [ ] 1. Tambahkan struktur HTML tab navigasi dan section baru ke `index.html`
  - [ ] 1.1 Ganti `Balance_Display` lama dengan `Net_Balance_Display` di header dan tambahkan label "Saldo Bersih"
    - Ubah elemen `#balance-display` dan label terkait di `<header>` agar menampilkan "Saldo Bersih"
    - Tambahkan atribut `id="net-balance-display"` dan kelas awal `.net-balance--zero`
    - _Requirements: 13.1, 13.3_

  - [ ] 1.2 Tambahkan elemen `<nav class="tab-nav">` dengan empat tombol tab
    - Buat empat tombol: Pengeluaran, Pemasukan, Tabungan, Profil dengan atribut `data-tab`
    - Tambahkan atribut `aria-selected` dan `role="tab"` untuk aksesibilitas
    - _Requirements: 8.1, 15.5_

  - [ ] 1.3 Bungkus konten pengeluaran yang sudah ada ke dalam `<section id="tab-pengeluaran">`
    - Pindahkan seluruh konten `<main class="main-content">` yang ada (left-column + right-column) ke dalam section tab pertama
    - Pastikan `id` dan struktur elemen yang sudah ada tidak berubah
    - _Requirements: 15.3_

  - [ ] 1.4 Tambahkan `<section id="tab-pemasukan" hidden>` dengan Income_Form dan Income_List
    - Buat `Income_Form` dengan field: nama/sumber (`#income-name`), jumlah (`#income-amount`), kategori (`#income-category`, pilihan: Gaji/Freelance/Bisnis/Lainnya)
    - Tambahkan elemen error per field: `#error-income-name`, `#error-income-amount`, `#error-income-category`
    - Tambahkan area `#income-list` untuk daftar entri dan `#income-total-display` untuk total pemasukan
    - _Requirements: 9.1, 9.7, 9.8, 10.1_

  - [ ] 1.5 Tambahkan `<section id="tab-tabungan" hidden>` dengan Savings_Form dan Savings_List
    - Buat `Savings_Form` dengan field: nama tujuan (`#savings-goal-name`), jumlah (`#savings-amount`), tanggal (`#savings-date`, default hari ini)
    - Tambahkan elemen error per field: `#error-savings-goal-name`, `#error-savings-amount`, `#error-savings-date`
    - Tambahkan area `#savings-list` untuk daftar entri dan `#savings-total-display` untuk total tabungan
    - _Requirements: 11.1, 11.8, 12.1_

  - [ ] 1.6 Tambahkan `<section id="tab-profil" hidden>` dengan Profile_Form
    - Buat `Profile_Form` dengan field: nama lengkap (`#profile-full-name`), tanggal lahir (`#profile-birth-date`), nomor telepon (`#profile-phone`)
    - Tambahkan elemen error per field: `#error-profile-full-name`, `#error-profile-birth-date`, `#error-profile-phone`
    - Tambahkan elemen pesan sukses `#profile-success-message` (tersembunyi secara default)
    - _Requirements: 8.2, 8.8, 8.9, 8.10, 8.11_

- [ ] 2. Tambahkan CSS baru untuk komponen tab dan fitur baru ke `css/style.css`
  - [ ] 2.1 Tulis gaya untuk tab navigation bar (`.tab-nav`, `.tab-btn`, `.tab-btn--active`)
    - Pertahankan tema dark navy/gold yang sudah ada
    - Pastikan tab bar terlihat penuh pada lebar 320px–1920px tanpa scroll horizontal
    - _Requirements: 8.1, 15.4, 15.5_

  - [ ] 2.2 Tulis gaya untuk `Net_Balance_Display` dengan tiga kelas warna
    - `.net-balance--positive`: hijau (#22c55e), rasio kontras ≥ 4.5:1 terhadap #1e293b
    - `.net-balance--negative`: merah (#f87171), rasio kontras ≥ 4.5:1 terhadap #1e293b
    - `.net-balance--zero`: amber/muted (#f59e0b atau #94a3b8)
    - _Requirements: 13.4, 13.5, 13.6, 13.7_

  - [ ] 2.3 Tulis gaya untuk Income_List dan Savings_List (item row, tombol hapus, empty state, scrollable container)
    - Gunakan kembali pola `.transaction-item` yang sudah ada dengan penyesuaian warna aksen kategori income
    - Pastikan list dapat di-scroll vertikal saat konten melebihi area tampilan
    - _Requirements: 9.7, 9.8, 9.9, 11.8, 11.9_

  - [ ] 2.4 Tulis gaya untuk Profile_Form, pesan sukses, dan layout responsif mobile (< 768px kolom tunggal)
    - Gunakan kembali pola `.form-group`, `.form-input`, `.field-error` yang sudah ada
    - Tambahkan gaya `.profile-success` untuk pesan konfirmasi simpan
    - _Requirements: 8.8, 15.4, 15.6_

- [ ] 3. Tambahkan fungsi pure baru dan konstanta ke `js/app.js`
  - [ ] 3.1 Deklarasikan `VALID_INCOME_CATEGORIES` dan fungsi pure untuk Income
    - Tambahkan konstanta `VALID_INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Bisnis', 'Lainnya']`
    - Implementasikan `addIncome(list, entry)` — mengembalikan array baru dengan entri baru di depan
    - Implementasikan `removeIncome(list, id)` — mengembalikan array baru tanpa entri dengan id tersebut
    - Implementasikan `calculateIncomeTotal(list)` — menjumlahkan field `amount` semua entri, 0 untuk list kosong
    - _Requirements: 9.5, 9.10, 10.1, 10.4_

  - [ ]* 3.2 Tulis property test untuk fungsi pure Income (Property 6, 7, 8)
    - **Property 6: Penambahan Income/Savings Menambah Panjang Daftar**
    - **Validates: Requirements 9.5**
    - **Property 7: Penghapusan Income/Savings Mengurangi Panjang Daftar**
    - **Validates: Requirements 9.10**
    - **Property 8: Total Pemasukan dan Total Tabungan Sama dengan Jumlah Semua Amount**
    - **Validates: Requirements 10.1, 10.4**

  - [ ] 3.3 Implementasikan fungsi pure untuk Savings
    - Implementasikan `addSavings(list, entry)` — mengembalikan array baru dengan entri baru di depan
    - Implementasikan `removeSavings(list, id)` — mengembalikan array baru tanpa entri dengan id tersebut
    - Implementasikan `calculateSavingsTotal(list)` — menjumlahkan field `amount` semua entri, 0 untuk list kosong
    - _Requirements: 11.6, 11.11, 12.1, 12.4_

  - [ ] 3.4 Implementasikan `calculateNetBalance` dan `getNetBalanceClass`
    - `calculateNetBalance(incomeList, expenseList, savingsList)` = `calculateIncomeTotal(incomeList) - calculateTotal(expenseList) - calculateSavingsTotal(savingsList)`
    - `getNetBalanceClass(netBalance)` — fungsi pure yang mengembalikan string kelas CSS: `'net-balance--positive'`, `'net-balance--negative'`, atau `'net-balance--zero'`
    - _Requirements: 13.1, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 3.5 Tulis property test untuk `calculateNetBalance` dan `getNetBalanceClass` (Property 9, 10)
    - **Property 9: Saldo Bersih = Total Pemasukan − Total Pengeluaran − Total Tabungan**
    - **Validates: Requirements 13.1**
    - **Property 10: Kode Warna Saldo Bersih Konsisten dengan Tanda Nilai**
    - **Validates: Requirements 13.4, 13.5, 13.6, 13.7**

- [ ] 4. Implementasikan `ProfileModule` di `js/app.js`
  - [ ] 4.1 Tulis IIFE `ProfileModule` dengan fungsi validasi
    - Implementasikan `validateFullName(name)` — menolak string kosong atau whitespace-only, max 100 karakter
    - Implementasikan `validatePhone(phone)` — opsional; jika diisi, hanya `[0-9+\s-]`, panjang 7–20 karakter
    - Implementasikan `validateBirthDate(dateStr)` — opsional; jika diisi, tidak boleh melebihi tanggal hari ini
    - Implementasikan `validate(formData)` — memanggil ketiga validator, mengembalikan `ValidationResult`
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 16.1_

  - [ ]* 4.2 Tulis property test untuk `ProfileModule` (Property 1, 2, 3)
    - **Property 1: Nama Kosong atau Whitespace-Only Ditolak**
    - **Validates: Requirements 8.4, 16.1**
    - **Property 2: Nomor Telepon dengan Karakter Invalid atau Terlalu Pendek Ditolak**
    - **Validates: Requirements 8.5, 16.1**
    - **Property 3: Tanggal Lahir di Masa Depan Ditolak**
    - **Validates: Requirements 8.6**

- [ ] 5. Implementasikan `IncomeModule` di `js/app.js`
  - [ ] 5.1 Tulis IIFE `IncomeModule` dengan fungsi validasi
    - Implementasikan `validateIncomeName(name)` — menolak kosong/whitespace-only, max 100 karakter
    - Implementasikan `validateIncomeAmount(rawValue)` — menolak nilai di luar rentang [0.01, 999999999.99]
    - Implementasikan `validateIncomeCategory(category)` — harus salah satu dari `VALID_INCOME_CATEGORIES`
    - Implementasikan `validate(formData)` — memanggil ketiga validator, mengembalikan `ValidationResult`
    - Ekspor `VALID_INCOME_CATEGORIES` sebagai properti modul
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 16.2_

  - [ ]* 5.2 Tulis property test untuk `IncomeModule` (Property 1, 5, 12)
    - **Property 1: Nama Kosong atau Whitespace-Only Ditolak** (bagian income)
    - **Validates: Requirements 16.2**
    - **Property 5: Jumlah Pemasukan atau Tabungan di Luar Rentang Ditolak** (bagian income)
    - **Validates: Requirements 9.4**
    - **Property 12: Input Tidak Valid Tidak Mengubah State**
    - **Validates: Requirements 16.4, 9.2, 9.3**

- [ ] 6. Implementasikan `SavingsModule` di `js/app.js`
  - [ ] 6.1 Tulis IIFE `SavingsModule` dengan fungsi validasi
    - Implementasikan `validateGoalName(name)` — menolak kosong/whitespace-only, max 100 karakter
    - Implementasikan `validateSavingsAmount(rawValue)` — menolak nilai di luar rentang [0.01, 999999999.99]
    - Implementasikan `validateSavingsDate(dateStr)` — wajib diisi, format YYYY-MM-DD
    - Implementasikan `validate(formData)` — memanggil ketiga validator, mengembalikan `ValidationResult`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.3_

  - [ ]* 6.2 Tulis property test untuk `SavingsModule` (Property 1, 5)
    - **Property 1: Nama Kosong atau Whitespace-Only Ditolak** (bagian savings)
    - **Validates: Requirements 16.3**
    - **Property 5: Jumlah Pemasukan atau Tabungan di Luar Rentang Ditolak** (bagian savings)
    - **Validates: Requirements 11.4**

- [ ] 7. Perluas `StorageModule` dengan key baru di `js/app.js`
  - [ ] 7.1 Tambahkan fungsi `loadIncome`, `saveIncome` ke `StorageModule`
    - Key localStorage: `'income_entries'`, batas maksimal 1000 entri
    - `loadIncome()` — mengembalikan `[]` jika kosong, data corrupt dihapus dan kembalikan `[]`
    - `saveIncome(list)` — melempar error jika kuota penuh atau melebihi batas 1000
    - _Requirements: 14.1, 14.2, 14.5, 14.6, 14.7, 14.8_

  - [ ] 7.2 Tambahkan fungsi `loadSavings`, `saveSavings` ke `StorageModule`
    - Key localStorage: `'savings_entries'`, batas maksimal 1000 entri
    - `loadSavings()` — mengembalikan `[]` jika kosong, data corrupt dihapus dan kembalikan `[]`
    - `saveSavings(list)` — melempar error jika kuota penuh atau melebihi batas 1000
    - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [ ] 7.3 Tambahkan fungsi `loadProfile`, `saveProfile` ke `StorageModule`
    - Key localStorage: `'user_profile'`, menyimpan satu objek (bukan array)
    - `loadProfile()` — mengembalikan `null` jika kosong atau data corrupt
    - `saveProfile(profile)` — melempar error jika kuota penuh
    - _Requirements: 8.7, 8.9, 8.12_

  - [ ]* 7.4 Tulis property test untuk `StorageModule` functions baru (Property 4, 11)
    - **Property 4: Round-Trip Penyimpanan dan Pemuatan Profile**
    - **Validates: Requirements 8.7, 8.9, 8.10**
    - **Property 11: Round-Trip Serialisasi localStorage untuk Income dan Savings**
    - **Validates: Requirements 14.1, 14.3**

- [ ] 8. Checkpoint — Pastikan semua tests lulus, tanyakan ke pengguna jika ada pertanyaan.

- [ ] 9. Perluas `UIModule` dengan fungsi render baru di `js/app.js`
  - [ ] 9.1 Implementasikan `UIModule.switchTab(tabName)` dan resolusi elemen DOM baru
    - Tambahkan resolusi elemen DOM baru ke `_resolveElements()`: semua elemen dari section Pemasukan, Tabungan, dan Profil
    - Implementasikan `switchTab(tabName)` — sembunyikan semua section tab, tampilkan section aktif, perbarui `aria-selected` pada tombol tab
    - _Requirements: 8.1, 15.5_

  - [ ] 9.2 Implementasikan `UIModule.renderIncomeList`, `UIModule.renderIncomeTotals`
    - `renderIncomeList(incomeList)` — render setiap `IncomeEntry` dengan nama, jumlah (format Rp), kategori, dan tombol hapus; tampilkan empty state jika kosong
    - `renderIncomeTotals(total)` — perbarui teks elemen `#income-total-display` dengan format `_formatCurrency`
    - _Requirements: 9.7, 9.11, 10.1, 10.4_

  - [ ] 9.3 Implementasikan `UIModule.renderSavingsList`, `UIModule.renderSavingsTotals`
    - `renderSavingsList(savingsList)` — render setiap `SavingsEntry` dengan nama tujuan (elipsis overflow), jumlah (format Rp), tanggal (format DD/MM/YYYY), dan tombol hapus; tampilkan empty state jika kosong
    - `renderSavingsTotals(total)` — perbarui teks elemen `#savings-total-display` dengan format `_formatCurrency`
    - _Requirements: 11.8, 11.12, 12.1, 12.4_

  - [ ] 9.4 Implementasikan `UIModule.renderProfileForm`, `UIModule.showProfileSuccess`
    - `renderProfileForm(profile)` — isi field form dengan data profil; jika `null`, tampilkan form kosong
    - `showProfileSuccess(message)` — tampilkan elemen `#profile-success-message`, sembunyikan otomatis setelah 2 detik (2000ms)
    - _Requirements: 8.8, 8.9, 8.10, 8.11_

  - [ ] 9.5 Implementasikan `UIModule.renderNetBalance`
    - `renderNetBalance(netBalance)` — format nilai dengan `_formatCurrency`, perbarui `textContent`, hapus semua kelas warna, tambahkan kelas dari `getNetBalanceClass(netBalance)`
    - Pastikan prefix tanda minus (−) ditampilkan untuk nilai negatif
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 13.6, 13.7_

  - [ ] 9.6 Implementasikan `UIModule.showIncomeErrors`, `UIModule.showSavingsErrors`, `UIModule.showProfileErrors` beserta versi `clear`-nya
    - Ikuti pola `showErrors` / `clearErrors` yang sudah ada untuk tiap set field baru
    - Tambahkan `resetIncomeForm()` dan `resetSavingsForm()`
    - _Requirements: 9.3, 11.3, 16.4, 16.5, 16.6_

- [ ] 10. Perluas `AppController` untuk mewire semua handler baru di `js/app.js`
  - [ ] 10.1 Tambahkan state in-memory baru dan muat data dari `StorageModule` saat `init()`
    - Deklarasikan `_incomeList = []` dan `_savingsList = []` di dalam `AppController`
    - Di dalam `init()`: muat data dengan `StorageModule.loadIncome()`, `StorageModule.loadSavings()`, dan `StorageModule.loadProfile()`
    - Render semua section setelah load: `renderIncomeList`, `renderSavingsList`, `renderIncomeTotals`, `renderSavingsTotals`, `renderProfileForm`, `renderNetBalance`
    - Wire event listener tab (`click` pada `.tab-nav`) ke `UIModule.switchTab`
    - _Requirements: 14.5, 15.3_

  - [ ] 10.2 Implementasikan `handleIncomeSubmit` dan `handleIncomeDelete`
    - `handleIncomeSubmit(event)`: validasi dengan `IncomeModule.validate`, tambah entri baru dengan `addIncome`, simpan via `StorageModule.saveIncome`, render ulang list + total + net balance, reset form
    - `handleIncomeDelete(id)`: hapus dengan `removeIncome`, simpan, render ulang list + total + net balance
    - Wire kedua handler ke form `#income-form` dan container `#income-list`
    - _Requirements: 9.2, 9.5, 9.6, 9.10, 10.2, 10.3, 13.2, 16.5_

  - [ ] 10.3 Implementasikan `handleSavingsSubmit` dan `handleSavingsDelete`
    - `handleSavingsSubmit(event)`: validasi dengan `SavingsModule.validate`, tambah entri baru dengan `addSavings`, simpan via `StorageModule.saveSavings`, render ulang list + total + net balance, reset form (tanggal direset ke hari ini)
    - `handleSavingsDelete(id)`: hapus dengan `removeSavings`, simpan, render ulang list + total + net balance
    - Wire kedua handler ke form `#savings-form` dan container `#savings-list`
    - _Requirements: 11.2, 11.6, 11.7, 11.11, 12.2, 12.3, 13.2, 16.5_

  - [ ] 10.4 Implementasikan `handleProfileSave` dan tambahkan helper `_updateNetBalance`
    - `handleProfileSave(event)`: validasi dengan `ProfileModule.validate`, simpan via `StorageModule.saveProfile`, tampilkan pesan sukses via `UIModule.showProfileSuccess`
    - `_updateNetBalance()`: memanggil `renderNetBalance(calculateNetBalance(_incomeList, _transactions, _savingsList))`; dipanggil setelah setiap operasi add/delete di semua modul
    - Pastikan `handleSubmit` dan `handleDelete` yang sudah ada juga memanggil `_updateNetBalance()`
    - Wire `handleProfileSave` ke form `#profile-form`
    - _Requirements: 8.3, 8.7, 8.8, 13.2, 13.8, 15.3_

- [ ] 11. Perbarui blok `module.exports` dan lakukan verifikasi akhir
  - [ ] 11.1 Tambahkan semua fungsi dan modul baru ke blok `module.exports` yang sudah ada
    - Tambahkan ke ekspor: `addIncome`, `removeIncome`, `calculateIncomeTotal`, `addSavings`, `removeSavings`, `calculateSavingsTotal`, `calculateNetBalance`, `getNetBalanceClass`, `ProfileModule`, `IncomeModule`, `SavingsModule`
    - Pastikan pengecekan `typeof module !== 'undefined'` tetap ada
    - _Requirements: 15.1_

- [ ] 12. Checkpoint Akhir — Pastikan semua tests lulus dan tidak ada regresi pada fitur pengeluaran yang sudah ada.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental
- Property tests memvalidasi properti kebenaran universal (menggunakan `fast-check`)
- Unit tests memvalidasi skenario konkret dan edge case
- **Semua kode baru wajib masuk ke file yang sudah ada** — tidak ada file `.js` atau `.css` baru

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2", "3.1", "3.3", "3.4"] },
    { "id": 2, "tasks": ["1.4", "1.5", "1.6", "2.3", "2.4", "3.2", "3.5", "4.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "6.2", "7.1", "7.2", "7.3"] },
    { "id": 4, "tasks": ["7.4", "9.1"] },
    { "id": 5, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 6, "tasks": ["10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "10.4"] },
    { "id": 8, "tasks": ["11.1"] }
  ]
}
```
