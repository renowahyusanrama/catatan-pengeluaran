import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBudget, setBudget } from './_lib/db';
import { dbError, handleCors, parseBody, requireAuth, sendJson } from './_lib/http';
import { isMonth, parseNonNegative } from './_lib/validation';

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
  const raw = req.query.month;
  const month = Array.isArray(raw) ? raw[0] : raw;
  if (!isMonth(month)) {
    sendJson(res, 400, { error: 'INVALID_MONTH' });
    return;
  }
  const budget = await getBudget(month);
  sendJson(res, 200, { budget });
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
  const budget = await setBudget(month, amount);
  sendJson(res, 200, { budget });
}