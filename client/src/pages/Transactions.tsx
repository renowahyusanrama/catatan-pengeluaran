import { useMemo, useState } from 'react';
import { Search, Inbox } from 'lucide-react';
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Transaksi</h1>
        <button type="button" onClick={openAdd} className="btn-primary px-5 py-2 text-sm">
          Tambah
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama transaksi…"
            className="input pl-11"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
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
                className={`chip ${preset === key ? 'bg-ink text-white' : 'bg-fill text-ink-soft hover:bg-line'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-auto py-2.5 text-sm"
            aria-label="Filter kategori"
          >
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              max={today}
              onChange={(e) => { setFrom(e.target.value); setPreset('all'); setVisible(PAGE_SIZE); }}
              className="input w-auto py-2.5 text-sm"
              aria-label="Dari tanggal"
            />
            <span className="text-sm text-ink-muted">sampai</span>
            <input
              type="date"
              value={to}
              max={today}
              onChange={(e) => { setTo(e.target.value); setPreset('all'); setVisible(PAGE_SIZE); }}
              className="input w-auto py-2.5 text-sm"
              aria-label="Sampai tanggal"
            />
            {(from || to) && (
              <button type="button" onClick={() => applyPreset('all')} className="btn-ghost px-3 py-2 text-sm">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm">
        <span className="text-ink-muted">
          {filtered.length} transaksi
        </span>
        {filtered.length > 0 && <span className="tnum font-medium text-ink">{formatIDR(totalFiltered)}</span>}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-muted">Memuat…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox size={36} />}
          title="Tidak ada transaksi"
          description="Coba ubah filter atau tambahkan pengeluaran baru."
          action={
            <button type="button" onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
              Tambah Pengeluaran
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-2">
          <ul className="space-y-0.5">
            {visibleList.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} onEdit={openEdit} onDelete={setPendingDelete} />
            ))}
          </ul>
          {visible < filtered.length && (
            <div className="p-3 text-center">
              <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary px-5 py-2.5 text-sm">
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