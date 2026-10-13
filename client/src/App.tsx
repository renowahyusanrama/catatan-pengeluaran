import { useState } from 'react';
import { AlertTriangle, KeyRound, Plug } from 'lucide-react';
import { Layout, type Page } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { TransactionForm } from './components/TransactionForm';
import { ToastContainer } from './components/ToastContainer';
import { useApp } from './context/AppContext';

function ConnectionBanner() {
  const { dbStatus, notify } = useApp();
  if (dbStatus === 'local' || dbStatus === 'remote') return null;

  const map = {
    remote_unconfigured: {
      icon: <Plug size={15} />,
      text: 'Database online belum dikonfigurasi — data disimpan lokal di perangkat ini.',
    },
    remote_auth_required: {
      icon: <KeyRound size={15} />,
      text: 'Kunci akses diperlukan untuk sinkronisasi. Atur di halaman Pengaturan.',
    },
    remote_error: {
      icon: <AlertTriangle size={15} />,
      text: 'Tidak dapat terhubung ke database. Data tetap tersimpan lokal.',
    },
  } as const;

  const info = map[dbStatus];

  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {info.icon}
      <button type="button" className="text-left" onClick={() => notify(info.text, 'info')}>
        {info.text}
      </button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Layout page={page} onNavigate={navigate}>
        <ConnectionBanner />
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'transactions' && <Transactions />}
        {page === 'reports' && <Reports />}
        {page === 'settings' && <Settings />}
      </Layout>

      <TransactionForm />
      <ToastContainer />
    </>
  );
}