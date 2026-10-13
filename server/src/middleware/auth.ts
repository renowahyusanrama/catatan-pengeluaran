import { NextFunction, Request, Response } from 'express';

export function isAccessConfigured(): boolean {
  return Boolean(process.env.ACCESS_KEY && process.env.ACCESS_KEY.trim().length > 0);
}

export function extractAccessKey(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/.exec(header);
  return match ? match[1].trim() : null;
}

export function requireAccess(req: Request, res: Response, next: NextFunction) {
  if (!isAccessConfigured()) {
    res.status(503).json({ error: 'NOT_CONFIGURED' });
    return;
  }
  const key = extractAccessKey(req);
  if (!key || key !== process.env.ACCESS_KEY) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  next();
}