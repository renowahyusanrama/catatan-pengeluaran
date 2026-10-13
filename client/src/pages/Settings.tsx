import { useMemo, useState, type ReactNode } from 'react';
import { Database, Download, Trash2, KeyRound, HardDrive, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { currentMonth, monthRangeISO } from '../lib/dates';
import { parseNumeric, formatInputIDR, formatIDR } from '../lib/format';
import { CATEGORIES } from '../lib/categories';
import { filterRange } from '../lib/analytics';
import { transactionsToCSV, downloadCSV } from '../lib/csv';
import { isRemoteConfigured } from '../store/api';
import { getAccessKey } from '../store/localStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { DbStatus } from '../lib/types';

const DB_STATUS_TEXT: Record<DbStatus, { title: string; desc: string; tone: string }> = {
  local: {
    title: 'Mode lokal',
    desc: 'Data disimpan di perangkat ini (localStorage). Tidak tersinkron ke perangkat lain.',
    tone: 'bg-fill text-ink-soft',
  },
  remote: {
    title: 'Terhubung ke database',
    desc: 'Data tersimpan di Supabase dan dapat diakses dari perangkat lain.',
    tone: 'bg-brand-50 text-brand-700',
  },
  remote_unconfigured: {
    title: 'Backend belum dikonfigurasi',
    desc: 'Backend aktif, namun Supabase belum diisi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di server.',
    tone: 'bg-amber-50 text-amber-800',
  },
  remote_auth_required: {
    title: 'Kunci akses diperlukan',
    desc: 'Masukkan kunci akses (ACCESS_KEY) di bawah untuk menyambung ke database.',
    tone: 'bg-amber-50 text-amber-800',
  },
  remote_error: {
    title: 'Gagal terhubung',
    desc: 'Backend tidak dapat dijangkau atau terjadi kesalahan. Periksa URL dan log server.',
    tone: 'bg-red-50 text-red-700',
  },
};

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-ink-muted">{icon}</span>
      <h2 className="text-base font-semibold tracking-tight text-ink">{children}</h2>
    </div>
  );
}

