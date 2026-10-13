import { useState } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToday } from '../hooks/useToday';
import { formatIDR } from '../lib/format';
import { currentMonth, monthLabel, monthRangeISO, startOfWeekISO, endOfWeekISO } from '../lib/dates';
import { sumAmount, filterRange, countTx, categoryTotals } from '../lib/analytics';
import { StatCard } from '../components/StatCard';
import { BudgetBar } from '../components/BudgetBar';
import { CategoryList } from '../components/CategoryList';
import { EmptyState } from '../components/EmptyState';
import { TransactionItem } from '../components/TransactionItem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Transaction } from '../lib/types';
import type { Page } from '../components/Layout';

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { transactions, budget, openAdd, openEdit, deleteTransaction, loading } = useApp();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const today = useToday();

  const weekStart = startOfWeekISO(today);
  const weekEnd = endOfWeekISO(today);
  const month = currentMonth();
  const range = monthRangeISO(month);

  const todayTx = filterRange(transactions, today, today);
  const weekTx = filterRange(transactions, weekStart, weekEnd);
  const monthTx = filterRange(transactions, range.start, range.end);

  const todayTotal = sumAmount(todayTx);
  const weekTotal = sumAmount(weekTx);
  const monthTotal = sumAmount(monthTx);
  const monthCount = countTx(monthTx);

  const categories = categoryTotals(monthTx);
  const recent = transactions.slice(0, 6);

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteTransaction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Ringkasan</h1>
        {monthTx.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Semua transaksi
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Memuat…</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Inbox size={36} />}
          title="Belum ada pengeluaran"
          description="Mulai catat pengeluaran pertama kamu hari ini."
          action={
            <button type="button" onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
              Tambah Pengeluaran
            </button>
          }
        />
      ) : (
        <>
          <section>
            <p className="text-sm font-medium text-ink-muted">{monthLabel(month)}</p>
            <p className="tnum mt-1 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">
              {formatIDR(monthTotal)}
            </p>

            {budget !== null && (
              <div className="mt-5 max-w-lg">
                <BudgetBar budget={budget} spent={monthTotal} />
              </div>
            )}

            <div className="mt-7 grid grid-cols-3 gap-4 max-w-md">
              <StatCard label="Hari ini" value={formatIDR(todayTotal)} />
              <StatCard label="Minggu ini" value={formatIDR(weekTotal)} />
              <StatCard label="Transaksi" value={String(monthCount)} hint="bulan ini" />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {categories.length > 0 && (
              <div className="card p-5">
                <p className="mb-4 text-sm font-medium text-ink-soft">Kategori terbesar</p>
                <CategoryList totals={categories.slice(0, 5)} total={monthTotal} />
              </div>
            )}

            <div className="card p-2">
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-sm font-medium text-ink-soft">Transaksi terbaru</p>
              </div>
              {recent.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">Tidak ada transaksi.</p>
              ) : (
                <ul className="space-y-0.5">
                  {recent.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onEdit={openEdit} onDelete={setPendingDelete} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus transaksi?"
        message={pendingDelete ? `"${pendingDelete.description}" sebesar ${formatIDR(pendingDelete.amount)} akan dihapus permanen.` : ''}
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}