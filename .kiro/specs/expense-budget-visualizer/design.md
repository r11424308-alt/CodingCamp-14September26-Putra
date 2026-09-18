# Design Document — Expense & Budget Visualizer

## Overview

Expense & Budget Visualizer adalah aplikasi web satu halaman (*Single Page Application*) tanpa server backend yang berjalan sepenuhnya di browser. Aplikasi ini dibangun dengan HTML, CSS, dan Vanilla JavaScript murni serta memanfaatkan:

- **Browser Local Storage** untuk persistensi data antar sesi.
- **Chart.js** (dimuat via CDN) untuk menampilkan pie chart distribusi pengeluaran.

Pengguna dapat menambahkan transaksi pengeluaran dengan nama item, jumlah, dan kategori (Food / Transport / Fun). Setiap perubahan data — penambahan maupun penghapusan — langsung memperbarui tampilan daftar transaksi, total saldo, dan pie chart tanpa reload halaman.

### Ruang Lingkup

| Fitur | Deskripsi singkat |
|---|---|
| Menambah transaksi | Form input dengan validasi sisi klien |
| Daftar transaksi | Render daftar scrollable dengan tombol hapus |
| Total saldo | Perhitungan dan tampilan real-time |
| Pie chart | Distribusi pengeluaran per kategori via Chart.js |
| Persistensi | Baca/tulis Local Storage secara otomatis |
| Responsivitas | Layout mobile-first, 320px–1920px |

---

## Architecture

### Prinsip Arsitektur

Karena aplikasi tidak menggunakan framework, arsitektur mengikuti pola **Module Pattern** berbasis Vanilla JS. Satu file JavaScript (`js/app.js`) distrukturkan sebagai koleksi modul (IIFE / object literal) yang masing-masing memiliki tanggung jawab tunggal. Seluruh komunikasi antar modul terjadi melalui pemanggilan fungsi langsung — tidak ada event bus atau reactive state.

```
┌─────────────────────────────────────────────────┐
│                    index.html                   │
│  ┌──────────────────────────────────────────┐   │
│  │              js/app.js                   │   │
│  │                                          │   │
│  │  ┌──────────┐   ┌────────────────────┐  │   │
│  │  │ Storage  │◄──│   AppController    │  │   │
│  │  │  Module  │   │   (Orchestrator)   │  │   │
│  │  └──────────┘   └────────┬───────────┘  │   │
│  │                          │              │   │
│  │       ┌──────────────────┼────────┐     │   │
│  │       ▼                  ▼        ▼     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│   │
│  │  │Validator │  │   UI     │  │ Chart  ││   │
│  │  │  Module  │  │  Module  │  │ Module ││   │
│  │  └──────────┘  └──────────┘  └────────┘│   │
│  └──────────────────────────────────────────┘   │
│  css/style.css          Chart.js (CDN)          │
└─────────────────────────────────────────────────┘
```

### Alur Data (Data Flow)

```
Pengguna mengisi form ──► AppController.handleSubmit()
                                    │
                    ┌───────────────▼───────────────┐
                    │  Validator.validate(formData)  │
                    └───────────────┬───────────────┘
                        fail ◄──────┤──────► pass
                          │                  │
                    tampilkan error     StorageModule.save()
                                             │
                                      UIModule.renderList()
                                      UIModule.renderBalance()
                                      ChartModule.update()
```

---

## Components and Interfaces

### 1. `StorageModule`

Bertanggung jawab penuh atas baca/tulis Local Storage. Modul ini adalah satu-satunya komponen yang berinteraksi langsung dengan `localStorage`.

```js
StorageModule = {
  STORAGE_KEY: 'expense_transactions',
  MAX_TRANSACTIONS: 1000,

  // Memuat array Transaction dari localStorage.
  // Mengembalikan [] jika tidak ada data atau data tidak valid.
  load(): Transaction[],

  // Menyimpan seluruh array Transaction ke localStorage.
  // Melempar StorageError jika penyimpanan gagal (kuota penuh, dll).
  save(transactions: Transaction[]): void,

  // Menghapus semua data dari localStorage.
  clear(): void,
}
```

### 2. `Validator`

Berisi logika validasi murni (*pure functions*) tanpa efek samping pada DOM.

```js
Validator = {
  // Memvalidasi data form sebelum membuat Transaction.
  // Mengembalikan { valid: true } atau { valid: false, errors: FieldError[] }
  validate(formData: FormData): ValidationResult,

  // Memvalidasi satu field nama item (bukan kosong, ≤ 100 karakter).
  validateName(name: string): FieldError | null,

  // Memvalidasi field jumlah (angka, 0.01 – 999999999.99).
  validateAmount(rawValue: string): FieldError | null,

  // Memvalidasi bahwa kategori adalah salah satu dari VALID_CATEGORIES.
  validateCategory(category: string): FieldError | null,
}
```

