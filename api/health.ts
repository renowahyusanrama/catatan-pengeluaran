import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkDbConnection, isDbConfigured } from './_lib/db';
import { handleCors, isAccessConfigured, sendJson } from './_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const configured = isDbConfigured();
  const connected = configured ? await checkDbConnection() : false;

  sendJson(res, 200, {
    mode: 'remote',
    db: !configured ? 'not_configured' : connected ? 'connected' : 'error',
    accessRequired: isAccessConfigured(),
  });
}