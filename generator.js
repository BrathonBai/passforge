/**
 * PassForge — cryptographic password generation.
 *
 * Everything here runs locally. Randomness comes exclusively from
 * crypto.getRandomValues(); there is deliberately no Math.random() fallback.
 */

export const LIMITS = Object.freeze({
  length: Object.freeze({ min: 8, max: 64 }),
  count: Object.freeze({ min: 1, max: 20 }),
});

export const DEFAULTS = Object.freeze({
  length: 12,
  count: 10,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  avoidAmbiguous: true,
});

const BASE_SETS = Object.freeze({
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
});

const CHARACTER_KEYS = Object.freeze(['uppercase', 'lowercase', 'numbers', 'symbols']);
const AMBIGUOUS = new Set(['0', 'O', '1', 'l', 'I']);

export const CHARACTER_LABELS = Object.freeze({
  uppercase: '大写',
  lowercase: '小写',
  numbers: '数字',
  symbols: '符号',
});

function clampInteger(value, min, max, fallback) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

/**
 * Accepts partial or malformed persisted settings and always returns a
 * generation-safe configuration.
 */
export function normalizeSettings(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};

  const enabled = {};
  for (const key of CHARACTER_KEYS) enabled[key] = raw[key] !== false;

  // At least one character class is required. Corrupt storage falls back to
  // all classes rather than producing an impossible configuration.
  if (!CHARACTER_KEYS.some((key) => enabled[key])) {
    for (const key of CHARACTER_KEYS) enabled[key] = true;
  }

  return {
    length: clampInteger(raw.length, LIMITS.length.min, LIMITS.length.max, DEFAULTS.length),
    count: clampInteger(raw.count, LIMITS.count.min, LIMITS.count.max, DEFAULTS.count),
    uppercase: enabled.uppercase,
    lowercase: enabled.lowercase,
    numbers: enabled.numbers,
    symbols: enabled.symbols,
    avoidAmbiguous: raw.avoidAmbiguous !== false,
  };
}

/** Returns only the enabled characters, with ambiguity filtering applied. */
export function getCharacterSet(key, avoidAmbiguous = true) {
  const base = BASE_SETS[key];
  if (!base) throw new Error(`Unknown character set: ${key}`);
  if (!avoidAmbiguous) return base;
  return [...base].filter((character) => !AMBIGUOUS.has(character)).join('');
}

/** The ordered list of active character classes for a configuration. */
export function getActiveSets(settings) {
  const safe = normalizeSettings(settings);
  return CHARACTER_KEYS
    .filter((key) => safe[key])
    .map((key) => ({
      key,
      label: CHARACTER_LABELS[key],
      chars: getCharacterSet(key, safe.avoidAmbiguous),
    }));
}

export function getPool(settings) {
  return getActiveSets(settings).map((set) => set.chars).join('');
}

/**
 * Unbiased random integer in [0, max). Rejection sampling avoids the modulo
 * bias that a plain random % max would introduce.
 */
export function secureRandomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
    throw new RangeError('max must be an integer between 1 and 2^32');
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('A secure random number generator is not available');
  }
  if (max === 1) return 0;

  const cutoff = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buffer);
    if (buffer[0] < cutoff) return buffer[0] % max;
  }
}

function secureShuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

/**
 * Generate one password. Every enabled class is guaranteed to appear at least
 * once, then the result is shuffled so the guaranteed characters are not
 * stuck at predictable positions.
 */
export function generatePassword(settings, randomInt = secureRandomInt) {
  const safe = normalizeSettings(settings);
  const sets = getActiveSets(safe);

  if (sets.length === 0) throw new Error('No character classes enabled');
  if (safe.length < sets.length) {
    throw new Error('Password length is shorter than the number of character classes');
  }

  const pool = sets.map((set) => set.chars).join('');
  if (!pool) throw new Error('Character pool is empty');

  const characters = sets.map((set) => set.chars[randomInt(set.chars.length)]);
  while (characters.length < safe.length) {
    characters.push(pool[randomInt(pool.length)]);
  }

  return secureShuffle(characters).join('');
}

/** Generate a fresh batch. No password is ever persisted by this module. */
export function generatePasswords(settings) {
  const safe = normalizeSettings(settings);
  return Array.from({ length: safe.count }, () => generatePassword(safe));
}

/**
 * Approximate Shannon entropy of one password, in bits. Guaranteeing one of
 * each class slightly reduces the search space, so this is an upper-bound
 * estimate rather than a measurement.
 */
export function estimateEntropy(settings) {
  const safe = normalizeSettings(settings);
  const poolSize = getPool(safe).length;
  if (poolSize === 0) return 0;
  return safe.length * Math.log2(poolSize);
}

export function strengthFor(bits) {
  if (bits >= 95) return { level: 5, label: '极强', tone: 'excellent' };
  if (bits >= 75) return { level: 4, label: '很强', tone: 'great' };
  if (bits >= 58) return { level: 3, label: '强', tone: 'good' };
  if (bits >= 44) return { level: 2, label: '一般', tone: 'fair' };
  return { level: 1, label: '较弱', tone: 'weak' };
}

/** "76 bit" for the compact badge; stays honest and rounded down. */
export function formatEntropy(bits) {
  return `${Math.max(0, Math.floor(bits))} bit`;
}
