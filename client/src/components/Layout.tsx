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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ReceiptText size={17} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">Catatan Pengeluaran</p>
            <p className="text-[11px] text-gray-500">Pencatatan pribadi</p>
          </div>
        </div>

        <div className="px-3 pt-2">
          <button type="button" onClick={openAdd} className="btn-primary w-full px-3 py-2 text-sm">
            <Plus size={16} />
            Tambah
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={active ? 'text-brand-600' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ReceiptText size={15} />
          </div>
          <span className="text-sm font-semibold text-gray-900">Catatan Pengeluaran</span>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary px-3 py-1.5 text-sm"
        >
          <Plus size={15} />
          Tambah
        </button>
      </header>

      {/* Konten */}
      <main className="pb-24 lg:pb-8 lg:pl-56">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:py-8">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? 'text-brand-600' : 'text-gray-500'
                }`}
              >
                <Icon size={21} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* FAB mobile */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform active:scale-95 lg:hidden"
        aria-label="Tambah pengeluaran"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}