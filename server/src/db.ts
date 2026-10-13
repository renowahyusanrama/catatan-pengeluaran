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
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        // Node < 22 belum punya WebSocket bawaan, sediakan via paket "ws".
        realtime: { transport: ws as any },
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