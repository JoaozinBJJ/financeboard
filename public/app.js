'use strict';

// ── CONSTANTS ─────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Moradia':      '#378ADD', 'Alimentação':  '#1A7A3C',
  'Transporte':   '#854F0B', 'Saúde':        '#534AB7',
  'Lazer':        '#0F6E56', 'Educação':     '#D85A30',
  'Salário':      '#1A7A3C', 'Freelance':    '#378ADD',
  'Investimentos':'#534AB7', 'Outros':       '#7A776E',
};
const CATEGORY_BG = {
  'Moradia':'#E6F1FB','Alimentação':'#EAF3DE','Transporte':'#FAEEDA',
  'Saúde':'#EEEDFE','Lazer':'#E1F5EE','Educação':'#FAECE7',
  'Salário':'#EAF3DE','Freelance':'#E6F1FB','Investimentos':'#EEEDFE','Outros':'#F1EFE8',
};
const CATEGORY_ICONS = {
  'Moradia':'🏠','Alimentação':'🛒','Transporte':'🚗','Saúde':'💊',
  'Lazer':'🎮','Educação':'📚','Salário':'💼','Freelance':'💻',
  'Investimentos':'📈','Outros':'📦',
};

// ── STATE ─────────────────────────────────────────────────
let transactions = [];
let currentFilter = 'all';
let editingId = null;
let selectedType = 'income';

// ── AUTH ──────────────────────────────────────────────────
const API = window.location.origin;

function getToken() { return localStorage.getItem('fb-token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('fb-user')); } catch { return null; }
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}

function handleUnauth() {
  localStorage.removeItem('fb-token');
  localStorage.removeItem('fb-user');
  window.location.href = '/login';
}

// Guard: redirect to login if no token
(function() {
  if (!getToken()) window.location.href = '/login';
})();

// ── API CALLS ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (res.status === 401) { handleUnauth(); return null; }
  return res;
}

async function loadTransactions() {
  try {
    const res = await apiFetch('/api/transactions');
    if (!res) return;
    transactions = await res.json();
  } catch (err) {
    console.error('Erro ao carregar transações:', err);
    transactions = [];
  }
}

async function apiCreate(data) {
  const res = await apiFetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res || !res.ok) throw new Error('Erro ao criar transação');
  return res.json();
}

async function apiUpdate(id, data) {
  const res = await apiFetch(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!res || !res.ok) throw new Error('Erro ao atualizar transação');
  return res.json();
}

async function apiDelete(id) {
  const res = await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
  if (!res || !res.ok) throw new Error('Erro ao excluir transação');
}

// ── UTILS ─────────────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtCurrency(n) { return 'R$ ' + fmt(Math.abs(n)); }

function fmtDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

// ── CARDS ─────────────────────────────────────────────────
function updateCards() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  document.getElementById('val-balance').textContent = fmtCurrency(balance);
  document.getElementById('val-income').textContent  = fmtCurrency(income);
  document.getElementById('val-expense').textContent = fmtCurrency(expense);
  document.getElementById('val-savings').textContent = savingsRate + '%';

  const balBadge = document.getElementById('badge-balance');
  if (balance > 0) { balBadge.textContent = 'positivo'; balBadge.className = 'card__badge card__badge--up'; }
  else if (balance < 0) { balBadge.textContent = 'negativo'; balBadge.className = 'card__badge card__badge--down'; }
  else { balBadge.textContent = 'zerado'; balBadge.className = 'card__badge card__badge--zero'; }

  const incomeCount  = transactions.filter(t => t.type === 'income').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;
  document.getElementById('badge-income').textContent  = incomeCount + (incomeCount === 1 ? ' entrada' : ' entradas');
  document.getElementById('badge-expense').textContent = expenseCount + (expenseCount === 1 ? ' saída' : ' saídas');

  const savBadge = document.getElementById('badge-savings');
  if (savingsRate >= 20) { savBadge.textContent = 'ótimo!'; savBadge.className = 'card__badge card__badge--up'; }
  else if (savingsRate > 0) { savBadge.textContent = 'pode melhorar'; savBadge.className = 'card__badge'; }
  else { savBadge.textContent = 'receitas - despesas'; savBadge.className = 'card__badge card__badge--zero'; }
}

