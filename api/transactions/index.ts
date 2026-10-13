import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTransaction, deleteAllTransactions, listTransactions } from '../_lib/db';
import { dbError, handleCors, parseBody, requireAuth, sendJson } from '../_lib/http';
import { CATEGORIES, isIsoDate, parsePositiveInt } from '../_lib/validation';

function qString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

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
  const from = qString(req.query.from);
  const to = qString(req.query.to);
  const category = qString(req.query.category);
  const q = qString(req.query.q);
  const limit = qString(req.query.limit);
  const offset = qString(req.query.offset);

  const result = await listTransactions({
    from: from && isIsoDate(from) ? from : undefined,
    to: to && isIsoDate(to) ? to : undefined,
    category: category && category !== '' ? category : undefined,
    q: q && q.trim() !== '' ? q.trim() : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  });

  sendJson(res, 200, result);
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

  const created = await createTransaction({
    amount,
    description,
    category: finalCategory,
    date,
    note,
  });

  sendJson(res, 201, { data: created });
}

async function removeAll(res: VercelResponse) {
  await deleteAllTransactions();
  sendJson(res, 200, { ok: true });
}