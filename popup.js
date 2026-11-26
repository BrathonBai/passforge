import {
  DEFAULTS,
  LIMITS,
  estimateEntropy,
  formatEntropy,
  generatePasswords,
  normalizeSettings,
  strengthFor,
} from './generator.js';
import { fillPasswordInPage } from './fill-page.js';

const STORAGE_KEY = 'passforge.settings.v1';
const CHARACTER_KEYS = ['uppercase', 'lowercase', 'numbers', 'symbols'];
const STRENGTH_COLORS = {
  weak: '#bd674b',
  fair: '#bd9434',
  good: '#94b12e',
  great: '#79a428',
  excellent: '#5b8a1d',
};

const els = {
  lengthValue: document.getElementById('lengthValue'),
  lengthMinus: document.getElementById('lengthMinus'),
  lengthPlus: document.getElementById('lengthPlus'),
  countValue: document.getElementById('countValue'),
  countMinus: document.getElementById('countMinus'),
  countPlus: document.getElementById('countPlus'),
  entropy: document.getElementById('entropy'),
  strengthMeter: document.getElementById('strengthMeter'),
  strengthLabel: document.getElementById('strengthLabel'),
  charsetButtons: [...document.querySelectorAll('[data-charset]')],
  avoidAmbiguous: document.getElementById('avoidAmbiguous'),
  resultCount: document.getElementById('resultCount'),
  passwordList: document.getElementById('passwordList'),
  regenerate: document.getElementById('regenerate'),
  copyAll: document.getElementById('copyAll'),
  copyAllLabel: document.getElementById('copyAllLabel'),
  toast: document.getElementById('toast'),
  footerHint: document.getElementById('footerHint'),
};

let state = normalizeSettings(DEFAULTS);
let passwords = [];
let toastTimer = 0;
let copyResetTimer = 0;
let copyAllResetTimer = 0;
let saveChain = Promise.resolve();

function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function swapIcon(container, name) {
  const use = container.querySelector('use');
  if (use) use.setAttribute('href', `#i-${name}`);
}

function showToast(message, { error = false, duration = 1800 } = {}) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle('is-error', error);
  els.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove('is-visible');
  }, duration);
}

function updateControls() {
  els.lengthValue.textContent = String(state.length);
  els.countValue.textContent = String(state.count);
  els.lengthMinus.disabled = state.length <= LIMITS.length.min;
  els.lengthPlus.disabled = state.length >= LIMITS.length.max;
  els.countMinus.disabled = state.count <= LIMITS.count.min;
  els.countPlus.disabled = state.count >= LIMITS.count.max;

  for (const button of els.charsetButtons) {
    const enabled = Boolean(state[button.dataset.charset]);
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-pressed', String(enabled));
  }
  els.avoidAmbiguous.checked = state.avoidAmbiguous;

  const bits = estimateEntropy(state);
  const strength = strengthFor(bits);
  els.entropy.textContent = formatEntropy(bits);
  els.entropy.title = `约 ${bits.toFixed(1)} bit 熵值（估算）`;
  els.strengthLabel.textContent = strength.label;
  els.strengthMeter.style.setProperty(
    '--meter-color',
    STRENGTH_COLORS[strength.tone] || STRENGTH_COLORS.great,
  );
  [...els.strengthMeter.querySelectorAll('span')].forEach((bar, index) => {
    bar.classList.toggle('is-on', index < strength.level);
  });

  const plural = state.count > 1;
  els.copyAllLabel.textContent = plural ? '全部复制' : '复制密码';
  els.copyAll.title = plural ? `复制全部 ${state.count} 个密码` : '复制密码';
  els.resultCount.textContent = String(passwords.length || state.count);
  els.resultCount.title = `${passwords.length || state.count} 个候选密码`;
  els.footerHint.textContent = '点击密码复制 · 填入当前网页';
}

function markPasswordCopied(index) {
  window.clearTimeout(copyResetTimer);
  for (const row of els.passwordList.querySelectorAll('.candidate.is-copied')) {
    row.classList.remove('is-copied');
    const main = row.querySelector('.candidate-main');
    if (main) swapIcon(main, 'copy');
  }

  const row = els.passwordList.querySelector(`.candidate[data-index="${index}"]`);
  if (!row) return;
  row.classList.add('is-copied');
  const main = row.querySelector('.candidate-main');
  if (main) swapIcon(main, 'check');
  copyResetTimer = window.setTimeout(() => {
    row.classList.remove('is-copied');
    if (main) swapIcon(main, 'copy');
  }, 1450);
}

