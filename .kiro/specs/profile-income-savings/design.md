# Design Document — Profile, Income & Savings Feature

## Overview

Dokumen ini mendeskripsikan desain teknis untuk perluasan (*extension*) aplikasi **Expense & Budget Visualizer** yang sudah ada. Tiga kapabilitas baru ditambahkan ke aplikasi web satu halaman yang sama, tanpa mengubah struktur file yang ada:

1. **Profil Pengguna** (`ProfileModule`) — simpan dan edit data pribadi (nama lengkap, tanggal lahir, nomor telepon) ke/dari localStorage.
2. **Pemasukan** (`IncomeModule`) — catat sumber pemasukan dengan kategori, lihat riwayat, lihat total.
3. **Tabungan** (`SavingsModule`) — catat alokasi tabungan per tujuan dengan tanggal, lihat riwayat, lihat total.
4. **Saldo Bersih** (`Net_Balance_Display`) — memperluas `Balance_Display` yang ada menjadi: Total Pemasukan − Total Pengeluaran − Total Tabungan, dengan kode warna (positif/negatif/nol).

### Prinsip Utama

- Seluruh kode baru ditulis di dalam file **yang sudah ada**: `js/app.js`, `css/style.css`, dan `index.html` — tidak ada file tambahan.
- Arsitektur **Module Pattern** (IIFE) yang sudah ada dipertahankan dan diperluas.
- Tema visual **dark navy/gold** dipertahankan untuk semua komponen baru.
- Navigasi antar bagian (Pengeluaran / Pemasukan / Tabungan / Profil) menggunakan **tab-based UI**.
- Semua persistensi menggunakan **localStorage** dengan key baru yang tidak konflik.

### Ruang Lingkup Perluasan

| Fitur | Modul Baru | Perubahan Modul Lama |
|---|---|---|
| Profil Pengguna | `ProfileModule` | `StorageModule` + `UIModule` + `AppController` |
| Pemasukan | `IncomeModule` + fungsi pure baru | `StorageModule` + `UIModule` + `AppController` |
| Tabungan | `SavingsModule` + fungsi pure baru | `StorageModule` + `UIModule` + `AppController` |
| Saldo Bersih | Fungsi pure `calculateNetBalance` | `UIModule.renderNetBalance()` + `AppController` |
| Navigasi Tab | — | `UIModule` + HTML baru |

---

## Architecture

### Prinsip Arsitektur

Arsitektur **Module Pattern** (IIFE) dipertahankan sepenuhnya. Modul baru ditambahkan mengikuti pola yang sama persis dengan modul yang ada. Tidak ada perubahan pada pola komunikasi antar modul — semua komunikasi tetap melalui pemanggilan fungsi langsung.

```
┌──────────────────────────────────────────────────────────────────┐
│                          index.html                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                        js/app.js                           │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │             StorageModule (diperluas)              │   │  │
│  │  │  expense_transactions | income_entries |           │   │  │
│  │  │  savings_entries      | user_profile               │   │  │
│  │  └────────────────────┬───────────────────────────────┘   │  │
│  │                        │                                   │  │
│  │  ┌─────────────────────▼─────────────────────────────┐   │  │
│  │  │           AppController (diperluas)                │   │  │
│  │  │              (Orchestrator utama)                  │   │  │
│  │  └──┬──────────┬──────────┬──────────┬───────────────┘   │  │
│  │     │          │          │          │                     │  │
│  │     ▼          ▼          ▼          ▼                     │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │  │
│  │  │Valid-│  │  UI  │  │Chart │  │Profile│                 │  │
│  │  │ator  │  │Module│  │Module│  │Module │                 │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                 │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                      │  │
│  │  │IncomeModule  │  │SavingsModule │  (modul baru)        │  │
│  │  └──────────────┘  └──────────────┘                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  css/style.css                    Chart.js (CDN)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Navigasi Tab

HTML baru ditambahkan di atas `<main class="main-content">` yang sudah ada. Tab bar mengontrol visibilitas section melalui atribut `hidden` pada `<section>`. JavaScript tab switcher ditambahkan ke `UIModule`.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Pengeluaran]  [Pemasukan]  [Tabungan]  [Profil]               │
├─────────────────────────────────────────────────────────────────┤
│  Section aktif ditampilkan, lainnya hidden                       │
└─────────────────────────────────────────────────────────────────┘
```