### 3. `UIModule`

Mengelola semua manipulasi DOM kecuali chart.

```js
UIModule = {
  // Merender ulang seluruh Transaction_List berdasarkan array.
  renderList(transactions: Transaction[]): void,

  // Memperbarui tampilan Balance_Display.
  renderBalance(total: number): void,

  // Menampilkan pesan error per field pada Input_Form.
  showErrors(errors: FieldError[]): void,

  // Membersihkan semua pesan error.
  clearErrors(): void,

  // Mereset Input_Form ke kondisi awal (kosong, fokus ke field pertama).
  resetForm(): void,

  // Menampilkan pesan error global (misalnya: gagal simpan ke Storage).
  showGlobalError(message: string): void,
}
```

### 4. `ChartModule`

Membungkus Chart.js dan mengekspos interface minimal.

```js
ChartModule = {
  // Inisialisasi instance Chart.js pada elemen <canvas> yang ditentukan.
  init(canvasId: string): void,

  // Memperbarui data chart berdasarkan array Transaction terkini.
  // Jika semua total kategori = 0, menampilkan pesan "tidak ada data".
  update(transactions: Transaction[]): void,
}
```

### 5. `AppController`

Orkestrator utama. Menghubungkan semua modul dan menangani event dari DOM.

```js
AppController = {
  // Dipanggil saat DOMContentLoaded; memuat data, merender UI awal.
  init(): void,

  // Handler untuk submit form.
  handleSubmit(event: Event): void,

  // Handler untuk tombol hapus pada setiap entri Transaction.
  handleDelete(transactionId: string): void,
}
```

---

## Data Models

### `Transaction`

Unit data utama yang mewakili satu entri pengeluaran.

```js
/**
 * @typedef {Object} Transaction
 * @property {string}   id        - UUID v4 unik, dihasilkan saat pembuatan.
 * @property {string}   name      - Nama item, 1–100 karakter.
 * @property {number}   amount    - Jumlah pengeluaran, 0.01–999999999.99.
 * @property {Category} category  - Salah satu dari: 'Food', 'Transport', 'Fun'.
 * @property {string}   createdAt - ISO 8601 timestamp saat transaksi dibuat.
 */

const VALID_CATEGORIES = ['Food', 'Transport', 'Fun'];
```

### `ValidationResult`

```js
/**
 * @typedef {Object} ValidationResult
 * @property {boolean}      valid
 * @property {FieldError[]} errors  - Array kosong jika valid = true.
 */

/**
 * @typedef {Object} FieldError
 * @property {string} field    - Nama field: 'name' | 'amount' | 'category'.
 * @property {string} message  - Pesan error yang ditampilkan ke pengguna.
 */
```

### `CategorySummary`

Digunakan oleh `ChartModule` untuk menghitung proporsi.

```js
/**
 * @typedef {Object} CategorySummary
 * @property {string} category   - Nama kategori.
 * @property {number} total      - Total pengeluaran kategori ini.
 * @property {number} percentage - Proporsi terhadap total keseluruhan (0–100).
 */
```

### Skema Local Storage

Data disimpan sebagai JSON di bawah key `expense_transactions`:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nasi Padang",
    "amount": 25000,
    "category": "Food",
    "createdAt": "2025-01-15T12:30:00.000Z"
  }
]
```

**Invariant**: Array tidak boleh melebihi 1000 elemen (ditegakkan oleh `StorageModule.save()`).

### Struktur File

```
project-root/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

Tidak ada `package.json`, `node_modules`, atau build tool. Chart.js dimuat via satu `<script src="https://cdn.jsdelivr.net/npm/chart.js">` di `index.html`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Whitespace dan Input Kosong Ditolak Validator

*For any* string yang seluruhnya terdiri dari whitespace atau string kosong pada field nama, jumlah, atau kategori, `Validator.validate()` SHALL mengembalikan `{ valid: false }` dan daftar transaksi SHALL tidak berubah.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Amount di Luar Rentang Ditolak Validator

*For any* nilai numerik di luar rentang [0.01, 999999999.99] pada field jumlah, `Validator.validateAmount()` SHALL mengembalikan sebuah `FieldError` (bukan null).

**Validates: Requirements 1.4**

---

### Property 3: Penambahan Transaksi Menambah Panjang Daftar

*For any* daftar transaksi yang valid dan satu transaksi baru yang valid, menambahkan transaksi tersebut ke daftar SHALL menghasilkan daftar baru dengan panjang bertambah tepat satu.

**Validates: Requirements 1.5**

---

### Property 4: Penghapusan Transaksi Mengurangi Panjang Daftar