// ── CHART ─────────────────────────────────────────────────
function updateChart() {
  const container = document.getElementById('expenseChart');
  const expenses  = transactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhuma despesa registrada.</p>';
    return;
  }
  const byCategory = {};
  expenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
  const total  = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  container.innerHTML = '';
  sorted.forEach(([cat, amount]) => {
    const pct   = total > 0 ? Math.round((amount / total) * 100) : 0;
    const color = CATEGORY_COLORS[cat] || '#7A776E';
    const row   = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <div class="chart-row__header">
        <span class="chart-row__label">${cat}</span>
        <span class="chart-row__amount">R$ ${fmt(amount)}</span>
      </div>
      <div class="chart-row__bar-bg">
        <div class="chart-row__bar" data-pct="${pct}" style="background:${color}"></div>
      </div>`;
    container.appendChild(row);
  });
  requestAnimationFrame(() => {
    document.querySelectorAll('.chart-row__bar').forEach(bar => {
      const pct = bar.getAttribute('data-pct');
      setTimeout(() => { bar.style.width = pct + '%'; }, 80);
    });
  });
}

// ── TRANSACTION LIST ──────────────────────────────────────
function updateList() {
  const list     = document.getElementById('transactionList');
  const emptyMsg = document.getElementById('emptyMsg');
  const filtered = currentFilter === 'all' ? transactions : transactions.filter(t => t.type === currentFilter);
  const sorted   = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  list.innerHTML = '';
  if (sorted.length === 0) { emptyMsg.style.display = 'block'; return; }
  emptyMsg.style.display = 'none';
  sorted.forEach((tx, i) => {
    const li = document.createElement('li');
    li.className = 'tx';
    li.setAttribute('data-testid', `tx-item-${tx.id}`);
    li.style.animationDelay = `${i * 30}ms`;
    const sign   = tx.type === 'income' ? '+' : '';
    const amtCls = tx.type === 'income' ? 'tx__amount--income' : 'tx__amount--expense';
    const icon   = CATEGORY_ICONS[tx.category] || '📦';
    const bg     = CATEGORY_BG[tx.category]    || '#F1EFE8';
    li.innerHTML = `
      <div class="tx__icon" style="background:${bg}">${icon}</div>
      <div class="tx__info">
        <p class="tx__name">${tx.name}</p>
        <p class="tx__meta">${fmtDate(tx.date)} · ${tx.category}</p>
      </div>
      <span class="tx__amount ${amtCls}">${sign}${fmtCurrency(tx.amount)}</span>
      <div class="tx__actions">
        <button class="tx__btn" title="Editar" onclick="openEdit('${tx.id}')">✏️</button>
        <button class="tx__btn tx__btn--delete" title="Excluir" onclick="deleteTransaction('${tx.id}')">🗑️</button>
      </div>`;
    list.appendChild(li);
  });
}

function render() {
  updateCards();
  updateChart();
  updateList();
}

// ── DELETE ────────────────────────────────────────────────
window.deleteTransaction = async function (id) {
  if (!confirm('Excluir esta transação?')) return;
  try {
    await apiDelete(id);
    transactions = transactions.filter(t => t.id !== id);
    render();
  } catch (err) {
    alert('Erro ao excluir. Tente novamente.');
  }
};

// ── MODAL ─────────────────────────────────────────────────
const overlay    = document.getElementById('modalOverlay');
const form       = document.getElementById('txForm');
const modalTitle = document.getElementById('modalTitle');
const btnSubmit  = document.getElementById('btnSubmit');
const formError  = document.getElementById('formError');

function openModal(title = 'Nova transação', submitLabel = 'Adicionar') {
  modalTitle.textContent = title;
  btnSubmit.textContent  = submitLabel;
  formError.textContent  = '';
  overlay.setAttribute('aria-hidden', 'false');
  overlay.style.display = 'flex';
  document.getElementById('txName').focus();
}

function closeModal() {
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';
  form.reset();
  editingId    = null;
  selectedType = 'income';
  syncTypeButtons();
  document.querySelectorAll('.form-input').forEach(i => i.classList.remove('invalid'));
}

window.openEdit = function(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  editingId = id;
  document.getElementById('txName').value     = tx.name;
  document.getElementById('txAmount').value   = tx.amount;
  document.getElementById('txDate').value     = tx.date;
  document.getElementById('txCategory').value = tx.category;
  selectedType = tx.type;
  syncTypeButtons();
  openModal('Editar transação', 'Salvar');
};

// ── TYPE TOGGLE ───────────────────────────────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedType = btn.getAttribute('data-type');
    syncTypeButtons();
  });
});

function syncTypeButtons() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === selectedType);
  });
}

// ── FORM SUBMIT ───────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();
  const name   = document.getElementById('txName').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const cat    = document.getElementById('txCategory').value;

  let valid = true;
  formError.textContent = '';
  const nameInput   = document.getElementById('txName');
  const amountInput = document.getElementById('txAmount');
  const dateInput   = document.getElementById('txDate');
  [nameInput, amountInput, dateInput].forEach(i => i.classList.remove('invalid'));

  if (!name)               { nameInput.classList.add('invalid');   valid = false; }
  if (!amount || amount<=0){ amountInput.classList.add('invalid'); valid = false; }
  if (!date)               { dateInput.classList.add('invalid');   valid = false; }
  if (!valid) { formError.textContent = 'Preencha todos os campos corretamente.'; return; }

  const payload = { name, amount, date, category: cat, type: selectedType };

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Salvando…';

  try {
    if (editingId) {
      const updated = await apiUpdate(editingId, payload);
      const idx = transactions.findIndex(t => t.id === editingId);
      if (idx > -1) transactions[idx] = updated;
    } else {
      const created = await apiCreate(payload);
      transactions.unshift(created);
    }
    render();
    closeModal();
  } catch (err) {
    formError.textContent = 'Erro ao salvar. Tente novamente.';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = editingId ? 'Salvar' : 'Adicionar';
  }
});

// ── MODAL CONTROLS ────────────────────────────────────────
document.getElementById('btnAdd').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('txDate').value = today;
  openModal();
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── FILTERS ───────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-filter');
    updateList();
  });
});

// ── DARK MODE ─────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('fb-theme', theme);
}
themeToggle.addEventListener('click', () => {
  setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});
const savedTheme = localStorage.getItem('fb-theme');
if (savedTheme) setTheme(savedTheme);

// ── USER MENU ─────────────────────────────────────────────
const user = getUser();
if (user) {
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent    = initials;
  document.getElementById('userNameLabel').textContent = user.name.split(' ')[0];
  document.getElementById('dropdownName').textContent  = user.name;
  document.getElementById('dropdownEmail').textContent = user.email;
}

const avatarBtn = document.getElementById('userAvatarBtn');
const dropdown  = document.getElementById('userDropdown');

avatarBtn.addEventListener('click', e => {
  e.stopPropagation();
  const open = dropdown.classList.toggle('open');
  avatarBtn.setAttribute('aria-expanded', open);
});

document.addEventListener('click', () => {
  dropdown.classList.remove('open');
  avatarBtn.setAttribute('aria-expanded', 'false');
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('fb-token');
  localStorage.removeItem('fb-user');
  window.location.href = '/login';
});

// ── HEADER DATE ───────────────────────────────────────────
const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const now = new Date();
document.getElementById('currentMonth').textContent = monthNames[now.getMonth()] + ' ' + now.getFullYear();

// ── INIT ──────────────────────────────────────────────────
const loadingOverlay = document.getElementById('loadingOverlay');

(async function init() {
  await loadTransactions();
  render();
  // Fade out loading screen
  loadingOverlay.classList.add('hidden');
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 350);
})();