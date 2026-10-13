import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

let client: SupabaseClient | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!isDbConfigured()) {
    throw new Error('DB_NOT_CONFIGURED');
  }
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as never },
      },
    );
  }
  return client;
}

export async function checkDbConnection(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const { error } = await getSupabase().from('transactions').select('id', { head: true }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export interface TransactionRow {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

export function serializeTransaction(row: TransactionRow) {
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