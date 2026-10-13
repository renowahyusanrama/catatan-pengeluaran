import type { Transaction, Budget, TransactionInput, ListResult, ApiError } from '../lib/types';
import { getAccessKey } from './localStore';

let baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
// Nilai khusus "same-origin" -> pakai API di domain yang sama (untuk deploy Vercel).
const sameOrigin = baseUrl.toLowerCase() === 'same-origin';
if (sameOrigin) baseUrl = '';
baseUrl = baseUrl.replace(/\/+$/, '');
let remoteEnabled = sameOrigin || baseUrl.length > 0;

export function getApiUrl(): string {
  return baseUrl;
}

export function setApiUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, '');
  remoteEnabled = true;
}

export function isRemoteConfigured(): boolean {
  return remoteEnabled;
}

function authHeaders(): Record<string, string> {
  const key = getAccessKey();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = (body ?? { error: 'HTTP_ERROR' }) as ApiError;
    throw err;
  }
  return body as T;
}

export interface HealthResult {
  mode: 'remote';
  db: 'connected' | 'not_configured' | 'error';
  accessRequired: boolean;
}

export async function fetchHealth(): Promise<HealthResult | null> {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) return null;
    return (await res.json()) as HealthResult;
  } catch {
    return null;
  }
}

export interface ListFilter {
  from?: string;
  to?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(filter?: ListFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.category) params.set('category', filter.category);
  if (filter.q) params.set('q', filter.q);
  if (filter.limit) params.set('limit', String(filter.limit));
  if (filter.offset) params.set('offset', String(filter.offset));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const remoteBackend = {
  mode: 'remote' as const,

  async list(filter?: ListFilter): Promise<ListResult> {
    const res = await request<{ data: Transaction[]; total: number }>(`/api/transactions${buildQuery(filter)}`);
    return { data: res.data, total: res.total };
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const res = await request<{ data: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(id: string, patch: Partial<TransactionInput>): Promise<Transaction> {
    const res = await request<{ data: Transaction }>(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await request(`/api/transactions/${id}`, { method: 'DELETE' });
  },

  async removeAll(): Promise<void> {
    await request(`/api/transactions`, { method: 'DELETE' });
  },

  async getBudget(month: string): Promise<Budget | null> {
    const res = await request<{ budget: Budget | null }>(`/api/budget?month=${encodeURIComponent(month)}`);
    return res.budget;
  },

  async setBudget(month: string, amount: number): Promise<Budget> {
    const res = await request<{ budget: Budget }>('/api/budget', {
      method: 'PUT',
      body: JSON.stringify({ month, amount }),
    });
    return res.budget;
  },
};