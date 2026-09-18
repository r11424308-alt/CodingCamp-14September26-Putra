# Implementation Plan: Expense & Budget Visualizer

## Overview

Aplikasi web satu halaman (*Single Page Application*) dibangun dengan HTML, CSS, dan Vanilla JavaScript murni. Implementasi dilakukan secara bertahap: dimulai dari struktur HTML dan CSS, lalu modul-modul JavaScript (StorageModule, Validator, UIModule, ChartModule), diakhiri dengan AppController sebagai orkestrator yang menyambungkan semua komponen. Setiap tahap divalidasi dengan unit test dan property-based test menggunakan Vitest + fast-check.

## Tasks

- [ ] 1. Buat struktur file proyek dan kerangka HTML
  - Buat file `index.html` dengan elemen semantik: `<header>` untuk Balance_Display, `<section>` untuk Input_Form, `<section>` untuk Transaction_List, `<canvas>` untuk Chart, dan elemen `<script src>` untuk Chart.js CDN dan `js/app.js`
  - Buat folder `css/` dan file `css/style.css` kosong; buat folder `js/` dan file `js/app.js` kosong
  - Tambahkan `<link rel="stylesheet">` ke `css/style.css` di dalam `<head>`
  - Verifikasi file bisa dibuka di browser sebagai file standalone tanpa server
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 6.3_

- [ ] 2. Implementasi CSS responsif dan layout
  - [ ] 2.1 Tulis CSS mobile-first layout untuk ukuran layar 320px–1920px
    - Gunakan CSS Grid atau Flexbox untuk layout dua kolom (form + chart di desktop, kolom tunggal di mobile)
    - Pastikan Balance_Display selalu terlihat di bagian atas tanpa scroll pada semua ukuran layar
    - Tambahkan breakpoint di 768px untuk beralih dari layout kolom tunggal ke multi-kolom
    - Pastikan Transaction_List memiliki `overflow-y: scroll` dengan tinggi tetap agar dapat di-scroll
    - _Requirements: 6.2, 6.4, 3.5_

- [ ] 3. Implementasi data models dan pure functions di `js/app.js`
  - [ ] 3.1 Definisikan konstanta dan tipe data
    - Definisikan `VALID_CATEGORIES = ['Food', 'Transport', 'Fun']` dan `MAX_TRANSACTIONS = 1000`
    - Tambahkan fungsi pembantu `generateId()` menggunakan `crypto.randomUUID()` atau fallback UUID v4 manual
    - _Requirements: 1.1_

  - [ ] 3.2 Implementasi pure functions untuk manipulasi daftar transaksi
    - Tulis `addTransaction(list, transaction)` — mengembalikan array baru dengan transaksi ditambahkan di awal
    - Tulis `removeTransaction(list, id)` — mengembalikan array baru tanpa transaksi dengan `id` tersebut
    - Tulis `calculateTotal(list)` — mengembalikan jumlah semua `amount`, atau `0` jika list kosong
    - Tulis `computeCategorySummaries(list)` — mengembalikan array `CategorySummary[]` dengan `total` dan `percentage` per kategori
    - Ekspor fungsi-fungsi ini via `if (typeof module !== 'undefined') module.exports = ...` untuk testability
    - _Requirements: 1.5, 2.4, 3.1, 3.4, 4.1, 4.4_

  - [ ]* 3.3 Tulis property test untuk `addTransaction` (Property 3)
    - **Property 3: Penambahan Transaksi Menambah Panjang Daftar**
    - **Validates: Requirements 1.5**
    - Gunakan `fc.array(arbitraryTransaction(), { maxLength: 999 })` dan `arbitraryTransaction()`
    - Verifikasi `result.length === existingList.length + 1`

  - [ ]* 3.4 Tulis property test untuk `removeTransaction` (Property 4)
    - **Property 4: Penghapusan Transaksi Mengurangi Panjang Daftar**
    - **Validates: Requirements 2.4**
    - Gunakan `fc.array(arbitraryTransaction(), { minLength: 1 })`
    - Verifikasi panjang berkurang satu dan `id` target tidak ada lagi di result

  - [ ]* 3.5 Tulis property test untuk `calculateTotal` (Property 5)
    - **Property 5: Balance Adalah Jumlah Semua Amount**
    - **Validates: Requirements 3.1, 3.4**
    - Gunakan `fc.array(arbitraryTransaction())`
    - Verifikasi `Math.abs(calculateTotal(list) - sum) < 0.001`

  - [ ]* 3.6 Tulis property test untuk `computeCategorySummaries` (Property 6)
    - **Property 6: Proporsi Chart Menjumlah ke 100%**
    - **Validates: Requirements 4.1, 4.4**
    - Gunakan `fc.array(arbitraryTransaction(), { minLength: 1 })`
    - Verifikasi `Math.abs(totalPct - 100) <= 0.1`