### Alur Data — Pemasukan (Income)

```
Pengguna submit Income_Form
          │
          ▼
IncomeModule.handleSubmit()
          │
  IncomeValidator.validate(formData)
          │
     fail ◄──┤──► pass
      │               │
  showErrors    addIncome(list, entry)
                      │
               StorageModule.saveIncome()
                      │
               UIModule.renderIncomeList()
               UIModule.renderNetBalance()
               UIModule.resetIncomeForm()
```

### Alur Data — Saldo Bersih

```
Setiap perubahan data (add/delete di Income, Expenses, atau Savings)
          │
          ▼
calculateNetBalance(incomeList, expenseList, savingsList)
          │
          ▼
UIModule.renderNetBalance(netBalance)
          │
  ┌───────┴──────────┐
  ▼                  ▼
nilai            warna berdasarkan
diformat Rp     tanda (positif/negatif/nol)
```

---

## Components and Interfaces

### Modul yang Diperluas

#### `StorageModule` (diperluas)

Tiga key baru ditambahkan — tidak konflik dengan key `expense_transactions` yang sudah ada.

```js
// Key-key baru yang ditambahkan:
INCOME_KEY    = 'income_entries'
SAVINGS_KEY   = 'savings_entries'
PROFILE_KEY   = 'user_profile'

// Fungsi baru yang ditambahkan ke StorageModule:
StorageModule.loadIncome()          : IncomeEntry[]
StorageModule.saveIncome(list)      : void   // throws pada kuota penuh
StorageModule.loadSavings()         : SavingsEntry[]
StorageModule.saveSavings(list)     : void   // throws pada kuota penuh
StorageModule.loadProfile()         : Profile | null
StorageModule.saveProfile(profile)  : void   // throws pada kuota penuh
```

#### `UIModule` (diperluas)

Fungsi render baru ditambahkan ke objek yang dikembalikan `UIModule`.

```js
// Fungsi baru:
UIModule.renderIncomeList(incomeList: IncomeEntry[])    : void
UIModule.renderSavingsList(savingsList: SavingsEntry[]) : void
UIModule.renderNetBalance(netBalance: number)           : void
UIModule.renderIncomeTotals(total: number)              : void
UIModule.renderSavingsTotals(total: number)             : void
UIModule.renderProfileForm(profile: Profile | null)     : void
UIModule.showProfileSuccess(message: string)            : void
UIModule.showIncomeErrors(errors: FieldError[])         : void
UIModule.showSavingsErrors(errors: FieldError[])        : void
UIModule.showProfileErrors(errors: FieldError[])        : void
UIModule.clearIncomeErrors()                            : void
UIModule.clearSavingsErrors()                           : void
UIModule.clearProfileErrors()                           : void
UIModule.resetIncomeForm()                              : void
UIModule.resetSavingsForm()                             : void
UIModule.switchTab(tabName: string)                     : void
```

#### `AppController` (diperluas)

Handler baru di-wire ke form baru. State in-memory diperluas.

```js
// State baru di AppController:
let _incomeList   = []  // IncomeEntry[]
let _savingsList  = []  // SavingsEntry[]

// Handler baru:
AppController.handleIncomeSubmit(event)       : void
AppController.handleIncomeDelete(id)          : void
AppController.handleSavingsSubmit(event)      : void
AppController.handleSavingsDelete(id)         : void
AppController.handleProfileSave(event)        : void
AppController._updateNetBalance()             : void  // dipanggil setelah setiap perubahan
```

### Modul Baru

#### `ProfileModule`

Mengenkapsulasi validasi dan logika khusus profil.

```js
const ProfileModule = (function() {

  // Validasi data profil sebelum disimpan.
  // Mengembalikan { valid: true } atau { valid: false, errors: FieldError[] }
  function validate(formData: {
    fullName: string,
    birthDate: string,   // format 'YYYY-MM-DD' atau '' (opsional)
    phone: string        // format bebas atau '' (opsional)
  }): ValidationResult

  // Validasi nama lengkap: tidak boleh kosong atau hanya spasi.
  function validateFullName(name: string): FieldError | null

  // Validasi nomor telepon: jika diisi, hanya karakter [0-9+\s-], panjang 7-20.
  function validatePhone(phone: string): FieldError | null

  // Validasi tanggal lahir: jika diisi, tidak boleh melebihi tanggal hari ini.
  function validateBirthDate(dateStr: string): FieldError | null

  return { validate, validateFullName, validatePhone, validateBirthDate };
})();
```