export function Settings() {
  const {
    budget,
    budgetMonth,
    saveBudget,
    deleteAll,
    saveAccessKey,
    clearAccessKey,
    transactions,
    dbStatus,
  } = useApp();

  const [budgetDigits, setBudgetDigits] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [exportCategory, setExportCategory] = useState('');
  const [exportRange, setExportRange] = useState<'all' | 'month'>('all');
  const [accessInput, setAccessInput] = useState(getAccessKey());
  const [savingKey, setSavingKey] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const currentBudget = budgetDigits === '' && budget !== null ? String(budget) : budgetDigits;

  const onSaveBudget = async () => {
    const amount = parseInt(currentBudget, 10);
    if (Number.isNaN(amount) || amount < 0) {
      return;
    }
    const ok = await saveBudget(amount);
    if (ok) {
      setBudgetSaved(true);
      setBudgetDigits('');
      window.setTimeout(() => setBudgetSaved(false), 2500);
    }
  };

  const exportList = useMemo(() => {
    let list = transactions;
    if (exportRange === 'month') {
      const range = monthRangeISO(currentMonth());
      list = filterRange(list, range.start, range.end);
    }
    if (exportCategory) {
      list = list.filter((t) => t.category === exportCategory);
    }
    return list;
  }, [transactions, exportRange, exportCategory]);

  const onExport = () => {
    const stamp = exportRange === 'month' ? currentMonth() : 'semua';
    downloadCSV(`pengeluaran-${stamp}.csv`, transactionsToCSV(exportList));
  };

  const onSaveKey = async () => {
    setSavingKey(true);
    await saveAccessKey(accessInput);
    setSavingKey(false);
  };

  const onConfirmClear = async () => {
    setClearing(true);
    await deleteAll();
    setClearing(false);
    setConfirmClear(false);
  };

  const status = DB_STATUS_TEXT[dbStatus];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Pengaturan</h1>

      <section className="card p-5">
        <SectionTitle icon={<Wallet size={18} />}>Anggaran Bulanan</SectionTitle>
        <p className="mb-4 text-sm text-ink-muted">
          Batas pengeluaran untuk {budgetMonth ? `bulan ${budgetMonth}` : 'bulan ini'} (kosongkan untuk menonaktifkan).
        </p>
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-ink-muted">Rp</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="Contoh: 2000000"
              value={formatInputIDR(currentBudget)}
              onChange={(e) => setBudgetDigits(parseNumeric(e.target.value))}
              className="input pl-10"
            />
          </div>
          <button type="button" onClick={onSaveBudget} className="btn-primary px-5 py-3 text-sm">
            {budgetSaved ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>
        {budget !== null && (
          <p className="mt-3 text-sm text-ink-muted">
            Anggaran saat ini: <span className="tnum font-medium text-ink">{formatIDR(budget)}</span> / bulan
          </p>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle icon={<Download size={18} />}>Ekspor Data (CSV)</SectionTitle>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-fill p-1">
              {(
                [
                  ['all', 'Semua'],
                  ['month', 'Bulan Ini'],
                ] as ['all' | 'month', string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExportRange(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    exportRange === key ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={exportCategory}
              onChange={(e) => setExportCategory(e.target.value)}
              className="input w-auto py-2.5 text-sm"
              aria-label="Filter kategori ekspor"
            >
              <option value="">Semua kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onExport} className="btn-secondary px-5 py-2.5 text-sm" disabled={exportList.length === 0}>
              <Download size={15} />
              Unduh CSV ({exportList.length})
            </button>
            <span className="text-sm text-ink-muted">Terbuka di Excel / Google Sheets.</span>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle icon={<Database size={18} />}>Status Koneksi</SectionTitle>
        <div className={`rounded-xl px-4 py-3 text-sm ${status.tone}`}>
          <p className="font-medium">{status.title}</p>
          <p className="mt-0.5 text-sm opacity-80">{status.desc}</p>
        </div>

        {isRemoteConfigured() && (
          <div className="mt-4 space-y-3">
            <label htmlFor="accessKey" className="label flex items-center gap-1.5">
              <KeyRound size={15} className="text-ink-muted" />
              Kunci akses bersama
            </label>
            <input
              id="accessKey"
              type="password"
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value)}
              placeholder="Masukkan ACCESS_KEY"
              className="input"
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onSaveKey} className="btn-primary px-5 py-2.5 text-sm" disabled={savingKey}>
                {savingKey ? 'Menyambung…' : 'Simpan & Sambungkan'}
              </button>
              {getAccessKey() && (
                <button type="button" onClick={clearAccessKey} className="btn-secondary px-5 py-2.5 text-sm">
                  Hapus kunci
                </button>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              Kunci disimpan di perangkat ini dan dikirim ke backend untuk validasi, bukan ke database publik.
            </p>
          </div>
        )}

        {!isRemoteConfigured() && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-muted">
            <HardDrive size={15} />
            Isi VITE_API_URL di <code className="rounded bg-fill px-1.5 py-0.5">client/.env</code> untuk mengaktifkan sinkronisasi online.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-red-50 p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="text-red-500">
            <Trash2 size={18} />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-ink">Zona Berbahaya</h2>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Menghapus seluruh data transaksi. Tindakan ini tidak dapat dibatalkan.
        </p>
        <button type="button" onClick={() => setConfirmClear(true)} className="btn-danger px-5 py-2.5 text-sm">
          Hapus semua data
        </button>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Hapus semua data?"
        message="Seluruh transaksi akan dihapus permanen dan tidak dapat dikembalikan."
        confirmLabel="Hapus semua"
        busy={clearing}
        onConfirm={onConfirmClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}