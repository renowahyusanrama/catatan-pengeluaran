import { Router, Request, Response } from 'express';
import { getSupabase } from '../db.js';
import { isIsoDate, parsePositiveInt, CATEGORIES } from '../lib/validation.js';

export const transactionsRouter = Router();

interface TransactionRow {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

function serialize(row: TransactionRow) {
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

// GET /api/transactions
transactionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, category, q, limit, offset } = req.query;

    let query = getSupabase()
      .from('transactions')
      .select('*', { count: 'exact' });

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
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }

    res.json({ data: (data as TransactionRow[]).map(serialize), total: count ?? 0 });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /api/transactions
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const amount = parsePositiveInt(body.amount);
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const date = body.date;
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (amount === null) {
      res.status(400).json({ error: 'INVALID_AMOUNT' });
      return;
    }
    if (description.length === 0) {
      res.status(400).json({ error: 'INVALID_DESCRIPTION' });
      return;
    }
    if (!isIsoDate(date)) {
      res.status(400).json({ error: 'INVALID_DATE' });
      return;
    }
    const finalCategory: string = CATEGORIES.includes(category as any) || category.length > 0 ? category : 'Lainnya';

    const { data, error } = await getSupabase()
      .from('transactions')
      .insert({
        amount,
        description,
        category: finalCategory,
        date,
        note: note === '' ? null : note,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }

    res.status(201).json({ data: serialize(data as TransactionRow) });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// PATCH /api/transactions/:id
transactionsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const patch: Record<string, unknown> = {};

    if ('amount' in body) {
      const amount = parsePositiveInt(body.amount);
      if (amount === null) {
        res.status(400).json({ error: 'INVALID_AMOUNT' });
        return;
      }
      patch.amount = amount;
    }
    if ('description' in body) {
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      if (description.length === 0) {
        res.status(400).json({ error: 'INVALID_DESCRIPTION' });
        return;
      }
      patch.description = description;
    }
    if ('category' in body) {
      patch.category = typeof body.category === 'string' ? body.category.trim() : 'Lainnya';
    }
    if ('date' in body) {
      if (!isIsoDate(body.date)) {
        res.status(400).json({ error: 'INVALID_DATE' });
        return;
      }
      patch.date = body.date;
    }
    if ('note' in body) {
      const note = typeof body.note === 'string' ? body.note.trim() : '';
      patch.note = note === '' ? null : note;
    }

    const { data, error } = await getSupabase()
      .from('transactions')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }

    res.json({ data: serialize(data as TransactionRow) });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/transactions/:id
transactionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await getSupabase().from('transactions').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/transactions  -> hapus semua (dipakai fitur "Hapus semua data")
transactionsRouter.delete('/', async (_req: Request, res: Response) => {
  try {
    const { error } = await getSupabase().from('transactions').delete().not('id', 'is', null);
    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});