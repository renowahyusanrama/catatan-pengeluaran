import type { ReactNode } from 'react';
import { LayoutDashboard, ReceiptText, BarChart3, Settings, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type Page = 'dashboard' | 'transactions' | 'reports' | 'settings';

const NAV_ITEMS: { key: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'transactions', label: 'Transaksi', icon: ReceiptText },
  { key: 'reports', label: 'Laporan', icon: BarChart3 },
  { key: 'settings', label: 'Pengaturan', icon: Settings },
];

interface LayoutProps {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ page, onNavigate, children }: LayoutProps) {
  const { openAdd } = useApp();

  const left = NAV_ITEMS.filter((_, i) => i < 2);
  const right = NAV_ITEMS.filter((_, i) => i >= 2);

  return (
    <div className="min-h-screen bg-ground">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <ReceiptText size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink">Catatan Pengeluaran</p>
            <p className="text-xs text-ink-muted">Pencatatan pribadi</p>
          </div>
        </div>

        <div className="px-4 pt-1">
          <button type="button" onClick={openAdd} className="btn-primary w-full py-2.5 text-sm">
            <Plus size={17} />
            Tambah Pengeluaran
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-fill text-ink' : 'text-ink-soft hover:bg-fill/60 hover:text-ink'
                }`}
              >
                <Icon size={18} className={active ? 'text-brand-600' : 'text-ink-muted'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-ground/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <ReceiptText size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">Catatan Pengeluaran</span>
        </div>
      </header>

      {/* Konten */}
      <main className="pb-28 lg:pb-12 lg:pl-60">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:py-8">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5 items-center px-2 pt-1.5 pb-2">
          {left.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium ${
                  active ? 'text-brand-600' : 'text-ink-muted'
                }`}
              >
                <Icon size={21} />
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={openAdd}
            className="mx-auto -mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-transform active:scale-95"
            aria-label="Tambah pengeluaran"
          >
            <Plus size={26} />
          </button>

          {right.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium ${
                  active ? 'text-brand-600' : 'text-ink-muted'
                }`}
              >
                <Icon size={21} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}