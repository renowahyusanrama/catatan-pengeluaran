import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Inbox } from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useToday } from '../hooks/useToday';
import {
  addDaysISO,
  addMonthsISO,
  currentMonth,
  DAY_SHORT,
  daysInMonth,
  endOfWeekISO,
  formatDayShort,
  monthLabel,
  monthRangeISO,
  startOfWeekISO,
} from '../lib/dates';
import { formatIDR, formatCompactIDR } from '../lib/format';
import { filterRange, sumAmount, categoryTotals, dailyTotals, countTx } from '../lib/analytics';
import { CategoryList } from '../components/CategoryList';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Transaction } from '../lib/types';

type Tab = 'week' | 'month';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload[0].value as number;
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs">
      <p className="text-ink-muted">{label}</p>
      <p className="tnum font-medium text-white">{formatIDR(total)}</p>
    </div>
  );
}

export function Reports() {
  const { transactions, openEdit, deleteTransaction, loading } = useApp();
  const today = useToday();

  const [tab, setTab] = useState<Tab>('month');
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeekISO(today));
  const [month, setMonth] = useState<string>(() => currentMonth());
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteTransaction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
  };

  // ===== Mingguan =====
  const weekEnd = endOfWeekISO(weekStart);
  const weekTxs = useMemo(() => filterRange(transactions, weekStart, weekEnd), [transactions, weekStart, weekEnd]);
  const weekDays = useMemo(() => {
    const days: { iso: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDaysISO(weekStart, i);
      days.push({ iso, label: DAY_SHORT[i] });
    }
    return days;
  }, [weekStart]);
  const weekChart = useMemo(() => dailyTotals(transactions, weekDays), [transactions, weekDays]);
  const weekTotal = sumAmount(weekTxs);
  const weekAvg = weekTxs.length > 0 ? weekTotal / 7 : 0;
  const weekCategories = categoryTotals(weekTxs);
  const isCurrentWeek = weekStart === startOfWeekISO(today);

  // ===== Bulanan =====
  const monthRange = monthRangeISO(month);
  const monthTxs = useMemo(
    () => filterRange(transactions, monthRange.start, monthRange.end),
    [transactions, monthRange.start, monthRange.end],
  );
  const monthChart = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const total = daysInMonth(y, m);
    const days: { iso: string; label: string }[] = [];
    for (let d = 1; d <= total; d++) {
      const iso = `${month}-${String(d).padStart(2, '0')}`;
      days.push({ iso, label: String(d) });
    }
    return dailyTotals(transactions, days);
  }, [transactions, month]);

  const monthTotal = sumAmount(monthTxs);
  const monthCount = countTx(monthTxs);
  const monthAvg = monthCount > 0 ? monthTotal / monthCount : 0;
  const monthCategories = categoryTotals(monthTxs);

  const prevMonth = addMonthsISO(month, -1);
  const prevRange = monthRangeISO(prevMonth);
  const prevTotal = sumAmount(filterRange(transactions, prevRange.start, prevRange.end));
  const change = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : null;

  const isCurrentMonth = month === currentMonth();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Laporan</h1>
        <div className="inline-flex rounded-full bg-fill p-1">
          {(
            [
              ['week', 'Mingguan'],
              ['month', 'Bulanan'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === key ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'week' ? (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
                className="grid h-9 w-9 place-items-center rounded-full bg-fill text-ink-soft transition-colors hover:bg-line"
                aria-label="Minggu sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-base font-semibold tracking-tight text-ink">
                  {formatDayShort(weekStart)} – {formatDayShort(weekEnd)}
                </p>
                {isCurrentWeek ? (
                  <span className="text-sm text-brand-600">Minggu berjalan</span>
                ) : (
                  <button type="button" onClick={() => setWeekStart(startOfWeekISO(today))} className="text-sm text-brand-600 hover:underline">
                    Kembali ke minggu ini
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
                disabled={isCurrentWeek}
                className="grid h-9 w-9 place-items-center rounded-full bg-fill text-ink-soft transition-colors hover:bg-line disabled:opacity-40"
                aria-label="Minggu berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-sm text-ink-muted">Total</p>
                <p className="tnum text-lg font-semibold text-ink">{formatIDR(weekTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Rata-rata/hari</p>
                <p className="tnum text-lg font-semibold text-ink">{formatIDR(weekAvg)}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Transaksi</p>
                <p className="tnum text-lg font-semibold text-ink">{weekTxs.length}</p>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8a8f85' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8f85' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => formatCompactIDR(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(23,25,20,0.05)' }} />
                  <Bar dataKey="total" fill="#1a6a4a" radius={[5, 5, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {weekCategories.length > 0 && (
            <div className="card p-5">
              <p className="mb-4 text-sm font-medium text-ink-soft">Kategori terbesar</p>
              <CategoryList totals={weekCategories.slice(0, 5)} total={weekTotal} />
            </div>
          )}

          <TransactionListSection txs={weekTxs} loading={loading} onEdit={openEdit} onDelete={setPendingDelete} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth(addMonthsISO(month, -1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-fill text-ink-soft transition-colors hover:bg-line"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-base font-semibold tracking-tight text-ink">{monthLabel(month)}</p>
                {isCurrentMonth ? (
                  <span className="text-sm text-brand-600">Bulan berjalan</span>
                ) : (
                  <button type="button" onClick={() => setMonth(currentMonth())} className="text-sm text-brand-600 hover:underline">
                    Kembali ke bulan ini
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMonth(addMonthsISO(month, 1))}
                disabled={isCurrentMonth}
                className="grid h-9 w-9 place-items-center rounded-full bg-fill text-ink-soft transition-colors hover:bg-line disabled:opacity-40"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-ink-muted">Total</p>
                <p className="tnum text-lg font-semibold text-ink">{formatIDR(monthTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-ink-muted">Rata-rata/hari</p>
                <p className="tnum text-lg font-semibold text-ink">{formatIDR(monthAvg)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-ink-muted">Transaksi</p>
                <p className="tnum text-lg font-semibold text-ink">{monthCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-ink-muted">vs bulan lalu</p>
                <p
                  className={`tnum flex items-center justify-center gap-1 text-lg font-semibold ${
                    change === null ? 'text-ink-muted' : change > 0 ? 'text-red-600' : 'text-brand-600'
                  }`}
                >
                  {change === null ? (
                    '—'
                  ) : (
                    <>
                      {change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {Math.abs(change).toFixed(0)}%
                    </>
                  )}
                </p>
                {change !== null && (
                  <p className="text-sm text-ink-muted">bulan lalu {formatIDR(prevTotal)}</p>
                )}
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#8a8f85' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8f85' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => formatCompactIDR(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(23,25,20,0.05)' }} />
                  <Bar dataKey="total" fill="#1a6a4a" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {monthCategories.length > 0 && (
            <div className="card p-5">
              <p className="mb-4 text-sm font-medium text-ink-soft">Pengeluaran berdasarkan kategori</p>
              <CategoryList totals={monthCategories} total={monthTotal} />
            </div>
          )}

          <TransactionListSection txs={monthTxs} loading={loading} onEdit={openEdit} onDelete={setPendingDelete} />
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

function TransactionListSection({
  txs,
  loading,
  onEdit,
  onDelete,
}: {
  txs: ReturnType<typeof filterRange>;
  loading: boolean;
  onEdit: (t: (typeof txs)[number]) => void;
  onDelete: (t: Transaction) => void;
}) {
  return (
    <div className="card p-2">
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-ink-soft">Daftar transaksi</p>
      </div>
      {loading ? (
        <p className="px-3 py-8 text-center text-sm text-ink-muted">Memuat…</p>
      ) : txs.length === 0 ? (
        <div className="px-3 py-6">
          <EmptyState icon={<Inbox size={28} />} title="Tidak ada transaksi" description="Tidak ada pengeluaran pada periode ini." />
        </div>
      ) : (
        <ul className="space-y-0.5">
          {txs.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} onEdit={(t) => onEdit(t)} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}