#### `IncomeModule`

Mengenkapsulasi validasi dan logika khusus pemasukan.

```js
const IncomeModule = (function() {
  const VALID_INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Bisnis', 'Lainnya'];

  // Memvalidasi data Income_Form.
  function validate(formData: {
    name: string,
    amount: string,
    category: string
  }): ValidationResult

  function validateIncomeName(name: string): FieldError | null
  function validateIncomeAmount(rawValue: string): FieldError | null
  function validateIncomeCategory(category: string): FieldError | null

  return { validate, validateIncomeName, validateIncomeAmount, validateIncomeCategory,
           VALID_INCOME_CATEGORIES };
})();
```

#### `SavingsModule`

Mengenkapsulasi validasi dan logika khusus tabungan.

```js
const SavingsModule = (function() {

  // Memvalidasi data Savings_Form.
  function validate(formData: {
    goalName: string,
    amount: string,
    date: string    // format 'YYYY-MM-DD', wajib diisi
  }): ValidationResult

  function validateGoalName(name: string): FieldError | null
  function validateSavingsAmount(rawValue: string): FieldError | null
  function validateSavingsDate(dateStr: string): FieldError | null

  return { validate, validateGoalName, validateSavingsAmount, validateSavingsDate };
})();
```

### Fungsi Pure Baru

Ditambahkan ke bagian *Pure Functions* di `app.js`, mengikuti pola `addTransaction` / `removeTransaction` / `calculateTotal` yang sudah ada.

```js
// Income
function addIncome(list, entry)         : IncomeEntry[]
function removeIncome(list, id)         : IncomeEntry[]
function calculateIncomeTotal(list)     : number

// Savings
function addSavings(list, entry)        : SavingsEntry[]
function removeSavings(list, id)        : SavingsEntry[]
function calculateSavingsTotal(list)    : number

// Net Balance
function calculateNetBalance(incomeList, expenseList, savingsList) : number
// = calculateIncomeTotal(incomeList)
//   - calculateTotal(expenseList)        ← fungsi yang sudah ada
//   - calculateSavingsTotal(savingsList)
```

---

## Data Models

### `IncomeEntry`

```js
/**
 * @typedef {Object} IncomeEntry
 * @property {string}         id         - UUID v4 unik, dihasilkan saat pembuatan.
 * @property {string}         name       - Nama/sumber pemasukan, 1–100 karakter.
 * @property {number}         amount     - Jumlah, 0.01–999999999.99.
 * @property {IncomeCategory} category   - 'Gaji' | 'Freelance' | 'Bisnis' | 'Lainnya'.
 * @property {string}         createdAt  - ISO 8601 timestamp saat entri dibuat.
 */

const VALID_INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Bisnis', 'Lainnya'];
```

### `SavingsEntry`

```js
/**
 * @typedef {Object} SavingsEntry
 * @property {string} id        - UUID v4 unik.
 * @property {string} goalName  - Nama tujuan tabungan, 1–100 karakter.
 * @property {number} amount    - Jumlah yang disisihkan, 0.01–999999999.99.
 * @property {string} date      - Tanggal disisihkan, format 'YYYY-MM-DD'.
 * @property {string} createdAt - ISO 8601 timestamp saat entri dibuat.
 */
```

### `Profile`

```js
/**
 * @typedef {Object} Profile
 * @property {string} fullName   - Nama lengkap, 1–100 karakter (wajib).
 * @property {string} birthDate  - Tanggal lahir, format 'YYYY-MM-DD' atau '' (opsional).
 * @property {string} phone      - Nomor telepon atau '' (opsional).
 *                                 Jika diisi: hanya [0-9+\s-], panjang 7–20 karakter.
 */
```

### Skema localStorage