*For any* daftar transaksi yang berisi setidaknya satu transaksi, menghapus satu transaksi berdasarkan `id` SHALL menghasilkan daftar baru dengan panjang berkurang tepat satu, dan transaksi dengan `id` tersebut tidak ada lagi dalam daftar.

**Validates: Requirements 2.4**

---

### Property 5: Balance Adalah Jumlah Semua Amount

*For any* daftar transaksi, total yang dihitung oleh fungsi kalkulasi saldo SHALL sama dengan penjumlahan seluruh field `amount` dari setiap transaksi dalam daftar. Jika daftar kosong, total SHALL sama dengan 0.

**Validates: Requirements 3.1, 3.4**

---

### Property 6: Proporsi Chart Menjumlah ke 100%

*For any* daftar transaksi yang memiliki total keseluruhan lebih dari nol, jumlah semua `percentage` pada `CategorySummary` yang dihasilkan SHALL sama dengan 100 (dengan toleransi pembulatan ± 0.1).

**Validates: Requirements 4.1, 4.4**

---

### Property 7: Serialisasi Round-Trip Local Storage

*For any* array `Transaction[]` yang valid, menyimpan array tersebut ke Local Storage (via `StorageModule.save()`) kemudian membacanya kembali (via `StorageModule.load()`) SHALL menghasilkan array yang ekuivalen secara struktural — setiap field `id`, `name`, `amount`, `category`, dan `createdAt` pada setiap elemen identik.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 8: Input Tidak Valid Tidak Mengubah State

*For any* state aplikasi yang ada dan input form yang tidak valid (validasi gagal), memanggil `AppController.handleSubmit()` SHALL tidak mengubah daftar transaksi, total saldo, maupun data di Local Storage.

**Validates: Requirements 1.3, 1.4**

---

## Error Handling

### Strategi Penanganan Error

| Skenario Error | Penanganan |
|---|---|
| Field form kosong / tidak valid | `Validator` mengembalikan `FieldError[]`; `UIModule.showErrors()` menampilkan pesan per field; transaksi **tidak** dibuat |
| Amount di luar rentang | Sama seperti di atas, spesifik pada field `amount` |
| Local Storage penuh / izin ditolak | `StorageModule.save()` melempar error; `AppController` menangkap dan memanggil `UIModule.showGlobalError()` dengan pesan informatif; transaksi tetap tampil in-memory |
| Data Local Storage rusak / tidak valid | `StorageModule.load()` menangkap `JSON.parse` error, memanggil `StorageModule.clear()`, dan mengembalikan `[]` |
| Browser tidak mendukung Local Storage | Deteksi `typeof localStorage === 'undefined'` saat `init()`; tampilkan pesan ketidakdukungan; app tetap berjalan secara in-memory |
| Browser tidak mendukung API yang diperlukan | Deteksi fitur kritis saat `AppController.init()`; `UIModule.showGlobalError()` merekomendasikan browser alternatif |
| Chart.js gagal dimuat dari CDN | Tangkap error `onerror` pada elemen `<script>` Chart.js; `ChartModule.init()` batal secara graceful; tampilkan pesan fallback di area chart |

### Pesan Error kepada Pengguna

Semua pesan error menggunakan Bahasa Indonesia yang jelas dan non-teknis, sesuai target pengguna aplikasi.

---

## Testing Strategy

### Pendekatan Dual Testing

Strategi pengujian mengombinasikan dua pendekatan yang saling melengkapi:

1. **Unit Tests (example-based)** — memverifikasi skenario konkret, edge case, dan kondisi error.
2. **Property-Based Tests (PBT)** — memverifikasi properti universal yang harus berlaku untuk semua input yang valid.

### Library yang Digunakan

