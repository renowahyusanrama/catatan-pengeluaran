// Klien Supabase REST berbasis fetch bawaan Node.
// Sengaja tanpa dependency (tidak pakai supabase-js / ws) supaya
// serverless function Vercel pasti jalan tanpa masalah bundling.

export interface RawTransaction {
  id: string;
  amount: number | string;
  description: string;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string;
  createdAt: string;
}

export interface TransactionInput {
  amount: number;
  description: string;
  category: string;
  date: string;
  note?: string;
}

export interface Budget {
  month: string;
  amount: number;
}

export interface ListParams {
  from?: string;
  to?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function baseUrl(): string {
  return (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function serialize(row: RawTransaction): Transaction {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    category: row.category,
    date: row.date,
    note: row.note ?? '',
    createdAt: row.created_at,
  };
}

export function serializeTransaction(row: RawTransaction): Transaction {
  return serialize(row);
}

async function ensureOk(res: Response): Promise<void> {
  if (res.ok) return;
  let detail = '';
  try {
    detail = (await res.text()).slice(0, 300);
  } catch {
    detail = '';
  }
  throw new Error(`SUPABASE_${res.status}${detail ? `: ${detail}` : ''}`);
}

function parseCount(range: string | null): number | null {
  if (!range) return null;
  const part = range.split('/')[1];
  if (!part || part === '*') return null;
  const n = parseInt(part, 10);
  return Number.isFinite(n) ? n : null;
}

export async function listTransactions(params: ListParams): Promise<{ data: Transaction[]; total: number }> {
  if (!isDbConfigured()) throw new Error('DB_NOT_CONFIGURED');

  const sp = new URLSearchParams();
  sp.set('select', '*');
  if (params.from) sp.append('date', `gte.${params.from}`);
  if (params.to) sp.append('date', `lte.${params.to}`);
  if (params.category) sp.append('category', `eq.${params.category}`);
  if (params.q) sp.append('description', `ilike.*${params.q}*`);
  sp.set('order', 'date.desc,created_at.desc');
  const take = params.limit && params.limit > 0 ? Math.min(params.limit, 5000) : 5000;
  const skip = params.offset && params.offset > 0 ? params.offset : 0;
  sp.set('limit', String(take));
  sp.set('offset', String(skip));

  const res = await fetch(`${baseUrl()}/rest/v1/transactions?${sp.toString()}`, {
    headers: authHeaders({ Prefer: 'count=exact' }),
  });
  await ensureOk(res);
  const rows = (await res.json()) as RawTransaction[];
  const total = parseCount(res.headers.get('content-range')) ?? rows.length;
  return { data: rows.map(serialize), total };
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const res = await fetch(`${baseUrl()}/rest/v1/transactions`, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      amount: input.amount,
      description: input.description,
      category: input.category,
      date: input.date,
      note: input.note && input.note.length > 0 ? input.note : null,
    }),
  });
  await ensureOk(res);
  const rows = (await res.json()) as RawTransaction[];
  return serialize(rows[0]);
}

export async function updateTransaction(id: string, patch: Record<string, unknown>): Promise<Transaction> {
  const res = await fetch(`${baseUrl()}/rest/v1/transactions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  await ensureOk(res);
  const rows = (await res.json()) as RawTransaction[];
  return serialize(rows[0]);
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/rest/v1/transactions?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await ensureOk(res);
}

export async function deleteAllTransactions(): Promise<void> {
  const res = await fetch(`${baseUrl()}/rest/v1/transactions?id=not.is.null`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await ensureOk(res);
}

export async function getBudget(month: string): Promise<Budget | null> {
  const res = await fetch(
    `${baseUrl()}/rest/v1/budgets?month=eq.${encodeURIComponent(month)}&select=month,amount`,
    { headers: authHeaders() },
  );
  await ensureOk(res);
  const rows = (await res.json()) as { month: string; amount: number | string }[];
  if (rows.length === 0) return null;
  return { month: rows[0].month, amount: Number(rows[0].amount) };
}

export async function setBudget(month: string, amount: number): Promise<Budget> {
  const res = await fetch(`${baseUrl()}/rest/v1/budgets`, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify({ month, amount, updated_at: new Date().toISOString() }),
  });
  await ensureOk(res);
  const rows = (await res.json()) as { month: string; amount: number | string }[];
  return { month: rows[0].month, amount: Number(rows[0].amount) };
}

export async function checkDbConnection(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const res = await fetch(`${baseUrl()}/rest/v1/transactions?select=id&limit=1`, { headers: authHeaders() });
    return res.ok;
  } catch {
    return false;
  }
}