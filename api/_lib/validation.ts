export const CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Kebutuhan Harian',
  'Tagihan',
  'Hiburan',
  'Belanja',
  'Kesehatan',
  'Lainnya',
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH_RE.test(value);
}

export function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = Number(value);
    if (Number.isSafeInteger(n) && n > 0) return n;
  }
  return null;
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value);
  if (typeof value === 'string') {
    const clean = value.replace(/[^\d]/g, '');
    if (clean === '') return null;
    const n = Number(clean);
    if (Number.isSafeInteger(n) && n > 0) return n;
  }
  return null;
}

export function parseNonNegative(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round(value);
  if (typeof value === 'string') {
    const clean = value.replace(/[^\d]/g, '');
    if (clean === '') return null;
    const n = Number(clean);
    if (Number.isSafeInteger(n) && n >= 0) return n;
  }
  return null;
}