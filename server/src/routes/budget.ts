import { Router, Request, Response } from 'express';
import { getSupabase } from '../db.js';
import { isMonth, parseNonNegative } from '../lib/validation.js';

export const budgetRouter = Router();

interface BudgetRow {
  month: string;
  amount: number;
  updated_at: string;
}

// GET /api/budget?month=YYYY-MM
budgetRouter.get('/', async (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : '';
    if (!isMonth(month)) {
      res.status(400).json({ error: 'INVALID_MONTH' });
      return;
    }
    const { data, error } = await getSupabase()
      .from('budgets')
      .select('*')
      .eq('month', month)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }

    res.json({ budget: data ? { month: (data as BudgetRow).month, amount: Number((data as BudgetRow).amount) } : null });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// PUT /api/budget  body: { month, amount }
budgetRouter.put('/', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const month = typeof body.month === 'string' ? body.month : '';
    if (!isMonth(month)) {
      res.status(400).json({ error: 'INVALID_MONTH' });
      return;
    }
    const amount = parseNonNegative(body.amount);
    if (amount === null) {
      res.status(400).json({ error: 'INVALID_AMOUNT' });
      return;
    }

    const { data, error } = await getSupabase()
      .from('budgets')
      .upsert({ month, amount, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'DB_ERROR', detail: error.message });
      return;
    }

    res.json({ budget: { month: (data as BudgetRow).month, amount: Number((data as BudgetRow).amount) } });
  } catch (err: any) {
    if (err?.message === 'DB_NOT_CONFIGURED') {
      res.status(503).json({ error: 'NOT_CONFIGURED' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});