- **Test runner**: [Vitest](https://vitest.dev/) — kompatibel dengan proyek tanpa build tool saat dijalankan via CLI.
- **Property-based testing**: [fast-check](https://fast-check.io/) — library PBT untuk JavaScript/TypeScript yang matang dan aktif.

### Unit Tests (Example-Based)

Unit test difokuskan pada skenario spesifik yang tidak cukup dicakup oleh PBT:

| Area | Skenario yang diuji |
|---|---|
| `Validator` | Input valid menghasilkan `{ valid: true }` |
| `Validator` | Setiap field kosong secara individual menghasilkan error spesifik |
| `Validator` | Amount tepat di batas (0.01 dan 999999999.99) diterima |
| `UIModule.renderBalance` | Nilai `0` diformat sebagai `"0,00"` |
| `UIModule.renderBalance` | Nilai `1234567.89` diformat sebagai `"1.234.567,89"` |
| `StorageModule` | Data rusak (non-JSON) dihapus dan mengembalikan `[]` |
| `StorageModule` | `localStorage` tidak tersedia ditangani secara graceful |
| `AppController` | Penambahan berhasil mereset form |
| `ChartModule` | Semua kategori = 0 menampilkan state kosong |
| `ChartModule` | Satu kategori dengan nilai > 0 menampilkan 100% |

### Property-Based Tests

Setiap property-based test dikonfigurasi dengan **minimum 100 iterasi** dan ditag dengan referensi ke properti desain.

#### PBT 1 — Whitespace dan Input Kosong Ditolak

```js
// Feature: expense-budget-visualizer, Property 1: Whitespace dan Input Kosong Ditolak Validator
fc.assert(fc.property(
  fc.stringMatching(/^\s*$/), // string whitespace-only atau kosong
  (invalidName) => {
    const result = Validator.validateName(invalidName);
    return result !== null; // harus ada FieldError
  }
), { numRuns: 100 });
```

#### PBT 2 — Amount di Luar Rentang Ditolak

```js
// Feature: expense-budget-visualizer, Property 2: Amount di Luar Rentang Ditolak Validator
fc.assert(fc.property(
  fc.oneof(
    fc.double({ max: 0.009 }),            // di bawah minimum
    fc.double({ min: 999999999.991 })     // di atas maksimum
  ),
  (outOfRangeAmount) => {
    const result = Validator.validateAmount(String(outOfRangeAmount));
    return result !== null;
  }
), { numRuns: 100 });
```

#### PBT 3 — Penambahan Menambah Panjang Daftar

```js
// Feature: expense-budget-visualizer, Property 3: Penambahan Transaksi Menambah Panjang Daftar
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { maxLength: 999 }),
  arbitraryTransaction(),
  (existingList, newTransaction) => {
    const result = addTransaction(existingList, newTransaction);
    return result.length === existingList.length + 1;
  }
), { numRuns: 100 });
```

#### PBT 4 — Penghapusan Mengurangi Panjang Daftar

```js
// Feature: expense-budget-visualizer, Property 4: Penghapusan Transaksi Mengurangi Panjang Daftar
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { minLength: 1 }),
  (transactions) => {
    const target = transactions[0];
    const result = removeTransaction(transactions, target.id);
    return result.length === transactions.length - 1
      && result.every(t => t.id !== target.id);
  }
), { numRuns: 100 });
```

#### PBT 5 — Balance Adalah Jumlah Semua Amount

```js
// Feature: expense-budget-visualizer, Property 5: Balance Adalah Jumlah Semua Amount
fc.assert(fc.property(
  fc.array(arbitraryTransaction()),
  (transactions) => {
    const expected = transactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.abs(calculateTotal(transactions) - expected) < 0.001;
  }
), { numRuns: 100 });
```

#### PBT 6 — Proporsi Chart Menjumlah ke 100%

```js
// Feature: expense-budget-visualizer, Property 6: Proporsi Chart Menjumlah ke 100%
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { minLength: 1 }),
  (transactions) => {
    const summaries = computeCategorySummaries(transactions);
    const totalPct = summaries.reduce((sum, s) => sum + s.percentage, 0);
    return Math.abs(totalPct - 100) <= 0.1;
  }
), { numRuns: 100 });
```

#### PBT 7 — Serialisasi Round-Trip

```js
// Feature: expense-budget-visualizer, Property 7: Serialisasi Round-Trip Local Storage
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { maxLength: 1000 }),
  (transactions) => {
    const serialized = JSON.stringify(transactions);
    const deserialized = JSON.parse(serialized);
    return JSON.stringify(deserialized) === serialized;
  }
), { numRuns: 100 });
```

#### PBT 8 — Input Tidak Valid Tidak Mengubah State

```js
// Feature: expense-budget-visualizer, Property 8: Input Tidak Valid Tidak Mengubah State
fc.assert(fc.property(
  fc.array(arbitraryTransaction()),
  arbitraryInvalidFormData(),
  (existingTransactions, invalidData) => {
    const result = Validator.validate(invalidData);
    // Validasi gagal → daftar tidak berubah
    return !result.valid && existingTransactions.length === existingTransactions.length;
  }
), { numRuns: 100 });
```

### Catatan Implementasi PBT

Beberapa fungsi logika murni perlu diekstrak dari `app.js` agar dapat diuji secara independen tanpa DOM:

- `addTransaction(list, transaction)` → mengembalikan list baru
- `removeTransaction(list, id)` → mengembalikan list baru
- `calculateTotal(list)` → mengembalikan number
- `computeCategorySummaries(list)` → mengembalikan `CategorySummary[]`
- `Validator.validate(formData)` → pure function tanpa side effect

Fungsi-fungsi ini dapat diekspos via `module.exports` saat dijalankan di lingkungan Node (test), dan tetap berfungsi di browser melalui pengecekan `typeof module !== 'undefined'`.
