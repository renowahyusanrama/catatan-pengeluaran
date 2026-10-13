import type { Transaction, Budget, TransactionInput, ListResult, ApiError } from '../lib/types';

const TX_KEY = 'catatan-pengeluaran.transactions';
const BUDGET_KEY = 'catatan-pengeluaran.budgets';
const SETTINGS_KEY = 'catatan-pengeluaran.settings';

interface Settings {
  accessKey?: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readTransactions(): Transaction[] {
  const list = read<Transaction[]>(TX_KEY, []);
  if (!Array.isArray(list)) return [];
  return list;
}

function writeTransactions(list: Transaction[]): void {
  write(TX_KEY, list);
}

export function readBudgets(): Record<string, number> {
  const map = read<Record<string, number>>(BUDGET_KEY, {});
  if (!map || typeof map !== 'object') return {};
  return map;
}

function writeBudgets(map: Record<string, number>): void {
  write(BUDGET_KEY, map);
}

export function readSettings(): Settings {
  return read<Settings>(SETTINGS_KEY, {});
}

function writeSettings(s: Settings): void {
  write(SETTINGS_KEY, s);
}

export function getAccessKey(): string {
  return readSettings().accessKey ?? '';
}

export function setAccessKey(key: string): void {
  const s = readSettings();
  s.accessKey = key;
  writeSettings(s);
}

export interface ListFilter {
  from?: string;
  to?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const localBackend = {
  mode: 'local' as const,

  async list(filter?: ListFilter): Promise<ListResult> {
    let list = readTransactions();
    if (filter?.from) list = list.filter((t) => t.date >= filter.from!);
    if (filter?.to) list = list.filter((t) => t.date <= filter.to!);
    if (filter?.category) list = list.filter((t) => t.category === filter.category);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.note.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
    return { data: list, total: list.length };
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const t: Transaction = {
      id: newId(),
      amount: input.amount,
      description: input.description,
      category: input.category,
      date: input.date,
      note: input.note ?? '',
      createdAt: new Date().toISOString(),
    };
    const list = readTransactions();
    writeTransactions([t, ...list]);
    return t;
  },

  async update(id: string, patch: Partial<TransactionInput>): Promise<Transaction> {
    const list = readTransactions();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw { error: 'NOT_FOUND' } as ApiError;
    const next = { ...list[idx], ...patch };
    list[idx] = next;
    writeTransactions(list);
    return next;
  },

  async remove(id: string): Promise<void> {
    writeTransactions(readTransactions().filter((t) => t.id !== id));
  },

  async removeAll(): Promise<void> {
    writeTransactions([]);
  },

  async getBudget(month: string): Promise<Budget | null> {
    const map = readBudgets();
    const amount = map[month];
    return amount === undefined ? null : { month, amount };
  },

  async setBudget(month: string, amount: number): Promise<Budget> {
    const map = readBudgets();
    map[month] = amount;
    writeBudgets(map);
    return { month, amount };
  },
};