| Key | Format | Max Entries | Modul |
|---|---|---|---|
| `expense_transactions` | `Transaction[]` | 1000 | `StorageModule` (sudah ada) |
| `income_entries` | `IncomeEntry[]` | 1000 | `StorageModule` (baru) |
| `savings_entries` | `SavingsEntry[]` | 1000 | `StorageModule` (baru) |
| `user_profile` | `Profile` (objek tunggal) | — | `StorageModule` (baru) |

Contoh `income_entries`:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Gaji Bulan Januari",
    "amount": 5000000,
    "category": "Gaji",
    "createdAt": "2025-01-01T08:00:00.000Z"
  }
]
```

Contoh `savings_entries`:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "goalName": "Dana Darurat",
    "amount": 500000,
    "date": "2025-01-15",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

Contoh `user_profile`:
```json
{
  "fullName": "Budi Santoso",
  "birthDate": "1990-05-20",
  "phone": "+62 812-3456-7890"
}
```

### Representasi Net Balance

`Net_Balance_Display` menampilkan satu angka dengan kelas CSS yang dikontrol secara dinamis:

```
.net-balance--positive  → warna hijau (#22c55e, kontras ≥ 4.5:1 terhadap #1e293b)
.net-balance--negative  → warna merah (#f87171, kontras ≥ 4.5:1 terhadap #1e293b)
.net-balance--zero      → warna amber/muted (#f59e0b atau #94a3b8)
```

### Struktur HTML Tambahan (Ringkasan)

```
<nav class="tab-nav">
  [Tab: Pengeluaran | Pemasukan | Tabungan | Profil]
</nav>

<section id="tab-pengeluaran">          <!-- konten yang sudah ada dipindah ke sini -->
  ...existing left/right column...
</section>

<section id="tab-pemasukan" hidden>
  Income_Form + Income_List + Total Pemasukan
</section>

<section id="tab-tabungan" hidden>
  Savings_Form + Savings_List + Total Tabungan
</section>

<section id="tab-profil" hidden>
  Profile_Form
</section>
```

Header diperluas: `Balance_Display` lama diganti `Net_Balance_Display` yang menampilkan Saldo Bersih.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Nama Kosong atau Whitespace-Only Ditolak

*For any* string yang seluruhnya terdiri dari whitespace atau string kosong yang diberikan sebagai nama lengkap, nama/sumber pemasukan, atau nama tujuan tabungan, validator yang bersangkutan (`ProfileModule.validateFullName`, `IncomeModule.validateIncomeName`, `SavingsModule.validateGoalName`) SHALL mengembalikan sebuah `FieldError` (bukan `null`), dan daftar entri yang relevan SHALL tidak berubah.

**Validates: Requirements 8.4, 16.1, 16.2, 16.3**

---

### Property 2: Nomor Telepon dengan Karakter Invalid atau Terlalu Pendek Ditolak

*For any* string nomor telepon yang mengandung karakter selain digit (0–9), tanda tambah (+), spasi, atau tanda hubung (-), atau yang panjangnya kurang dari 7 karakter saat diisi, `ProfileModule.validatePhone()` SHALL mengembalikan sebuah `FieldError`.

**Validates: Requirements 8.5, 16.1**

---

### Property 3: Tanggal Lahir di Masa Depan Ditolak

*For any* string tanggal yang merepresentasikan tanggal di masa depan (lebih besar dari tanggal hari ini), `ProfileModule.validateBirthDate()` SHALL mengembalikan sebuah `FieldError`.

**Validates: Requirements 8.6**

---

### Property 4: Round-Trip Penyimpanan dan Pemuatan Profile

*For any* objek `Profile` yang valid (nama tidak kosong, telepon kosong atau berformat valid, tanggal lahir kosong atau tidak di masa depan), menyimpan objek tersebut ke localStorage via `StorageModule.saveProfile()` kemudian memuatnya kembali via `StorageModule.loadProfile()` SHALL menghasilkan objek yang ekuivalen secara struktural — setiap field `fullName`, `birthDate`, dan `phone` identik.

**Validates: Requirements 8.7, 8.9, 8.10**

---

### Property 5: Jumlah Pemasukan atau Tabungan di Luar Rentang Ditolak

*For any* nilai numerik di luar rentang \[0.01, 999999999.99\] yang diberikan sebagai jumlah, `IncomeModule.validateIncomeAmount()` dan `SavingsModule.validateSavingsAmount()` masing-masing SHALL mengembalikan sebuah `FieldError` (bukan `null`).

**Validates: Requirements 9.4, 11.4**

---

### Property 6: Penambahan Income/Savings Menambah Panjang Daftar

*For any* daftar `IncomeEntry[]` atau `SavingsEntry[]` yang valid dan satu entri baru yang valid, memanggil `addIncome(list, entry)` atau `addSavings(list, entry)` SHALL menghasilkan daftar baru dengan panjang bertambah tepat satu, dan entri baru tersebut terdapat dalam daftar hasil.

**Validates: Requirements 9.5, 11.6**

---

### Property 7: Penghapusan Income/Savings Mengurangi Panjang Daftar

*For any* daftar yang berisi setidaknya satu entri, memanggil `removeIncome(list, id)` atau `removeSavings(list, id)` SHALL menghasilkan daftar baru dengan panjang berkurang tepat satu, dan tidak ada entri dengan `id` tersebut dalam daftar hasil.

**Validates: Requirements 9.10, 11.11**

---

### Property 8: Total Pemasukan dan Total Tabungan Sama dengan Jumlah Semua Amount

*For any* daftar `IncomeEntry[]`, nilai yang dikembalikan oleh `calculateIncomeTotal(list)` SHALL sama dengan penjumlahan seluruh field `amount` dari setiap entri. *For any* daftar `SavingsEntry[]`, nilai yang dikembalikan oleh `calculateSavingsTotal(list)` SHALL sama dengan penjumlahan seluruh field `amount`. Jika daftar kosong, total SHALL sama dengan 0.

**Validates: Requirements 10.1, 10.4, 12.1, 12.4**

---

### Property 9: Saldo Bersih = Total Pemasukan − Total Pengeluaran − Total Tabungan

*For any* tiga nilai non-negatif `incomeTotal`, `expenseTotal`, dan `savingsTotal`, fungsi `calculateNetBalance(incomeList, expenseList, savingsList)` SHALL mengembalikan nilai yang sama dengan `calculateIncomeTotal(incomeList) - calculateTotal(expenseList) - calculateSavingsTotal(savingsList)`.

**Validates: Requirements 13.1**

---

### Property 10: Kode Warna Saldo Bersih Konsisten dengan Tanda Nilai

*For any* nilai Saldo Bersih yang dihitung, `UIModule.renderNetBalance()` SHALL menetapkan kelas CSS `.net-balance--positive` jika nilainya lebih besar dari nol, `.net-balance--negative` jika nilainya kurang dari nol, dan `.net-balance--zero` jika nilainya sama dengan nol.

**Validates: Requirements 13.4, 13.5, 13.6, 13.7**

---

### Property 11: Round-Trip Serialisasi localStorage untuk Income dan Savings

*For any* array `IncomeEntry[]` dengan panjang ≤ 1000, menyimpan array tersebut via `StorageModule.saveIncome()` kemudian memuatnya via `StorageModule.loadIncome()` SHALL menghasilkan array yang ekuivalen secara struktural. Hal yang sama berlaku untuk `SavingsEntry[]` via `saveIncome`/`loadSavings`.

**Validates: Requirements 14.1, 14.3**

---

### Property 12: Input Tidak Valid Tidak Mengubah State

*For any* state aplikasi yang ada (daftar Income, Savings, dan Expenses) dan data form Income atau Savings yang tidak valid (validasi gagal), operasi submit SHALL tidak mengubah daftar Income_Entry, Savings_Entry, total pemasukan, total tabungan, Saldo Bersih, maupun data di localStorage.

**Validates: Requirements 16.4, 9.2, 9.3, 11.2, 11.3**

---

## Error Handling

### Strategi Penanganan Error

| Skenario Error | Penanganan |
|---|---|
| Field wajib Income/Savings kosong | Validator mengembalikan `FieldError[]`; `UIModule.showIncomeErrors()` / `showSavingsErrors()` menampilkan pesan per field; entri **tidak** dibuat |
| Nama hanya whitespace | Sama seperti di atas; pesan: *"Nama tidak boleh kosong atau hanya spasi."* |
| Jumlah di luar rentang | `FieldError` spesifik pada field `amount`; entri tidak dibuat |
| Nama tujuan melebihi 100 karakter | `FieldError` spesifik; entri tidak dibuat |
| Field wajib profil (nama) kosong | `ProfileModule.validate()` mengembalikan error; profil tidak disimpan; nilai field lain dipertahankan |
| Nomor telepon tidak valid | `FieldError` pada field telepon; profil tidak disimpan |
| Tanggal lahir di masa depan | `FieldError` pada field tanggal lahir; profil tidak disimpan |
| localStorage penuh / izin ditolak | `StorageModule.save*()` melempar error; `AppController` menangkap dan memanggil `UIModule.showGlobalError()`; entri tetap tampil in-memory |
| Data income/savings di localStorage corrupt | `StorageModule.load*()` menangkap error JSON.parse, hapus data rusak via `clear*()`, kembalikan `[]` tanpa menampilkan error ke pengguna |
| Data profil di localStorage corrupt | `StorageModule.loadProfile()` mengembalikan `null`; `UIModule.renderProfileForm(null)` menampilkan form kosong tanpa error |
| Operasi tambah/hapus gagal | `Net_Balance_Display` mempertahankan nilai Saldo Bersih terakhir yang valid |

### Fokus Keyboard pada Error

Setelah validasi gagal, `AppController` memindahkan fokus keyboard ke field pertama yang memiliki error — konsisten dengan perilaku `handleSubmit` yang sudah ada untuk form pengeluaran.

### Pesan Error

Semua pesan error menggunakan Bahasa Indonesia yang jelas dan non-teknis, konsisten dengan pesan yang sudah ada di `app.js`.

---

## Testing Strategy

### Pendekatan Dual Testing

Strategi pengujian mengombinasikan dua pendekatan yang saling melengkapi, konsisten dengan strategi yang ada pada `expense-budget-visualizer`:

1. **Unit Tests (example-based)** — memverifikasi skenario konkret, edge case, dan kondisi error.
2. **Property-Based Tests (PBT)** — memverifikasi properti universal yang harus berlaku untuk semua input yang valid.

### Library yang Digunakan

- **Test runner**: [Vitest](https://vitest.dev/) — konsisten dengan proyek yang ada.
- **Property-based testing**: [fast-check](https://fast-check.io/) — konsisten dengan proyek yang ada.

### Unit Tests (Example-Based)

| Area | Skenario yang diuji |
|---|---|
| `ProfileModule.validate` | Input valid menghasilkan `{ valid: true }` |
| `ProfileModule.validate` | Nama kosong string menghasilkan error |
| `ProfileModule.validatePhone` | Telepon kosong (field opsional) diterima |
| `ProfileModule.validatePhone` | Telepon dengan 7 karakter valid diterima |
| `ProfileModule.validateBirthDate` | Tanggal kosong (field opsional) diterima |
| `ProfileModule.validateBirthDate` | Tanggal hari ini diterima |
| `IncomeModule.validate` | Semua field valid menghasilkan `{ valid: true }` |
| `IncomeModule.validate` | Jumlah tepat di batas (0.01 dan 999999999.99) diterima |
| `SavingsModule.validate` | Semua field valid menghasilkan `{ valid: true }` |
| `SavingsModule.validateGoalName` | Tepat 100 karakter diterima, 101 karakter ditolak |
| `StorageModule.loadIncome` | Data corrupt (non-JSON) dihapus dan mengembalikan `[]` |
| `StorageModule.loadSavings` | `localStorage` kosong mengembalikan `[]` |
| `StorageModule.loadProfile` | Data profil corrupt mengembalikan `null` |
| `calculateNetBalance` | Semua nilai 0 mengembalikan 0 |
| `calculateNetBalance` | Income > (Expenses + Savings) menghasilkan nilai positif |
| `calculateNetBalance` | Income < (Expenses + Savings) menghasilkan nilai negatif |
| `UIModule.renderNetBalance` | Nilai 0 menggunakan kelas `.net-balance--zero` |
| Income_List | Empty state: pesan "belum ada pemasukan" tampil |
| Savings_List | Empty state: pesan "belum ada tabungan" tampil |

### Property-Based Tests

Setiap property-based test dikonfigurasi dengan **minimum 100 iterasi** dan ditag dengan referensi ke properti desain.

#### PBT 1 — Nama Kosong atau Whitespace-Only Ditolak

```js
// Feature: profile-income-savings, Property 1: Nama Kosong atau Whitespace-Only Ditolak
fc.assert(fc.property(
  fc.stringMatching(/^\s*$/), // string whitespace-only atau kosong
  (invalidName) => {
    const profileError = ProfileModule.validateFullName(invalidName);
    const incomeError  = IncomeModule.validateIncomeName(invalidName);
    const savingsError = SavingsModule.validateGoalName(invalidName);
    return profileError !== null && incomeError !== null && savingsError !== null;
  }
), { numRuns: 100 });
```

#### PBT 2 — Nomor Telepon dengan Karakter Invalid Ditolak

```js
// Feature: profile-income-savings, Property 2: Nomor Telepon dengan Karakter Invalid atau Terlalu Pendek Ditolak
fc.assert(fc.property(
  fc.oneof(
    // String dengan karakter selain [0-9+\s-]
    fc.string({ minLength: 7 }).filter(s => /[^0-9+\s-]/.test(s)),
    // String valid tapi panjangnya kurang dari 7 (dan tidak kosong)
    fc.string({ minLength: 1, maxLength: 6 }).filter(s => /^[0-9+\s-]+$/.test(s) && s.length > 0)
  ),
  (invalidPhone) => {
    return ProfileModule.validatePhone(invalidPhone) !== null;
  }
), { numRuns: 100 });
```

#### PBT 3 — Tanggal Lahir di Masa Depan Ditolak

```js
// Feature: profile-income-savings, Property 3: Tanggal Lahir di Masa Depan Ditolak
fc.assert(fc.property(
  fc.date({ min: new Date(Date.now() + 86400000) }), // tanggal minimal besok
  (futureDate) => {
    const dateStr = futureDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return ProfileModule.validateBirthDate(dateStr) !== null;
  }
), { numRuns: 100 });
```

#### PBT 4 — Round-Trip Penyimpanan dan Pemuatan Profile

```js
// Feature: profile-income-savings, Property 4: Round-Trip Penyimpanan dan Pemuatan Profile
const arbitraryProfile = () => fc.record({
  fullName:  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  birthDate: fc.constant(''),
  phone:     fc.constant(''),
});

fc.assert(fc.property(
  arbitraryProfile(),
  (profile) => {
    StorageModule.saveProfile(profile);
    const loaded = StorageModule.loadProfile();
    return loaded !== null
      && loaded.fullName  === profile.fullName
      && loaded.birthDate === profile.birthDate
      && loaded.phone     === profile.phone;
  }
), { numRuns: 100 });
```

#### PBT 5 — Jumlah di Luar Rentang Ditolak

```js
// Feature: profile-income-savings, Property 5: Jumlah Pemasukan atau Tabungan di Luar Rentang Ditolak
fc.assert(fc.property(
  fc.oneof(
    fc.double({ max: 0.009 }),
    fc.double({ min: 999999999.991, max: Number.MAX_SAFE_INTEGER })
  ),
  (outOfRange) => {
    const incomeError  = IncomeModule.validateIncomeAmount(String(outOfRange));
    const savingsError = SavingsModule.validateSavingsAmount(String(outOfRange));
    return incomeError !== null && savingsError !== null;
  }
), { numRuns: 100 });
```

#### PBT 6 — Penambahan Income/Savings Menambah Panjang Daftar

```js
// Feature: profile-income-savings, Property 6: Penambahan Income/Savings Menambah Panjang Daftar
const arbitraryIncomeEntry = () => fc.record({
  id:        fc.uuid(),
  name:      fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  amount:    fc.double({ min: 0.01, max: 999999999.99 }),
  category:  fc.constantFrom('Gaji', 'Freelance', 'Bisnis', 'Lainnya'),
  createdAt: fc.date().map(d => d.toISOString()),
});

fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry(), { maxLength: 999 }),
  arbitraryIncomeEntry(),
  (list, newEntry) => {
    const result = addIncome(list, newEntry);
    return result.length === list.length + 1
      && result.some(e => e.id === newEntry.id);
  }
), { numRuns: 100 });
```

#### PBT 7 — Penghapusan Income/Savings Mengurangi Panjang Daftar

```js
// Feature: profile-income-savings, Property 7: Penghapusan Income/Savings Mengurangi Panjang Daftar
fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry(), { minLength: 1 }),
  (list) => {
    const target = list[0];
    const result = removeIncome(list, target.id);
    return result.length === list.length - 1
      && result.every(e => e.id !== target.id);
  }
), { numRuns: 100 });
```

#### PBT 8 — Total = Jumlah Semua Amount

```js
// Feature: profile-income-savings, Property 8: Total Pemasukan dan Total Tabungan Sama dengan Jumlah Semua Amount
fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry()),
  (list) => {
    const expected = list.reduce((sum, e) => sum + e.amount, 0);
    return Math.abs(calculateIncomeTotal(list) - expected) < 0.001;
  }
), { numRuns: 100 });
```

#### PBT 9 — Saldo Bersih = Income − Expenses − Savings

```js
// Feature: profile-income-savings, Property 9: Saldo Bersih = Total Pemasukan − Total Pengeluaran − Total Tabungan
fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry()),
  fc.array(arbitraryTransaction()),    // arbitraryTransaction() sudah ada
  fc.array(arbitraryIncomeEntry()),    // reuse untuk savings (same shape)
  (incomeList, expenseList, savingsList) => {
    const expected = calculateIncomeTotal(incomeList)
      - calculateTotal(expenseList)
      - calculateSavingsTotal(savingsList);
    return Math.abs(calculateNetBalance(incomeList, expenseList, savingsList) - expected) < 0.001;
  }
), { numRuns: 100 });
```

#### PBT 10 — Kode Warna Konsisten dengan Tanda Nilai

```js
// Feature: profile-income-savings, Property 10: Kode Warna Saldo Bersih Konsisten dengan Tanda Nilai
fc.assert(fc.property(
  fc.double({ min: -999999999, max: 999999999 }),
  (netBalance) => {
    const cls = getNetBalanceClass(netBalance); // fungsi murni yang diekstrak dari UIModule
    if (netBalance > 0) return cls === 'net-balance--positive';
    if (netBalance < 0) return cls === 'net-balance--negative';
    return cls === 'net-balance--zero';
  }
), { numRuns: 100 });
```

#### PBT 11 — Round-Trip Serialisasi localStorage

```js
// Feature: profile-income-savings, Property 11: Round-Trip Serialisasi localStorage untuk Income dan Savings
fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry(), { maxLength: 1000 }),
  (list) => {
    const serialized   = JSON.stringify(list);
    const deserialized = JSON.parse(serialized);
    return JSON.stringify(deserialized) === serialized;
  }
), { numRuns: 100 });
```

#### PBT 12 — Input Tidak Valid Tidak Mengubah State

```js
// Feature: profile-income-savings, Property 12: Input Tidak Valid Tidak Mengubah State
const arbitraryInvalidIncomeForm = () => fc.record({
  name:     fc.stringMatching(/^\s*$/), // whitespace-only — selalu invalid
  amount:   fc.string(),
  category: fc.string(),
});

fc.assert(fc.property(
  fc.array(arbitraryIncomeEntry()),
  arbitraryInvalidIncomeForm(),
  (existingList, invalidData) => {
    const result = IncomeModule.validate(invalidData);
    // Validasi gagal → list tidak berubah
    return !result.valid && existingList.length === existingList.length;
  }
), { numRuns: 100 });
```

### Catatan Implementasi

Fungsi-fungsi pure baru perlu diekspor via `module.exports` (menggunakan pengecekan `typeof module !== 'undefined'` yang sudah ada) agar dapat diuji secara independen:

```js
// Ditambahkan ke blok module.exports yang sudah ada:
module.exports = {
  // ...exports yang sudah ada...
  addIncome,
  removeIncome,
  calculateIncomeTotal,
  addSavings,
  removeSavings,
  calculateSavingsTotal,
  calculateNetBalance,
  ProfileModule,
  IncomeModule,
  SavingsModule,
};
```

Fungsi `getNetBalanceClass(netBalance)` — logika penentuan kelas CSS untuk `Net_Balance_Display` — harus diekstrak sebagai fungsi pure agar dapat diuji dengan PBT 10.
