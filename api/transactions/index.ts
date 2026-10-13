import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, serializeTransaction, TransactionRow } from '../_lib/db';
import { dbError, handleCors, parseBody, requireAuth, sendJson } from '../_lib/http';
import { CATEGORIES, isIsoDate, parsePositiveInt } from '../_lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') return await list(req, res);
    if (req.method === 'POST') return await create(req, res);
    if (req.method === 'DELETE') return await removeAll(res);
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (err) {
    dbError(res, err);
  }
}

async function list(req: VercelRequest, res: VercelResponse) {
  const { from, to, category, q, limit, offset } = req.query;

  let query = getSupabase().from('transactions').select('*', { count: 'exact' });

  if (typeof from === 'string' && isIsoDate(from)) query = query.gte('date', from);
  if (typeof to === 'string' && isIsoDate(to)) query = query.lte('date', to);
  if (typeof category === 'string' && category !== '') query = query.eq('category', category);
  if (typeof q === 'string' && q.trim() !== '') query = query.ilike('description', `%${q.trim()}%`);

  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : NaN;
  const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : NaN;
  const take = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 5000) : 5000;
  const skip = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  const { data, error, count } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (error) {
    sendJson(res, 500, { error: 'DB_ERROR', detail: error.message });
    return;
  }

  sendJson(res, 200, { data: (data as TransactionRow[]).map(serializeTransaction), total: count ?? 0 });
}

async function create(req: VercelRequest, res: VercelResponse) {
  const body = parseBody(req);
  const amount = parsePositiveInt(body.amount);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const date = body.date;
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  if (amount === null) return sendJson(res, 400, { error: 'INVALID_AMOUNT' });
  if (description.length === 0) return sendJson(res, 400, { error: 'INVALID_DESCRIPTION' });
  if (!isIsoDate(date)) return sendJson(res, 400, { error: 'INVALID_DATE' });

  const finalCategory: string = CATEGORIES.includes(category as never) || category.length > 0 ? category : 'Lainnya';

  const { data, error } = await getSupabase()
    .from('transactions')
    .insert({ amount, description, category: finalCategory, date, note: note === '' ? null : note })
    .select()
    .single();

  if (error) return sendJson(res, 500, { error: 'DB_ERROR', detail: error.message });
  sendJson(res, 201, { data: serializeTransaction(data as TransactionRow) });
}

async function removeAll(res: VercelResponse) {
  const { error } = await getSupabase().from('transactions').delete().not('id', 'is', null);
  if (error) return sendJson(res, 500, { error: 'DB_ERROR', detail: error.message });
  sendJson(res, 200, { ok: true });
}