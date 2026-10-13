import type { VercelRequest, VercelResponse } from '@vercel/node';

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Menangani preflight + header CORS. Return true jika request sudah selesai.
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export function isAccessConfigured(): boolean {
  return Boolean(process.env.ACCESS_KEY && process.env.ACCESS_KEY.trim().length > 0);
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAccessConfigured()) {
    sendJson(res, 503, { error: 'NOT_CONFIGURED' });
    return false;
  }
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/.exec(Array.isArray(header) ? header[0] : header);
  if (!match || match[1].trim() !== process.env.ACCESS_KEY) {
    sendJson(res, 401, { error: 'UNAUTHORIZED' });
    return false;
  }
  return true;
}

export function parseBody(req: VercelRequest): Record<string, unknown> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

export function dbError(res: VercelResponse, err: unknown): void {
  if (err instanceof Error && err.message === 'DB_NOT_CONFIGURED') {
    sendJson(res, 503, { error: 'NOT_CONFIGURED' });
    return;
  }
  // Dicatat ke runtime log Vercel untuk memudahkan diagnosis.
  console.error('[api] error:', err);
  sendJson(res, 500, { error: 'DB_ERROR' });
}