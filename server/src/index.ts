import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { transactionsRouter } from './routes/transactions.js';
import { budgetRouter } from './routes/budget.js';
import { requireAccess, isAccessConfigured } from './middleware/auth.js';
import { checkDbConnection, isDbConfigured } from './db.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Health check publik (tanpa akses key) agar frontend tahu status DB.
app.get('/api/health', async (_req, res) => {
  const configured = isDbConfigured();
  const connected = await checkDbConnection();
  res.json({
    mode: 'remote',
    db: !configured ? 'not_configured' : connected ? 'connected' : 'error',
    accessRequired: isAccessConfigured(),
  });
});

app.use('/api/transactions', requireAccess, transactionsRouter);
app.use('/api/budget', requireAccess, budgetRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] supabase configured: ${isDbConfigured()}`);
  console.log(`[server] access key configured: ${isAccessConfigured()}`);
});