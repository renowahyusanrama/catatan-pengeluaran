import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/db';
import { dbError, handleCors, parseBody, requireAuth, sendJson } from './_lib/http';
import { isMonth, parseNonNegative } from './_lib/validation';

interface BudgetRow {
  month: string;
  amount: number;
  updated_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') return await get(req, res);
    if (req.method === 'PUT') return await put(req, res);
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (err) {
    dbError(res, err);
  }
}

async function get(req: VercelRequest, res: VercelResponse) {
  const month = typeof req.query.month === 'string' ? req.query.month : '';
  if (!isMonth(month)) {
    sendJson(res, 400, { error: 'INVALID_MONTH' });
    return;
  }

  const { data, error } = await getSupabase().from('budgets').select('*').eq('month', month).maybeSingle();
  if (error) {
    sendJson(res, 500, { error: 'DB_ERROR', detail: error.message });
    return;
  }

  sendJson(res, 200, {
    budget: data ? { month: (data as BudgetRow).month, amount: Number((data as BudgetRow).amount) } : null,
  });
}

async function put(req: VercelRequest, res: VercelResponse) {
  const body = parseBody(req);
  const month = typeof body.month === 'string' ? body.month : '';
  if (!isMonth(month)) {
    sendJson(res, 400, { error: 'INVALID_MONTH' });
    return;
  }
  const amount = parseNonNegative(body.amount);
  if (amount === null) {
    sendJson(res, 400, { error: 'INVALID_AMOUNT' });
    return;
  }

  const { data, error } = await getSupabase()
    .from('budgets')
    .upsert({ month, amount, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    sendJson(res, 500, { error: 'DB_ERROR', detail: error.message });
    return;
  }

  sendJson(res, 200, { budget: { month: (data as BudgetRow).month, amount: Number((data as BudgetRow).amount) } });
}