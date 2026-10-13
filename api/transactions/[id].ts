import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteTransaction, updateTransaction } from '../_lib/db';
import { dbError, handleCors, parseBody, requireAuth, sendJson } from '../_lib/http';
import { isIsoDate, parsePositiveInt } from '../_lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (!requireAuth(req, res)) return;

  const raw = req.query.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) {
    sendJson(res, 400, { error: 'INVALID_ID' });
    return;
  }

  try {
    if (req.method === 'PATCH') return await update(req, res, id);
    if (req.method === 'DELETE') return await remove(res, id);
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (err) {
    dbError(res, err);
  }
}

async function update(req: VercelRequest, res: VercelResponse, id: string) {
  const body = parseBody(req);
  const patch: Record<string, unknown> = {};

  if ('amount' in body) {
    const amount = parsePositiveInt(body.amount);
    if (amount === null) return sendJson(res, 400, { error: 'INVALID_AMOUNT' });
    patch.amount = amount;
  }
  if ('description' in body) {
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length === 0) return sendJson(res, 400, { error: 'INVALID_DESCRIPTION' });
    patch.description = description;
  }
  if ('category' in body) {
    patch.category = typeof body.category === 'string' ? body.category.trim() : 'Lainnya';
  }
  if ('date' in body) {
    if (!isIsoDate(body.date)) return sendJson(res, 400, { error: 'INVALID_DATE' });
    patch.date = body.date;
  }
  if ('note' in body) {
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    patch.note = note === '' ? null : note;
  }

  const updated = await updateTransaction(id, patch);
  sendJson(res, 200, { data: updated });
}

async function remove(res: VercelResponse, id: string) {
  await deleteTransaction(id);
  sendJson(res, 200, { ok: true });
}