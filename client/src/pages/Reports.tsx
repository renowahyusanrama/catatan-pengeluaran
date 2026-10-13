import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { Inbox } from 'lucide-react';
import type { Transaction } from '../lib/types';

type Tab = 'week' | 'month';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload[0].value as number;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-gray-900">{formatIDR(total)}</p>
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Laporan</h1>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
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
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              tab === key ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'week' ? (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                aria-label="Minggu sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {formatDayShort(weekStart)} – {formatDayShort(weekEnd)}
                </p>
                {isCurrentWeek ? (
                  <span className="text-xs text-brand-600">Minggu berjalan</span>
                ) : (
                  <button type="button" onClick={() => setWeekStart(startOfWeekISO(today))} className="text-xs text-brand-600 hover:underline">
                    Kembali ke minggu ini
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
                disabled={isCurrentWeek}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Minggu berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-semibold text-gray-900">{formatIDR(weekTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rata-rata/hari</p>
                <p className="text-base font-semibold text-gray-900">{formatIDR(weekAvg)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transaksi</p>
                <p className="text-base font-semibold text-gray-900">{weekTxs.length}</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) => formatCompactIDR(v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="total" fill="#23a466" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {weekCategories.length > 0 && (
            <div className="card p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Kategori terbesar</p>
              <CategoryList totals={weekCategories.slice(0, 5)} total={weekTotal} />
            </div>
          )}

          <TransactionListSection txs={weekTxs} loading={loading} onEdit={openEdit} onDelete={setPendingDelete} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth(addMonthsISO(month, -1))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">{monthLabel(month)}</p>
                {isCurrentMonth ? (
                  <span className="text-xs text-brand-600">Bulan berjalan</span>
                ) : (
                  <button type="button" onClick={() => setMonth(currentMonth())} className="text-xs text-brand-600 hover:underline">
                    Kembali ke bulan ini
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMonth(addMonthsISO(month, 1))}
                disabled={isCurrentMonth}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-semibold text-gray-900">{formatIDR(monthTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Rata-rata/hari ada transaksi</p>
                <p className="text-base font-semibold text-gray-900">{formatIDR(monthAvg)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Transaksi</p>
                <p className="text-base font-semibold text-gray-900">{monthCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">vs bulan lalu</p>
                <p
                  className={`flex items-center justify-center gap-1 text-base font-semibold ${
                    change === null ? 'text-gray-400' : change > 0 ? 'text-red-600' : 'text-brand-600'
                  }`}
                >
                  {change === null ? (
                    '—'
                  ) : (
                    <>
                      {change > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {Math.abs(change).toFixed(0)}%
                    </>
                  )}
                </p>
                {change !== null && (
                  <p className="text-[11px] text-gray-400">bulan lalu {formatIDR(prevTotal)}</p>
                )}
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) => formatCompactIDR(v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="total" fill="#23a466" radius={[3, 3, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {monthCategories.length > 0 && (
            <div className="card p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Pengeluaran berdasarkan kategori</p>
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
    <div className="card">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">Daftar transaksi</p>
      </div>
      {loading ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">Memuat…</p>
      ) : txs.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState icon={<Inbox size={28} />} title="Tidak ada transaksi" description="Tidak ada pengeluaran pada periode ini." />
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {txs.map((tx) => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              onEdit={(t) => onEdit(t)}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}