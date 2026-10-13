import { useMemo, useState } from 'react';
import { Search, Inbox, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToday } from '../hooks/useToday';
import { CATEGORIES } from '../lib/categories';
import { currentMonth, monthRangeISO, startOfWeekISO, endOfWeekISO } from '../lib/dates';
import { formatIDR } from '../lib/format';
import { sumAmount } from '../lib/analytics';
import { TransactionItem } from '../components/TransactionItem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import type { Transaction } from '../lib/types';

type Preset = 'all' | 'today' | 'week' | 'month';

const PAGE_SIZE = 30;

export function Transactions() {
  const { transactions, openAdd, openEdit, deleteTransaction, loading } = useApp();
  const today = useToday();

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [preset, setPreset] = useState<Preset>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setVisible(PAGE_SIZE);
    if (p === 'today') {
      setFrom(today);
      setTo(today);
    } else if (p === 'week') {
      setFrom(startOfWeekISO(today));
      setTo(endOfWeekISO(today));
    } else if (p === 'month') {
      const range = monthRangeISO(currentMonth());
      setFrom(range.start);
      setTo(range.end);
    } else {
      setFrom('');
      setTo('');
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        if (!t.description.toLowerCase().includes(needle) && !t.note.toLowerCase().includes(needle)) return false;
      }
      if (category && t.category !== category) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }, [transactions, q, category, from, to]);

  const visibleList = filtered.slice(0, visible);
  const totalFiltered = sumAmount(filtered);

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const ok = await deleteTransaction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (ok) setVisible(PAGE_SIZE);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Transaksi</h1>
        <button type="button" onClick={openAdd} className="btn-primary px-3 py-2 text-sm">
          Tambah
        </button>
      </div>

      <div className="card space-y-3 p-3 sm:p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama transaksi…"
            className="input pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', 'Semua'],
                ['today', 'Hari ini'],
                ['week', 'Minggu ini'],
                ['month', 'Bulan ini'],
              ] as [Preset, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  preset === key
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-auto px-3 py-1.5 text-sm"
            aria-label="Filter kategori"
          >
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <CalendarDays size={15} />
            Dari
          </span>
          <input type="date" value={from} max={today} onChange={(e) => { setFrom(e.target.value); setPreset('all'); setVisible(PAGE_SIZE); }} className="input w-auto px-2 py-1.5" />
          <span className="text-gray-500">sampai</span>
          <input type="date" value={to} max={today} onChange={(e) => { setTo(e.target.value); setPreset('all'); setVisible(PAGE_SIZE); }} className="input w-auto px-2 py-1.5" />
          {(from || to) && (
            <button type="button" onClick={() => applyPreset('all')} className="text-sm text-brand-600 hover:underline">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm">
        <span className="text-gray-500">
          {filtered.length} transaksi
        </span>
        {filtered.length > 0 && <span className="font-medium text-gray-900">{formatIDR(totalFiltered)}</span>}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-gray-500">Memuat…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox size={32} />}
          title="Tidak ada transaksi"
          description="Coba ubah filter atau tambahkan pengeluaran baru."
          action={
            <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
              Tambah Pengeluaran
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {visibleList.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} onEdit={openEdit} onDelete={setPendingDelete} />
            ))}
          </ul>
          {visible < filtered.length && (
            <div className="border-t border-gray-100 p-3 text-center">
              <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary px-4 py-2 text-sm">
                Muat lebih banyak ({filtered.length - visible} tersisa)
              </button>
            </div>
          )}
        </div>
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