function renderEmpty(message) {
  els.passwordList.replaceChildren();
  const empty = document.createElement('li');
  empty.className = 'empty-state';
  empty.textContent = message;
  els.passwordList.append(empty);
}

function renderPasswords({ animate = false } = {}) {
  els.passwordList.replaceChildren();
  if (passwords.length === 0) {
    renderEmpty('暂时没有生成结果');
    return;
  }

  const fragment = document.createDocumentFragment();
  passwords.forEach((password, index) => {
    const row = document.createElement('li');
    row.className = 'candidate';
    row.dataset.index = String(index);

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'candidate-main';
    main.dataset.action = 'copy';
    main.dataset.index = String(index);
    main.title = '点击复制';

    const prefix = document.createElement('span');
    prefix.className = 'sr-only';
    prefix.textContent = `复制第 ${index + 1} 个密码：`;

    const number = document.createElement('span');
    number.className = 'candidate-index';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');

    const code = document.createElement('code');
    code.className = 'candidate-password';
    code.textContent = password;

    const copyGlyph = document.createElement('span');
    copyGlyph.className = 'row-icon';
    copyGlyph.setAttribute('aria-hidden', 'true');
    copyGlyph.append(createIcon('copy'));

    main.append(prefix, number, code, copyGlyph);

    const fill = document.createElement('button');
    fill.type = 'button';
    fill.className = 'row-icon fill-button';
    fill.dataset.action = 'fill';
    fill.dataset.index = String(index);
    fill.title = '填入当前网页（不支持时会转为复制）';
    fill.setAttribute('aria-label', `将第 ${index + 1} 个密码填入当前网页`);
    fill.textContent = '填入';

    row.append(main, fill);
    fragment.append(row);
  });
  els.passwordList.append(fragment);

  els.passwordList.classList.remove('is-fresh');
  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void els.passwordList.offsetWidth;
    els.passwordList.classList.add('is-fresh');
    window.setTimeout(() => els.passwordList.classList.remove('is-fresh'), 260);
  }
}

function updateResultMeta() {
  els.resultCount.textContent = String(passwords.length);
  els.resultCount.title = `${passwords.length} 个候选密码`;
}

function animateRegenerateButton() {
  els.regenerate.classList.remove('is-spinning');
  void els.regenerate.offsetWidth;
  els.regenerate.classList.add('is-spinning');
  window.setTimeout(() => els.regenerate.classList.remove('is-spinning'), 420);
}

function generateBatch({ animate = true, spin = false } = {}) {
  try {
    passwords = generatePasswords(state);
    renderPasswords({ animate });
    updateResultMeta();
    if (spin) animateRegenerateButton();
  } catch (error) {
    console.error('PassForge: unable to generate passwords', error);
    passwords = [];
    renderEmpty('无法生成密码，请重新打开插件');
    updateResultMeta();
    showToast('无法获取安全随机数，请重新打开插件', { error: true, duration: 2800 });
  }
}

function nudge(key, delta) {
  const limits = LIMITS[key];
  const next = Math.min(limits.max, Math.max(limits.min, state[key] + delta));
  if (next === state[key]) return;
  state = normalizeSettings({ ...state, [key]: next });
  updateControls();
  generateBatch({ animate: true });
  persistSettings();
}

