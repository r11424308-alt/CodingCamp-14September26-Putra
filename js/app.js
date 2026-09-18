/**
 * Budget Tracker — js/app.js
 * Vanilla JavaScript, ES6+ (semantic)
 * Modules: Constants, Pure Functions, StorageModule,
 *          Validator, IncomeModule, SavingsModule, ProfileModule,
 *          UIModule, ChartModule, AppController
 */

'use strict';

/* ============================================================
   CONSTANTS & HELPERS
   ============================================================ */

const VALID_CATEGORIES        = ['Food', 'Transport', 'Fun'];
const VALID_INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Bisnis', 'Lainnya'];
const MAX_TRANSACTIONS        = 1000;

const CATEGORY_ICONS = { Food: '🍽️', Transport: '🚗', Fun: '🎉' };
const CATEGORY_COLORS = { Food: '#f59e0b', Transport: '#3b82f6', Fun: '#8b5cf6' };
const INCOME_CATEGORY_ICONS = { Gaji: '💼', Freelance: '💻', Bisnis: '🏢', Lainnya: '📦' };

const generateId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const getTodayDateString = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (value) => {
  const [intPart, decPart] = Number(value).toFixed(2).split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted},${decPart}`;
};

/* ============================================================
   PURE FUNCTIONS — Expenses
   ============================================================ */

const addTransaction     = (list, tx)  => [tx, ...list];
const removeTransaction  = (list, id)  => list.filter(t => t.id !== id);
const calculateTotal     = (list)      => list.reduce((sum, t) => sum + t.amount, 0);

const computeCategorySummaries = (list) => {
  const totals = Object.fromEntries(VALID_CATEGORIES.map(c => [c, 0]));
  list.forEach(t => { if (totals[t.category] !== undefined) totals[t.category] += t.amount; });
  const grand = VALID_CATEGORIES.reduce((s, c) => s + totals[c], 0);
  return VALID_CATEGORIES.map(c => ({
    category:   c,
    total:      totals[c],
    percentage: grand > 0 ? (totals[c] / grand) * 100 : 0,
  }));
};

/* ============================================================
   PURE FUNCTIONS — Income & Savings
   ============================================================ */

const addIncome            = (list, e)  => [e, ...list];
const removeIncome         = (list, id) => list.filter(e => e.id !== id);
const calculateIncomeTotal = (list)     => list.reduce((sum, e) => sum + e.amount, 0);

const addSavings            = (list, e)  => [e, ...list];
const removeSavings         = (list, id) => list.filter(e => e.id !== id);
const calculateSavingsTotal = (list)     => list.reduce((sum, e) => sum + e.amount, 0);

const calculateNetBalance = (incomeList, expenseList, savingsList) =>
  calculateIncomeTotal(incomeList) - calculateTotal(expenseList) - calculateSavingsTotal(savingsList);

const getNetBalanceClass = (netBalance) => {
  if (netBalance > 0) return 'net-balance--positive';
  if (netBalance < 0) return 'net-balance--negative';
  return 'net-balance--zero';
};

/* ============================================================
   STORAGE MODULE
   ============================================================ */

const StorageModule = (() => {
  const KEYS = {
    EXPENSE:  'expense_transactions',
    INCOME:   'income_entries',
    SAVINGS:  'savings_entries',
    PROFILE:  'user_profile',
  };

  const isAvailable = () => {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return true;
    } catch { return false; }
  };

  const loadList = (key) => {
    if (!isAvailable()) return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { localStorage.removeItem(key); return []; }
      return parsed;
    } catch { localStorage.removeItem(key); return []; }
  };

  const saveList = (key, list) => {
    if (list.length > MAX_TRANSACTIONS) throw new Error(`Batas maksimum ${MAX_TRANSACTIONS} entri telah tercapai.`);
    if (!isAvailable()) throw new Error('Browser Anda tidak mendukung Local Storage.');
    try { localStorage.setItem(key, JSON.stringify(list)); }
    catch { throw new Error('Penyimpanan penuh. Data tidak berhasil disimpan.'); }
  };

  return {
    load:         ()     => loadList(KEYS.EXPENSE),
    save:         (list) => saveList(KEYS.EXPENSE, list),
    clear:        ()     => { try { localStorage.removeItem(KEYS.EXPENSE); } catch {} },

    loadIncome:   ()     => loadList(KEYS.INCOME),
    saveIncome:   (list) => saveList(KEYS.INCOME, list),

    loadSavings:  ()     => loadList(KEYS.SAVINGS),
    saveSavings:  (list) => saveList(KEYS.SAVINGS, list),

    loadProfile:  () => {
      if (!isAvailable()) return null;
      try {
        const raw = localStorage.getItem(KEYS.PROFILE);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (typeof p !== 'object' || !p?.fullName) { localStorage.removeItem(KEYS.PROFILE); return null; }
        return p;
      } catch { localStorage.removeItem(KEYS.PROFILE); return null; }
    },

    saveProfile: (profile) => {
      if (!isAvailable()) throw new Error('Browser Anda tidak mendukung Local Storage.');
      try { localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile)); }
      catch { throw new Error('Penyimpanan penuh. Profil tidak berhasil disimpan.'); }
    },
  };
})();

/* ============================================================
   VALIDATOR (Expenses)
   ============================================================ */

const Validator = (() => {
  const MIN_AMOUNT = 0.01;
  const MAX_AMOUNT = 999999999.99;

  const validateName = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0)
      return { field: 'name', message: 'Nama item tidak boleh kosong atau hanya spasi.' };
    if (name.trim().length > 100)
      return { field: 'name', message: 'Nama item tidak boleh melebihi 100 karakter.' };
    return null;
  };

  const validateAmount = (raw) => {
    if (!raw || raw.trim() === '') return { field: 'amount', message: 'Jumlah uang tidak boleh kosong.' };
    const v = parseFloat(raw);
    if (isNaN(v)) return { field: 'amount', message: 'Jumlah uang harus berupa angka yang valid.' };
    if (v < MIN_AMOUNT || v > MAX_AMOUNT)
      return { field: 'amount', message: 'Jumlah harus antara Rp 0,01 dan Rp 999.999.999,99.' };
    return null;
  };

  const validateCategory = (cat) =>
    (!cat || !VALID_CATEGORIES.includes(cat))
      ? { field: 'category', message: 'Pilih kategori yang valid: Food, Transport, atau Fun.' }
      : null;

  const validate = ({ name, amount, category }) => {
    const errors = [validateName(name), validateAmount(amount), validateCategory(category)].filter(Boolean);
    return errors.length ? { valid: false, errors } : { valid: true, errors: [] };
  };

  return { validate, validateName, validateAmount, validateCategory };
})();

/* ============================================================
   INCOME MODULE
   ============================================================ */

const IncomeModule = (() => {
  const validateIncomeName = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0)
      return { field: 'name', message: 'Sumber pemasukan tidak boleh kosong atau hanya spasi.' };
    if (name.trim().length > 100)
      return { field: 'name', message: 'Sumber pemasukan tidak boleh melebihi 100 karakter.' };
    return null;
  };

  const validateIncomeAmount = (raw) => {
    if (!raw || raw.trim() === '') return { field: 'amount', message: 'Jumlah pemasukan tidak boleh kosong.' };
    const v = parseFloat(raw);
    if (isNaN(v)) return { field: 'amount', message: 'Jumlah harus berupa angka yang valid.' };
    if (v < 0.01 || v > 999999999.99)
      return { field: 'amount', message: 'Jumlah harus antara Rp 0,01 dan Rp 999.999.999,99.' };
    return null;
  };

  const validateIncomeCategory = (cat) =>
    (!cat || !VALID_INCOME_CATEGORIES.includes(cat))
      ? { field: 'category', message: 'Pilih kategori: Gaji, Freelance, Bisnis, atau Lainnya.' }
      : null;

  const validate = ({ name, amount, category }) => {
    const errors = [validateIncomeName(name), validateIncomeAmount(amount), validateIncomeCategory(category)].filter(Boolean);
    return errors.length ? { valid: false, errors } : { valid: true, errors: [] };
  };

  return { validate, validateIncomeName, validateIncomeAmount, validateIncomeCategory };
})();

/* ============================================================
   SAVINGS MODULE
   ============================================================ */

const SavingsModule = (() => {
  const validateGoalName = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0)
      return { field: 'goalName', message: 'Nama tujuan tidak boleh kosong atau hanya spasi.' };
    if (name.trim().length > 100)
      return { field: 'goalName', message: 'Nama tujuan tidak boleh melebihi 100 karakter.' };
    return null;
  };

  const validateSavingsAmount = (raw) => {
    if (!raw || raw.trim() === '') return { field: 'amount', message: 'Jumlah tabungan tidak boleh kosong.' };
    const v = parseFloat(raw);
    if (isNaN(v)) return { field: 'amount', message: 'Jumlah harus berupa angka yang valid.' };
    if (v < 0.01 || v > 999999999.99)
      return { field: 'amount', message: 'Jumlah harus antara Rp 0,01 dan Rp 999.999.999,99.' };
    return null;
  };

  const validateSavingsDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '')
      return { field: 'date', message: 'Tanggal tabungan wajib diisi.' };
    if (isNaN(new Date(dateStr).getTime()))
      return { field: 'date', message: 'Tanggal tabungan tidak valid.' };
    return null;
  };

  const validate = ({ goalName, amount, date }) => {
    const errors = [validateGoalName(goalName), validateSavingsAmount(amount), validateSavingsDate(date)].filter(Boolean);
    return errors.length ? { valid: false, errors } : { valid: true, errors: [] };
  };

  return { validate, validateGoalName, validateSavingsAmount, validateSavingsDate };
})();

/* ============================================================
   PROFILE MODULE
   ============================================================ */

const ProfileModule = (() => {
  const validateFullName = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0)
      return { field: 'fullName', message: 'Nama lengkap tidak boleh kosong atau hanya spasi.' };
    if (name.trim().length > 100)
      return { field: 'fullName', message: 'Nama lengkap tidak boleh melebihi 100 karakter.' };
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return null; // optional
    const cleaned = phone.trim();
    if (!/^[0-9+\s\-]+$/.test(cleaned))
      return { field: 'phone', message: 'Nomor telepon hanya boleh berisi angka, +, spasi, atau tanda hubung.' };
    if (cleaned.length < 7 || cleaned.length > 20)
      return { field: 'phone', message: 'Nomor telepon harus antara 7 hingga 20 karakter.' };
    return null;
  };

  const validateBirthDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null; // optional
    const inputDate = new Date(dateStr);
    if (isNaN(inputDate.getTime())) return { field: 'birthDate', message: 'Tanggal lahir tidak valid.' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (inputDate > today) return { field: 'birthDate', message: 'Tanggal lahir tidak boleh melebihi hari ini.' };
    return null;
  };

  const validate = ({ fullName, phone, birthDate }) => {
    const errors = [validateFullName(fullName), validatePhone(phone), validateBirthDate(birthDate)].filter(Boolean);
    return errors.length ? { valid: false, errors } : { valid: true, errors: [] };
  };

  return { validate, validateFullName, validatePhone, validateBirthDate };
})();

/* ============================================================
   UI MODULE
   ============================================================ */

const UIModule = (() => {
  const el = {};

  /* ── DOM resolution ──────────────────────────────────────── */
  const init = () => {
    el.netBalance     = document.getElementById('net-balance-display');
    el.txList         = document.getElementById('transaction-list');
    el.txForm         = document.getElementById('transaction-form');
    el.inputName      = document.getElementById('input-name');
    el.inputAmount    = document.getElementById('input-amount');
    el.inputCategory  = document.getElementById('input-category');
    el.errName        = document.getElementById('error-name');
    el.errAmount      = document.getElementById('error-amount');
    el.errCategory    = document.getElementById('error-category');
    el.globalBanner   = document.getElementById('global-error-banner');
    el.globalMsg      = document.getElementById('global-error-message');

    el.incomeForm     = document.getElementById('income-form');
    el.incomeList     = document.getElementById('income-list');
    el.incomeName     = document.getElementById('income-name');
    el.incomeAmount   = document.getElementById('income-amount');
    el.incomeCategory = document.getElementById('income-category');
    el.errIncomeName  = document.getElementById('error-income-name');
    el.errIncomeAmt   = document.getElementById('error-income-amount');
    el.errIncomeCat   = document.getElementById('error-income-category');
    el.incomeTotalEl  = document.getElementById('income-total-display');

    el.savingsForm    = document.getElementById('savings-form');
    el.savingsList    = document.getElementById('savings-list');
    el.savingsGoal    = document.getElementById('savings-goal-name');
    el.savingsAmount  = document.getElementById('savings-amount');
    el.savingsDate    = document.getElementById('savings-date');
    el.errSavingsGoal = document.getElementById('error-savings-goal-name');
    el.errSavingsAmt  = document.getElementById('error-savings-amount');
    el.errSavingsDate = document.getElementById('error-savings-date');
    el.savingsTotalEl = document.getElementById('savings-total-display');

    el.profileForm    = document.getElementById('profile-form');
    el.profileName    = document.getElementById('profile-full-name');
    el.profileBirth   = document.getElementById('profile-birth-date');
    el.profilePhone   = document.getElementById('profile-phone');
    el.errProfName    = document.getElementById('error-profile-full-name');
    el.errProfBirth   = document.getElementById('error-profile-birth-date');
    el.errProfPhone   = document.getElementById('error-profile-phone');
    el.profileSuccess = document.getElementById('profile-success-message');

    el.tabBtns        = document.querySelectorAll('.tab-btn');
    el.tabPanels      = document.querySelectorAll('[role="tabpanel"]');
  };

  /* ── Tab switching ──────────────────────────────────────── */
  const switchTab = (tabName) => {
    el.tabPanels.forEach(panel => { panel.hidden = panel.id !== `tab-${tabName}`; });
    el.tabBtns.forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.classList.toggle('tab-btn--active', active);
    });
  };

  /* ── Net Balance ──────────────────────────────────────────── */
  const renderNetBalance = (netBalance) => {
    if (!el.netBalance) return;
    const absVal = Math.abs(netBalance);
    el.netBalance.textContent = netBalance < 0 ? `−${formatCurrency(absVal)}` : formatCurrency(absVal);
    el.netBalance.classList.remove('net-balance--positive', 'net-balance--negative', 'net-balance--zero');
    el.netBalance.classList.add(getNetBalanceClass(netBalance));
  };

  /* ── Expense list ────────────────────────────────────────── */
  const renderList = (transactions) => {
    if (!el.txList) return;
    if (!transactions || transactions.length === 0) {
      el.txList.innerHTML = `
        <div class="list-empty" role="listitem">
          <span class="list-empty-icon">🧾</span>
          <p class="list-empty-text">Belum ada transaksi yang dicatat.</p>
        </div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    transactions.forEach(t => {
      const icon = CATEGORY_ICONS[t.category] || '❓';
      const item = document.createElement('div');
      item.className = 'transaction-item';
      item.dataset.category = t.category;
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <span class="transaction-category-icon" aria-hidden="true">${icon}</span>
        <div class="transaction-details">
          <div class="transaction-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>
          <div class="transaction-meta">${escapeHtml(t.category)}</div>
        </div>
        <span class="transaction-amount">${formatCurrency(t.amount)}</span>
        <button class="btn-delete" data-id="${escapeHtml(t.id)}"
          aria-label="Hapus transaksi ${escapeHtml(t.name)}" title="Hapus">🗑</button>`;
      fragment.appendChild(item);
    });
    el.txList.innerHTML = '';
    el.txList.appendChild(fragment);
  };

  const renderBalance = (total) => {
    // kept for backward compat — now routes to renderNetBalance is done separately
    const balEl = document.getElementById('balance-display');
    if (balEl) balEl.textContent = formatCurrency(total);
  };

  const showErrors = (errors) => {
    clearErrors();
    const map = {
      name:     { span: el.errName,     input: el.inputName },
      amount:   { span: el.errAmount,   input: el.inputAmount },
      category: { span: el.errCategory, input: el.inputCategory },
    };
    errors.forEach(err => {
      const m = map[err.field];
      if (m) { if (m.span) m.span.textContent = err.message; if (m.input) m.input.classList.add('input-error'); }
    });
  };

  const clearErrors = () => {
    [el.errName, el.errAmount, el.errCategory].forEach(e => { if (e) e.textContent = ''; });
    [el.inputName, el.inputAmount, el.inputCategory].forEach(e => { if (e) e.classList.remove('input-error'); });
  };

  const resetForm = () => {
    if (el.txForm) el.txForm.reset();
    clearErrors();
    if (el.inputName) el.inputName.focus();
  };

  const showGlobalError = (message) => {
    if (!el.globalBanner) return;
    if (el.globalMsg) el.globalMsg.textContent = message;
    el.globalBanner.hidden = false;
  };

  const hideGlobalError = () => {
    if (el.globalBanner) el.globalBanner.hidden = true;
    if (el.globalMsg) el.globalMsg.textContent = '';
  };

  /* ── Income list ─────────────────────────────────────────── */
  const renderIncomeList = (list) => {
    if (!el.incomeList) return;
    if (!list || list.length === 0) {
      el.incomeList.innerHTML = `
        <div class="list-empty" role="listitem">
          <span class="list-empty-icon">💵</span>
          <p class="list-empty-text">Belum ada pemasukan yang dicatat.</p>
        </div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach(e => {
      const icon = INCOME_CATEGORY_ICONS[e.category] || '💰';
      const item = document.createElement('div');
      item.className = 'income-item';
      item.dataset.category = e.category;
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <span class="transaction-category-icon" aria-hidden="true">${icon}</span>
        <div class="transaction-details">
          <div class="transaction-name" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</div>
          <div class="transaction-meta">${escapeHtml(e.category)}</div>
        </div>
        <span class="income-amount">${formatCurrency(e.amount)}</span>
        <button class="btn-delete" data-id="${escapeHtml(e.id)}"
          aria-label="Hapus pemasukan ${escapeHtml(e.name)}">🗑</button>`;
      fragment.appendChild(item);
    });
    el.incomeList.innerHTML = '';
    el.incomeList.appendChild(fragment);
  };

  const renderIncomeTotals = (total) => {
    if (el.incomeTotalEl) el.incomeTotalEl.textContent = formatCurrency(total);
  };

  const showIncomeErrors = (errors) => {
    clearIncomeErrors();
    const map = {
      name:     { span: el.errIncomeName, input: el.incomeName },
      amount:   { span: el.errIncomeAmt,  input: el.incomeAmount },
      category: { span: el.errIncomeCat,  input: el.incomeCategory },
    };
    errors.forEach(err => {
      const m = map[err.field];
      if (m) { if (m.span) m.span.textContent = err.message; if (m.input) m.input.classList.add('input-error'); }
    });
  };

  const clearIncomeErrors = () => {
    [el.errIncomeName, el.errIncomeAmt, el.errIncomeCat].forEach(e => { if (e) e.textContent = ''; });
    [el.incomeName, el.incomeAmount, el.incomeCategory].forEach(e => { if (e) e.classList.remove('input-error'); });
  };

  const resetIncomeForm = () => {
    if (el.incomeForm) el.incomeForm.reset();
    clearIncomeErrors();
    if (el.incomeName) el.incomeName.focus();
  };

  /* ── Savings list ────────────────────────────────────────── */
  const renderSavingsList = (list) => {
    if (!el.savingsList) return;
    if (!list || list.length === 0) {
      el.savingsList.innerHTML = `
        <div class="list-empty" role="listitem">
          <span class="list-empty-icon">🏦</span>
          <p class="list-empty-text">Belum ada tabungan yang dicatat.</p>
        </div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach(e => {
      const item = document.createElement('div');
      item.className = 'savings-item';
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <span class="transaction-category-icon" aria-hidden="true">🏦</span>
        <div class="transaction-details">
          <div class="transaction-name" title="${escapeHtml(e.goalName)}">${escapeHtml(e.goalName)}</div>
          <div class="transaction-meta">${formatDateDisplay(e.date)}</div>
        </div>
        <span class="savings-amount">${formatCurrency(e.amount)}</span>
        <button class="btn-delete" data-id="${escapeHtml(e.id)}"
          aria-label="Hapus tabungan ${escapeHtml(e.goalName)}">🗑</button>`;
      fragment.appendChild(item);
    });
    el.savingsList.innerHTML = '';
    el.savingsList.appendChild(fragment);
  };

  const renderSavingsTotals = (total) => {
    if (el.savingsTotalEl) el.savingsTotalEl.textContent = formatCurrency(total);
  };

  const showSavingsErrors = (errors) => {
    clearSavingsErrors();
    const map = {
      goalName: { span: el.errSavingsGoal, input: el.savingsGoal },
      amount:   { span: el.errSavingsAmt,  input: el.savingsAmount },
      date:     { span: el.errSavingsDate, input: el.savingsDate },
    };
    errors.forEach(err => {
      const m = map[err.field];
      if (m) { if (m.span) m.span.textContent = err.message; if (m.input) m.input.classList.add('input-error'); }
    });
  };

  const clearSavingsErrors = () => {
    [el.errSavingsGoal, el.errSavingsAmt, el.errSavingsDate].forEach(e => { if (e) e.textContent = ''; });
    [el.savingsGoal, el.savingsAmount, el.savingsDate].forEach(e => { if (e) e.classList.remove('input-error'); });
  };

  const resetSavingsForm = () => {
    if (el.savingsGoal)   el.savingsGoal.value   = '';
    if (el.savingsAmount) el.savingsAmount.value  = '';
    if (el.savingsDate)   el.savingsDate.value    = getTodayDateString();
    clearSavingsErrors();
    if (el.savingsGoal) el.savingsGoal.focus();
  };

  /* ── Profile form ────────────────────────────────────────── */
  const renderProfileForm = (profile) => {
    if (el.profileName)  el.profileName.value  = profile?.fullName  || '';
    if (el.profileBirth) el.profileBirth.value = profile?.birthDate || '';
    if (el.profilePhone) el.profilePhone.value = profile?.phone     || '';
  };

  let _profileTimer = null;
  const showProfileSuccess = (msg) => {
    if (!el.profileSuccess) return;
    el.profileSuccess.textContent = msg || 'Profil berhasil disimpan! ✅';
    el.profileSuccess.removeAttribute('hidden');
    if (_profileTimer) clearTimeout(_profileTimer);
    _profileTimer = setTimeout(() => { el.profileSuccess.setAttribute('hidden', ''); }, 2000);
  };

  const showProfileErrors = (errors) => {
    clearProfileErrors();
    const map = {
      fullName:  { span: el.errProfName,  input: el.profileName },
      phone:     { span: el.errProfPhone, input: el.profilePhone },
      birthDate: { span: el.errProfBirth, input: el.profileBirth },
    };
    errors.forEach(err => {
      const m = map[err.field];
      if (m) { if (m.span) m.span.textContent = err.message; if (m.input) m.input.classList.add('input-error'); }
    });
  };

  const clearProfileErrors = () => {
    [el.errProfName, el.errProfBirth, el.errProfPhone].forEach(e => { if (e) e.textContent = ''; });
    [el.profileName, el.profileBirth, el.profilePhone].forEach(e => { if (e) e.classList.remove('input-error'); });
  };

  return {
    init, switchTab,
    renderNetBalance,
    renderList, renderBalance, showErrors, clearErrors, resetForm, showGlobalError, hideGlobalError,
    renderIncomeList, renderIncomeTotals, showIncomeErrors, clearIncomeErrors, resetIncomeForm,
    renderSavingsList, renderSavingsTotals, showSavingsErrors, clearSavingsErrors, resetSavingsForm,
    renderProfileForm, showProfileSuccess, showProfileErrors, clearProfileErrors,
    formatCurrency,
  };
})();

/* ============================================================
   CHART MODULE
   ============================================================ */

const ChartModule = (() => {
  let _chart     = null;
  let _canvasEl  = null;
  let _emptyEl   = null;

  const init = (canvasId) => {
    _canvasEl = document.getElementById(canvasId);
    _emptyEl  = document.getElementById('chart-empty-state');
    if (!_canvasEl) return;
    if (typeof Chart === 'undefined') {
      if (_emptyEl) { _emptyEl.querySelector('p').textContent = 'Library grafik tidak berhasil dimuat.'; _emptyEl.classList.add('visible'); }
      if (_canvasEl) _canvasEl.style.display = 'none';
      return;
    }
    try {
      _chart = new Chart(_canvasEl, {
        type: 'pie',
        data: {
          labels: VALID_CATEGORIES.map(c => `${CATEGORY_ICONS[c]} ${c}`),
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: VALID_CATEGORIES.map(c => CATEGORY_COLORS[c]),
            borderColor: '#1e293b', borderWidth: 2, hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                  return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                },
              },
              backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8',
              borderColor: '#334155', borderWidth: 1,
            },
          },
          animation: { duration: 300 },
        },
      });
    } catch (e) {
      if (_emptyEl) { _emptyEl.querySelector('p').textContent = `Grafik tidak dapat ditampilkan: ${e.message}`; _emptyEl.classList.add('visible'); }
    }
  };

  const update = (transactions) => {
    const summaries  = computeCategorySummaries(transactions);
    const grandTotal = calculateTotal(transactions);
    if (grandTotal === 0) {
      if (_canvasEl) _canvasEl.style.display = 'none';
      if (_emptyEl)  _emptyEl.classList.add('visible');
      return;
    }
    if (_canvasEl) _canvasEl.style.display = '';
    if (_emptyEl)  _emptyEl.classList.remove('visible');
    if (!_chart) return;
    _chart.data.datasets[0].data = summaries.map(s => s.total);
    _chart.data.labels = summaries.map(s => `${CATEGORY_ICONS[s.category]} ${s.category} ${s.percentage.toFixed(1)}%`);
    _chart.update();
  };

  return { init, update };
})();

/* ============================================================
   APP CONTROLLER
   ============================================================ */

const AppController = (() => {
  let _transactions = [];
  let _incomeList   = [];
  let _savingsList  = [];

  /* ── Net balance helper ──────────────────────────────────── */
  const _updateNetBalance = () => {
    UIModule.renderNetBalance(calculateNetBalance(_incomeList, _transactions, _savingsList));
  };

  /* ── Init ────────────────────────────────────────────────── */
  const init = () => {
    UIModule.init();

    // Close global error banner
    const closeBtn = document.getElementById('global-error-close');
    if (closeBtn) closeBtn.addEventListener('click', UIModule.hideGlobalError);

    // Check browser support
    if (typeof localStorage === 'undefined') {
      UIModule.showGlobalError('Browser Anda tidak mendukung Local Storage. Gunakan Chrome, Firefox, Edge, atau Safari terbaru.');
    }

    // Load data
    _transactions = StorageModule.load();
    _incomeList   = StorageModule.loadIncome();
    _savingsList  = StorageModule.loadSavings();
    const profile = StorageModule.loadProfile();

    // Set savings date default
    const savingsDateEl = document.getElementById('savings-date');
    if (savingsDateEl && !savingsDateEl.value) savingsDateEl.value = getTodayDateString();

    // Render everything
    UIModule.renderList(_transactions);
    UIModule.renderIncomeList(_incomeList);
    UIModule.renderIncomeTotals(calculateIncomeTotal(_incomeList));
    UIModule.renderSavingsList(_savingsList);
    UIModule.renderSavingsTotals(calculateSavingsTotal(_savingsList));
    UIModule.renderProfileForm(profile);
    _updateNetBalance();

    // Init chart
    ChartModule.init('expense-chart');
    ChartModule.update(_transactions);

    // Tab navigation
    document.querySelector('.tab-nav')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (btn?.dataset.tab) UIModule.switchTab(btn.dataset.tab);
    });

    // Expense form
    document.getElementById('transaction-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('transaction-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete');
      if (btn?.dataset.id) handleDelete(btn.dataset.id);
    });

    // Income form
    document.getElementById('income-form')?.addEventListener('submit', handleIncomeSubmit);
    document.getElementById('income-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete');
      if (btn?.dataset.id) handleIncomeDelete(btn.dataset.id);
    });

    // Savings form
    document.getElementById('savings-form')?.addEventListener('submit', handleSavingsSubmit);
    document.getElementById('savings-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete');
      if (btn?.dataset.id) handleSavingsDelete(btn.dataset.id);
    });

    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileSave);
  };

  /* ── Expense handlers ────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    UIModule.clearErrors();
    UIModule.hideGlobalError();

    const formData = {
      name:     document.getElementById('input-name')?.value     ?? '',
      amount:   document.getElementById('input-amount')?.value   ?? '',
      category: document.getElementById('input-category')?.value ?? '',
    };

    const result = Validator.validate(formData);
    if (!result.valid) {
      UIModule.showErrors(result.errors);
      const focusMap = { name: 'input-name', amount: 'input-amount', category: 'input-category' };
      document.getElementById(focusMap[result.errors[0].field])?.focus();
      return;
    }

    const newTx = { id: generateId(), name: formData.name.trim(), amount: parseFloat(formData.amount), category: formData.category, createdAt: new Date().toISOString() };
    _transactions = addTransaction(_transactions, newTx);

    try { StorageModule.save(_transactions); }
    catch (err) { UIModule.showGlobalError(err.message); }

    UIModule.renderList(_transactions);
    ChartModule.update(_transactions);
    _updateNetBalance();
    UIModule.resetForm();
  };

  const handleDelete = (id) => {
    _transactions = removeTransaction(_transactions, id);
    try { StorageModule.save(_transactions); }
    catch (err) { UIModule.showGlobalError(err.message); }
    UIModule.renderList(_transactions);
    ChartModule.update(_transactions);
    _updateNetBalance();
  };

  /* ── Income handlers ─────────────────────────────────────── */
  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    UIModule.clearIncomeErrors();

    const formData = {
      name:     document.getElementById('income-name')?.value     ?? '',
      amount:   document.getElementById('income-amount')?.value   ?? '',
      category: document.getElementById('income-category')?.value ?? '',
    };

    const result = IncomeModule.validate(formData);
    if (!result.valid) {
      UIModule.showIncomeErrors(result.errors);
      const focusMap = { name: 'income-name', amount: 'income-amount', category: 'income-category' };
      document.getElementById(focusMap[result.errors[0].field])?.focus();
      return;
    }

    const newEntry = { id: generateId(), name: formData.name.trim(), amount: parseFloat(formData.amount), category: formData.category, createdAt: new Date().toISOString() };
    _incomeList = addIncome(_incomeList, newEntry);

    try { StorageModule.saveIncome(_incomeList); }
    catch (err) { UIModule.showGlobalError(err.message); }

    UIModule.renderIncomeList(_incomeList);
    UIModule.renderIncomeTotals(calculateIncomeTotal(_incomeList));
    _updateNetBalance();
    UIModule.resetIncomeForm();
  };

  const handleIncomeDelete = (id) => {
    _incomeList = removeIncome(_incomeList, id);
    try { StorageModule.saveIncome(_incomeList); }
    catch (err) { UIModule.showGlobalError(err.message); }
    UIModule.renderIncomeList(_incomeList);
    UIModule.renderIncomeTotals(calculateIncomeTotal(_incomeList));
    _updateNetBalance();
  };

  /* ── Savings handlers ────────────────────────────────────── */
  const handleSavingsSubmit = (e) => {
    e.preventDefault();
    UIModule.clearSavingsErrors();

    const formData = {
      goalName: document.getElementById('savings-goal-name')?.value ?? '',
      amount:   document.getElementById('savings-amount')?.value    ?? '',
      date:     document.getElementById('savings-date')?.value      ?? '',
    };

    const result = SavingsModule.validate(formData);
    if (!result.valid) {
      UIModule.showSavingsErrors(result.errors);
      const focusMap = { goalName: 'savings-goal-name', amount: 'savings-amount', date: 'savings-date' };
      document.getElementById(focusMap[result.errors[0].field])?.focus();
      return;
    }

    const newEntry = { id: generateId(), goalName: formData.goalName.trim(), amount: parseFloat(formData.amount), date: formData.date, createdAt: new Date().toISOString() };
    _savingsList = addSavings(_savingsList, newEntry);

    try { StorageModule.saveSavings(_savingsList); }
    catch (err) { UIModule.showGlobalError(err.message); }

    UIModule.renderSavingsList(_savingsList);
    UIModule.renderSavingsTotals(calculateSavingsTotal(_savingsList));
    _updateNetBalance();
    UIModule.resetSavingsForm();
  };

  const handleSavingsDelete = (id) => {
    _savingsList = removeSavings(_savingsList, id);
    try { StorageModule.saveSavings(_savingsList); }
    catch (err) { UIModule.showGlobalError(err.message); }
    UIModule.renderSavingsList(_savingsList);
    UIModule.renderSavingsTotals(calculateSavingsTotal(_savingsList));
    _updateNetBalance();
  };

  /* ── Profile handler ─────────────────────────────────────── */
  const handleProfileSave = (e) => {
    e.preventDefault();
    UIModule.clearProfileErrors();

    const formData = {
      fullName:  document.getElementById('profile-full-name')?.value  ?? '',
      birthDate: document.getElementById('profile-birth-date')?.value ?? '',
      phone:     document.getElementById('profile-phone')?.value      ?? '',
    };

    const result = ProfileModule.validate(formData);
    if (!result.valid) {
      UIModule.showProfileErrors(result.errors);
      const focusMap = { fullName: 'profile-full-name', birthDate: 'profile-birth-date', phone: 'profile-phone' };
      document.getElementById(focusMap[result.errors[0].field])?.focus();
      return;
    }

    const profile = { fullName: formData.fullName.trim(), birthDate: formData.birthDate, phone: formData.phone.trim() };
    try {
      StorageModule.saveProfile(profile);
      UIModule.showProfileSuccess('Profil berhasil disimpan! ✅');
    } catch (err) {
      UIModule.showGlobalError(err.message);
    }
  };

  return { init, handleSubmit, handleDelete, handleIncomeSubmit, handleIncomeDelete, handleSavingsSubmit, handleSavingsDelete, handleProfileSave };
})();

/* ============================================================
   BOOTSTRAP — single DOMContentLoaded at the bottom
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => AppController.init());

/* ============================================================
   CommonJS export (Node / Vitest)
   ============================================================ */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VALID_CATEGORIES, VALID_INCOME_CATEGORIES, MAX_TRANSACTIONS,
    generateId, getTodayDateString, formatDateDisplay, formatCurrency,
    addTransaction, removeTransaction, calculateTotal, computeCategorySummaries,
    addIncome, removeIncome, calculateIncomeTotal,
    addSavings, removeSavings, calculateSavingsTotal,
    calculateNetBalance, getNetBalanceClass,
    Validator, StorageModule, UIModule, ProfileModule, IncomeModule, SavingsModule,
  };
}
