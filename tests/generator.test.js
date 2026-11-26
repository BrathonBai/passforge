import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULTS,
  LIMITS,
  estimateEntropy,
  formatEntropy,
  generatePassword,
  generatePasswords,
  getActiveSets,
  getPool,
  normalizeSettings,
  secureRandomInt,
  strengthFor,
} from '../generator.js';

const ALL_CLASSES = ['uppercase', 'lowercase', 'numbers', 'symbols'];

function selected(overrides = {}) {
  return normalizeSettings({
    ...DEFAULTS,
    uppercase: false,
    lowercase: false,
    numbers: false,
    symbols: false,
    ...overrides,
  });
}

test('defaults generate the requested batch shape', () => {
  const batch = generatePasswords(DEFAULTS);
  assert.equal(batch.length, 10);
  for (const password of batch) assert.equal(password.length, 12);
});

test('every enabled character class appears in every password', () => {
  const patterns = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    numbers: /[0-9]/,
    symbols: /[!@#$%^&*()\-_=+\[\]{};:,.?]/,
  };
  for (const override of [{}, { length: 8 }, { length: 64, avoidAmbiguous: false }]) {
    const settings = normalizeSettings({ ...DEFAULTS, ...override });
    for (const password of generatePasswords(settings)) {
      for (const key of ALL_CLASSES) assert.match(password, patterns[key], `${key}: ${password}`);
      assert.equal(password.length, settings.length);
    }
  }
});

test('disabled classes never leak into the output', () => {
  const settings = selected({ length: 20, count: 100, lowercase: true, numbers: true });
  for (const password of generatePasswords(settings)) {
    assert.match(password, /^[a-z0-9]+$/);
    assert.match(password, /[a-z]/);
    assert.match(password, /[0-9]/);
    assert.doesNotMatch(password, /[A-Z!@#$%^&*()[\]{};:,.?=_+\-]/);
  }
});

test('ambiguity avoidance removes only 0 O 1 l I', () => {
  const safePool = getPool({ ...DEFAULTS });
  for (const character of ['0', 'O', '1', 'l', 'I']) assert.ok(!safePool.includes(character));
  const fullPool = getPool({ ...DEFAULTS, avoidAmbiguous: false });
  for (const character of ['0', 'O', '1', 'l', 'I']) assert.ok(fullPool.includes(character));
  assert.equal(fullPool.length, safePool.length + 5);
});

test('settings are clamped and repaired', () => {
  const repaired = normalizeSettings({
    length: 999,
    count: -4,
    uppercase: false,
    lowercase: false,
    numbers: false,
    symbols: false,
    avoidAmbiguous: 'nope',
  });
  assert.equal(repaired.length, LIMITS.length.max);
  assert.equal(repaired.count, LIMITS.count.min);
  assert.equal(repaired.uppercase, true);
  assert.equal(repaired.lowercase, true);
  assert.equal(repaired.numbers, true);
  assert.equal(repaired.symbols, true);
  assert.equal(repaired.avoidAmbiguous, true);

  const fractional = normalizeSettings({ length: 12.7, count: '3' });
  assert.equal(fractional.length, 13);
  assert.equal(fractional.count, 3);
});

test('active sets follow a stable order and are all empty-proof', () => {
  const sets = getActiveSets(DEFAULTS);
  assert.deepEqual(sets.map((set) => set.key), ALL_CLASSES);
  assert.ok(sets.every((set) => set.chars.length > 0));
});

test('entropy and strength labels track the configuration', () => {
  const defaultBits = estimateEntropy(DEFAULTS);
  assert.ok(defaultBits > 74 && defaultBits < 78, String(defaultBits));
  assert.equal(formatEntropy(defaultBits), '75 bit');

  const shorter = estimateEntropy({ ...DEFAULTS, length: 8 });
  assert.ok(shorter < defaultBits);
  assert.equal(strengthFor(defaultBits).label, '很强');
  assert.equal(strengthFor(0).label, '较弱');
  assert.equal(strengthFor(200).label, '极强');
});

test('generated passwords are not repeated in a realistic batch', () => {
  const batch = generatePasswords({ ...DEFAULTS, count: 20, length: 12 });
  assert.equal(new Set(batch).size, batch.length);
  const large = Array.from({ length: 2000 }, () => generatePassword(DEFAULTS));
  assert.equal(new Set(large).size, large.length);
});

test('secureRandomInt rejects invalid bounds and stays in range', () => {
  assert.throws(() => secureRandomInt(0), RangeError);
  assert.throws(() => secureRandomInt(2.5), RangeError);
  assert.throws(() => secureRandomInt(0x100000001), RangeError);
  for (let index = 0; index < 500; index += 1) {
    const value = secureRandomInt(10);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 10);
  }
});

test('output alphabet never falls outside the selected pool', () => {
  const settings = normalizeSettings({ ...DEFAULTS, length: 64, count: 50 });
  const pool = new Set(getPool(settings));
  for (const password of generatePasswords(settings)) {
    for (const character of password) assert.ok(pool.has(character));
  }
});

test('changing only options does not mutate the passed settings', () => {
  const input = { ...DEFAULTS };
  const snapshot = JSON.stringify(input);
  generatePasswords(input);
  assert.equal(JSON.stringify(input), snapshot);
});