function toggleCharset(button) {
  const key = button.dataset.charset;
  if (!CHARACTER_KEYS.includes(key)) return;
  const enabledCount = CHARACTER_KEYS.filter((name) => state[name]).length;

  if (state[key] && enabledCount === 1) {
    button.classList.remove('is-refusing');
    void button.offsetWidth;
    button.classList.add('is-refusing');
    window.setTimeout(() => button.classList.remove('is-refusing'), 320);
    showToast('至少保留一种字符类型');
    return;
  }

  state = normalizeSettings({ ...state, [key]: !state[key] });
  updateControls();
  generateBatch({ animate: true });
  persistSettings();
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Fall back to execCommand for pages/popups without clipboard focus. */
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0;';
  document.body.append(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyPassword(index) {
  const password = passwords[index];
  if (!password) return;

  const copied = await writeClipboard(password);
  if (!copied) {
    showToast('复制失败，请重试', { error: true });
    return;
  }
  markPasswordCopied(index);
  showToast(`已复制第 ${index + 1} 个密码`);
}

async function copyAllPasswords() {
  if (passwords.length === 0) return;
  const copied = await writeClipboard(passwords.join('\n'));
  if (!copied) {
    showToast('复制失败，请重试', { error: true });
    return;
  }

  els.copyAll.classList.add('is-copied');
  els.copyAllLabel.textContent = '已复制';
  swapIcon(els.copyAll, 'check');
  window.clearTimeout(copyAllResetTimer);
  copyAllResetTimer = window.setTimeout(() => {
    els.copyAll.classList.remove('is-copied');
    els.copyAllLabel.textContent = state.count > 1 ? '全部复制' : '复制密码';
    swapIcon(els.copyAll, 'copy');
  }, 1500);
  showToast(
    passwords.length > 1 ? `已复制全部 ${passwords.length} 个密码` : '已复制密码',
  );
}

async function fillPassword(index, button) {
  const password = passwords[index];
  if (!password) return;

  button.disabled = true;
  try {
    if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) {
      throw new Error('scripting-unavailable');
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('no-active-tab');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillPasswordInPage,
      args: [password],
    });
    const result = results?.[0]?.result;

    if (result?.ok && result.mode === 'pick') {
      // The page now shows a picker overlay; close so the user can click a field.
      window.close();
      return;
    }

    if (result?.ok) {
      button.classList.add('is-filled');
      button.textContent = '已填';
      window.setTimeout(() => {
        button.classList.remove('is-filled');
        button.textContent = '填入';
      }, 1700);
      showToast(
        result.confirmation ? '已填入密码，并同步确认框' : '已填入密码',
        { duration: 2200 },
      );
      return;
    }

    if (result?.reason === 'no-fields') {
      showToast('没找到密码框，请先点一下网页中的密码框', {
        error: true,
        duration: 2600,
      });
      return;
    }

    throw new Error(result?.message || result?.reason || 'fill-failed');
  } catch (error) {
    console.warn('PassForge: fill unavailable, falling back to clipboard', error);
    const copied = await writeClipboard(password);
    showToast(
      copied ? '此页面无法填入，已复制密码' : '无法填入，请手动复制密码',
      { error: !copied, duration: 2400 },
    );
  } finally {
    button.disabled = false;
  }
}

function persistSettings() {
  const snapshot = { ...state };
  saveChain = saveChain
    .then(() => writeSettings(snapshot))
    .catch((error) => console.warn('PassForge: unable to save settings', error));
}

async function writeSettings(settings) {
  if (globalThis.chrome?.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Preview environments may block localStorage; settings are optional. */
  }
}

async function readSettings() {
  if (globalThis.chrome?.storage?.local) {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return stored?.[STORAGE_KEY] ?? null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function bindEvents() {
  els.lengthMinus.addEventListener('click', () => nudge('length', -1));
  els.lengthPlus.addEventListener('click', () => nudge('length', 1));
  els.countMinus.addEventListener('click', () => nudge('count', -1));
  els.countPlus.addEventListener('click', () => nudge('count', 1));

  for (const button of els.charsetButtons) {
    button.addEventListener('click', () => toggleCharset(button));
  }

  els.avoidAmbiguous.addEventListener('change', () => {
    state = normalizeSettings({ ...state, avoidAmbiguous: els.avoidAmbiguous.checked });
    updateControls();
    generateBatch({ animate: true });
    persistSettings();
  });

  els.regenerate.addEventListener('click', () => generateBatch({ animate: true, spin: true }));
  els.copyAll.addEventListener('click', copyAllPasswords);

  els.passwordList.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const index = Number(actionButton.dataset.index);
    if (!Number.isInteger(index)) return;

    if (actionButton.dataset.action === 'copy') {
      copyPassword(index);
    } else if (actionButton.dataset.action === 'fill') {
      fillPassword(index, actionButton);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.toLowerCase() !== 'r') return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    generateBatch({ animate: true, spin: true });
  });

  window.addEventListener('pagehide', () => {
    window.clearTimeout(toastTimer);
    window.clearTimeout(copyResetTimer);
    window.clearTimeout(copyAllResetTimer);
  });
}

async function boot() {
  try {
    const stored = await readSettings();
    state = normalizeSettings(stored || DEFAULTS);
  } catch (error) {
    console.warn('PassForge: unable to read settings', error);
    state = normalizeSettings(DEFAULTS);
  }

  bindEvents();
  updateControls();
  generateBatch({ animate: false });
}

await boot();