- [ ] 4. Checkpoint — Pastikan semua test pure functions lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 5. Implementasi `StorageModule`
  - [ ] 5.1 Tulis implementasi `StorageModule`
    - Implementasi `StorageModule.load()`: baca dari `localStorage`, parse JSON, kembalikan `[]` jika tidak ada data; tangkap error `JSON.parse` dengan memanggil `clear()` dan kembalikan `[]`
    - Implementasi `StorageModule.save(transactions)`: stringify dan tulis ke `localStorage`; lempar error jika penyimpanan gagal (kuota penuh); tolak save jika `transactions.length > MAX_TRANSACTIONS`
    - Implementasi `StorageModule.clear()`: hapus key dari `localStorage`
    - Tangani kasus `typeof localStorage === 'undefined'` secara graceful di semua metode
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 5.2 Tulis property test untuk `StorageModule` (Property 7)
    - **Property 7: Serialisasi Round-Trip Local Storage**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Mock `localStorage` menggunakan implementasi in-memory di lingkungan test
    - Gunakan `fc.array(arbitraryTransaction(), { maxLength: 1000 })`
    - Verifikasi bahwa `load()` setelah `save(transactions)` menghasilkan array yang identik secara struktural

  - [ ]* 5.3 Tulis unit test untuk skenario error `StorageModule`
    - Test: data rusak (non-JSON) dihapus dan `load()` mengembalikan `[]`
    - Test: `localStorage` tidak tersedia ditangani secara graceful (tidak throw uncaught error)
    - _Requirements: 5.5_

- [ ] 6. Implementasi `Validator`
  - [ ] 6.1 Tulis implementasi `Validator`
    - Implementasi `Validator.validateName(name)`: tolak string kosong, whitespace-only, atau panjang > 100 karakter; kembalikan `FieldError` atau `null`
    - Implementasi `Validator.validateAmount(rawValue)`: parse ke float; tolak nilai di luar rentang `[0.01, 999999999.99]`, NaN, atau string kosong; kembalikan `FieldError` atau `null`
    - Implementasi `Validator.validateCategory(category)`: tolak nilai yang bukan salah satu dari `VALID_CATEGORIES`; kembalikan `FieldError` atau `null`
    - Implementasi `Validator.validate(formData)`: panggil ketiga fungsi di atas, kumpulkan semua `FieldError`, kembalikan `{ valid: true }` atau `{ valid: false, errors: [...] }`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 6.2 Tulis property test untuk validasi whitespace dan input kosong (Property 1)
    - **Property 1: Whitespace dan Input Kosong Ditolak Validator**
    - **Validates: Requirements 1.2, 1.3**
    - Gunakan `fc.stringMatching(/^\s*$/)` untuk menghasilkan string whitespace-only
    - Verifikasi `Validator.validateName(invalidName) !== null`

  - [ ]* 6.3 Tulis property test untuk validasi amount di luar rentang (Property 2)
    - **Property 2: Amount di Luar Rentang Ditolak Validator**
    - **Validates: Requirements 1.4**
    - Gunakan `fc.oneof(fc.double({ max: 0.009 }), fc.double({ min: 999999999.991 }))`
    - Verifikasi `Validator.validateAmount(String(outOfRange)) !== null`

  - [ ]* 6.4 Tulis property test untuk input tidak valid tidak mengubah state (Property 8)
    - **Property 8: Input Tidak Valid Tidak Mengubah State**
    - **Validates: Requirements 1.3, 1.4**
    - Definisikan `arbitraryInvalidFormData()` yang menghasilkan setidaknya satu field tidak valid
    - Verifikasi bahwa `Validator.validate(invalidData).valid === false`

  - [ ]* 6.5 Tulis unit test untuk skenario konkret `Validator`
    - Test: input valid lengkap menghasilkan `{ valid: true }`
    - Test: setiap field kosong secara individual menghasilkan error spesifik field tersebut
    - Test: amount tepat di batas bawah (0.01) diterima
    - Test: amount tepat di batas atas (999999999.99) diterima
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 7. Checkpoint — Pastikan semua test Validator dan StorageModule lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 8. Implementasi `UIModule`
  - [ ] 8.1 Tulis implementasi `UIModule`
    - Implementasi `UIModule.renderList(transactions)`: kosongkan container Transaction_List, lalu untuk setiap transaksi buat elemen baris dengan nama, jumlah (format 2 desimal + pemisah ribuan), kategori, dan tombol hapus dengan `data-id` attribute; jika array kosong tampilkan pesan "belum ada transaksi"
    - Implementasi `UIModule.renderBalance(total)`: format `total` sebagai angka dengan 2 desimal dan pemisah ribuan (contoh: `1.234,56`), perbarui teks elemen Balance_Display
    - Implementasi `UIModule.showErrors(errors)`: untuk setiap `FieldError`, tampilkan pesan di elemen error yang bersesuaian dengan field tersebut
    - Implementasi `UIModule.clearErrors()`: hapus semua pesan error yang ditampilkan
    - Implementasi `UIModule.resetForm()`: kosongkan semua field Input_Form dan pindahkan fokus ke field pertama
    - Implementasi `UIModule.showGlobalError(message)`: tampilkan pesan error global di area yang terlihat oleh pengguna
    - _Requirements: 1.3, 1.6, 2.1, 2.5, 3.1, 3.4, 3.5_

  - [ ]* 8.2 Tulis unit test untuk format angka `UIModule.renderBalance`
    - Test: nilai `0` diformat sebagai `"0,00"`
    - Test: nilai `1234567.89` diformat sebagai `"1.234.567,89"`
    - _Requirements: 3.1, 3.4_

