import { useState } from 'react';
import { Wallet, CalendarDays, CalendarRange, ReceiptText, ChevronRight, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToday } from '../hooks/useToday';
import { formatIDR } from '../lib/format';
import { currentMonth, monthRangeISO, startOfWeekISO, endOfWeekISO } from '../lib/dates';
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
  const recent = transactions.slice(0, 5);

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteTransaction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Ringkasan</h1>
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hari ini" value={formatIDR(todayTotal)} icon={<CalendarDays size={16} />} />
        <StatCard label="Minggu ini" value={formatIDR(weekTotal)} icon={<CalendarRange size={16} />} />
        <StatCard label="Bulan ini" value={formatIDR(monthTotal)} icon={<Wallet size={16} />} />
        <StatCard label="Transaksi" value={String(monthCount)} hint="bulan ini" icon={<ReceiptText size={16} />} accent="bg-gray-300" />
      </div>

      {budget !== null && (
        <div className="card p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Anggaran bulan ini</p>
          <BudgetBar budget={budget} spent={monthTotal} />
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-gray-500">Memuat…</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Inbox size={32} />}
          title="Belum ada pengeluaran"
          description="Mulai catat pengeluaran pertama kamu hari ini."
          action={
            <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
              Tambah Pengeluaran
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {categories.length > 0 && (
              <div className="card p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">Kategori terbesar</p>
                <CategoryList totals={categories.slice(0, 5)} total={sumAmount(monthTx)} />
              </div>
            )}

            <div className="card">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-700">Transaksi terbaru</p>
              </div>
              {recent.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada transaksi.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
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