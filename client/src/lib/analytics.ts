import type { Transaction } from './types';

export function inRange(t: Transaction, from: string, to: string): boolean {
  return t.date >= from && t.date <= to;
}

export function filterRange(txs: Transaction[], from: string, to: string): Transaction[] {
  return txs.filter((t) => inRange(t, from, to));
}

export function sumAmount(txs: Transaction[]): number {
  return txs.reduce((sum, t) => sum + t.amount, 0);
}

export function countTx(txs: Transaction[]): number {
  return txs.length;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export function categoryTotals(txs: Transaction[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const t of txs) {
    const existing = map.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      map.set(t.category, { category: t.category, total: t.amount, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function dailyTotals(txs: Transaction[], days: { iso: string; label: string }[]): { label: string; iso: string; total: number }[] {
  const map = new Map<string, number>();
  for (const d of days) map.set(d.iso, 0);
  for (const t of txs) map.set(t.date, (map.get(t.date) ?? 0) + t.amount);
  return days.map((d) => ({ label: d.label, iso: d.iso, total: map.get(d.iso) ?? 0 }));
}