- [ ] 9. Implementasi `ChartModule`
  - [ ] 9.1 Tulis implementasi `ChartModule`
    - Implementasi `ChartModule.init(canvasId)`: ambil elemen `<canvas>`, buat instance `Chart` baru dari Chart.js dengan tipe `pie`; tangkap error jika Chart.js gagal dimuat dari CDN dengan menampilkan pesan fallback di area chart
    - Implementasi `ChartModule.update(transactions)`: panggil `computeCategorySummaries(transactions)`, perbarui `data.datasets[0].data` dan `data.labels` pada instance Chart; jika semua total kategori = 0, tampilkan pesan "tidak ada data" dan sembunyikan canvas
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4_

  - [ ]* 9.2 Tulis unit test untuk skenario edge case `ChartModule`
    - Test: semua kategori = 0 menampilkan state kosong (canvas tersembunyi, pesan fallback terlihat)
    - Test: satu kategori dengan nilai > 0 menampilkan 100%
    - _Requirements: 4.4, 4.5_

- [ ] 10. Checkpoint — Pastikan semua test UIModule dan ChartModule lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 11. Implementasi `AppController` dan wiring semua komponen
  - [ ] 11.1 Tulis implementasi `AppController`
    - Implementasi `AppController.init()`: deteksi dukungan `localStorage` dan API yang diperlukan; muat transaksi via `StorageModule.load()`; panggil `UIModule.renderList()`, `UIModule.renderBalance()`, dan `ChartModule.update()` dengan data yang dimuat; daftarkan event listener `submit` pada Input_Form dan event listener `click` (delegasi) pada Transaction_List untuk tombol hapus
    - Implementasi `AppController.handleSubmit(event)`: cegah default submit; baca nilai field dari Input_Form; panggil `Validator.validate()`; jika gagal panggil `UIModule.showErrors()`; jika berhasil buat objek `Transaction` baru dengan `generateId()` dan `createdAt` ISO 8601, panggil `addTransaction()`, `StorageModule.save()`, `UIModule.renderList()`, `UIModule.renderBalance()`, `ChartModule.update()`, `UIModule.resetForm()`; tangkap error dari `StorageModule.save()` dan panggil `UIModule.showGlobalError()`
    - Implementasi `AppController.handleDelete(transactionId)`: panggil `removeTransaction()`, `StorageModule.save()`, `UIModule.renderList()`, `UIModule.renderBalance()`, `ChartModule.update()`; tangkap error dari `StorageModule.save()`
    - Daftarkan `AppController.init()` pada event `DOMContentLoaded`
    - _Requirements: 1.5, 1.6, 2.2, 2.4, 3.2, 3.3, 4.2, 4.3, 5.1, 5.2, 5.6, 6.5_

- [ ] 12. Verifikasi cross-browser dan responsivitas
  - [ ] 12.1 Verifikasi struktur HTML dan referensi file sesuai Requirement 7
    - Konfirmasi tepat satu `<link rel="stylesheet">` mengarah ke `css/style.css`
    - Konfirmasi tepat satu `<script src>` lokal mengarah ke `js/app.js`
    - Konfirmasi jumlah `<script src>` CDN tidak lebih dari 5
    - Konfirmasi tidak ada referensi ke `package.json`, `node_modules`, atau framework di HTML
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13. Final checkpoint — Pastikan semua test lulus
  - Jalankan seluruh test suite (`vitest --run`), pastikan semua test lulus. Tanyakan kepada pengguna jika ada pertanyaan sebelum dianggap selesai.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk pengembangan MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental di setiap tahap
- Property-based tests memvalidasi properti universal (8 properties dari design.md)
- Unit tests memvalidasi skenario konkret dan edge case
- Fungsi pure (`addTransaction`, `removeTransaction`, `calculateTotal`, `computeCategorySummaries`) harus diekstrak agar dapat diuji tanpa DOM
- Semua pesan error kepada pengguna menggunakan Bahasa Indonesia

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1"] },
    { "id": 1, "tasks": ["2.1", "3.2", "5.1", "6.1"] },
    { "id": 2, "tasks": ["3.3", "3.4", "3.5", "3.6", "5.2", "5.3", "6.2", "6.3", "6.4", "6.5", "8.1", "9.1"] },
    { "id": 3, "tasks": ["8.2", "9.2", "11.1"] },
    { "id": 4, "tasks": ["12.1"] }
  ]
}
```
