import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Transaction, Budget, TransactionInput, DbStatus, ApiError } from '../lib/types';
import { currentMonth } from '../lib/dates';
import { localBackend, setAccessKey, type ListFilter } from '../store/localStore';
import { remoteBackend, fetchHealth, isRemoteConfigured } from '../store/api';

interface Backend {
  mode: 'local' | 'remote';
  list(filter?: ListFilter): Promise<{ data: Transaction[]; total: number }>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, patch: Partial<TransactionInput>): Promise<Transaction>;
  remove(id: string): Promise<void>;
  removeAll(): Promise<void>;
  getBudget(month: string): Promise<Budget | null>;
  setBudget(month: string, amount: number): Promise<Budget>;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextValue {
  transactions: Transaction[];
  budget: number | null;
  budgetMonth: string;
  loading: boolean;
  refreshing: boolean;
  dbMode: 'local' | 'remote';
  dbStatus: DbStatus;
  toasts: ToastMessage[];
  notify: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: number) => void;
  addTransaction: (input: TransactionInput) => Promise<boolean>;
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  deleteAll: () => Promise<boolean>;
  saveBudget: (amount: number) => Promise<boolean>;
  refresh: () => Promise<void>;
  saveAccessKey: (key: string) => Promise<boolean>;
  clearAccessKey: () => void;
  formOpen: boolean;
  editingTx: Transaction | null;
  openAdd: () => void;
  openEdit: (tx: Transaction) => void;
  closeForm: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function isUnauthorized(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as ApiError).error === 'UNAUTHORIZED');
}

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetMonth, setBudgetMonth] = useState<string>(currentMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus>('local');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const backendRef = useRef<Backend>(localBackend);

  const notify = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadMonthBudget = useCallback(async (backend: Backend, month: string) => {
    try {
      const b = await backend.getBudget(month);
      setBudgetMonth(month);
      setBudget(b?.amount ?? null);
    } catch {
      setBudget(null);
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);

    let backend: Backend = localBackend;
    let status: DbStatus = 'local';

    if (isRemoteConfigured()) {
      try {
        const health = await fetchHealth();
        if (health && health.db === 'connected') {
          backend = remoteBackend;
          status = 'remote';
          try {
            const result = await backend.list();
            setTransactions(result.data);
          } catch (err) {
            if (isUnauthorized(err)) {
              status = 'remote_auth_required';
            } else {
              status = 'remote_error';
            }
          }
        } else if (health && health.db === 'not_configured') {
          status = 'remote_unconfigured';
        } else {
          status = 'remote_error';
        }
      } catch {
        status = 'remote_error';
      }
    }

    if (backend.mode === 'local') {
      const result = await localBackend.list();
      setTransactions(result.data);
    }

    backendRef.current = backend;
    setDbStatus(status);

    const month = currentMonth();
    await loadMonthBudget(backend, month);

    setLoading(false);
    return status;
  }, [loadMonthBudget]);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await backendRef.current.list();
      setTransactions(result.data);
      const month = currentMonth();
      await loadMonthBudget(backendRef.current, month);
    } catch (err) {
      if (isUnauthorized(err)) {
        setDbStatus('remote_auth_required');
      }
      notify('Gagal memuat ulang data.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [loadMonthBudget, notify]);

  const addTransaction = useCallback(
    async (input: TransactionInput): Promise<boolean> => {
      try {
        const created = await backendRef.current.create(input);
        setTransactions((prev) => {
          const next = [created, ...prev];
          next.sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
          return next;
        });
        notify('Pengeluaran berhasil disimpan.');
        return true;
      } catch (err) {
        if (isUnauthorized(err)) setDbStatus('remote_auth_required');
        notify(err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran.', 'error');
        return false;
      }
    },
    [notify],
  );

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<TransactionInput>): Promise<boolean> => {
      try {
        const updated = await backendRef.current.update(id, patch);
        setTransactions((prev) =>
          prev
            .map((t) => (t.id === id ? updated : t))
            .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date))),
        );
        notify('Perubahan disimpan.');
        return true;
      } catch (err) {
        if (isUnauthorized(err)) setDbStatus('remote_auth_required');
        notify('Gagal menyimpan perubahan.', 'error');
        return false;
      }
    },
    [notify],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await backendRef.current.remove(id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        notify('Transaksi dihapus.');
        return true;
      } catch (err) {
        if (isUnauthorized(err)) setDbStatus('remote_auth_required');
        notify('Gagal menghapus transaksi.', 'error');
        return false;
      }
    },
    [notify],
  );

  const deleteAll = useCallback(async (): Promise<boolean> => {
    try {
      await backendRef.current.removeAll();
      setTransactions([]);
      notify('Semua transaksi dihapus.');
      return true;
    } catch (err) {
      if (isUnauthorized(err)) setDbStatus('remote_auth_required');
      notify('Gagal menghapus semua data.', 'error');
      return false;
    }
  }, [notify]);

  const saveBudget = useCallback(
    async (amount: number): Promise<boolean> => {
      const month = currentMonth();
      try {
        const b = await backendRef.current.setBudget(month, amount);
        setBudgetMonth(month);
        setBudget(b.amount);
        notify('Anggaran disimpan.');
        return true;
      } catch (err) {
        if (isUnauthorized(err)) setDbStatus('remote_auth_required');
        notify('Gagal menyimpan anggaran.', 'error');
        return false;
      }
    },
    [notify],
  );

  const saveAccessKey = useCallback(
    async (key: string): Promise<boolean> => {
      setAccessKey(key.trim());
      const status = await init();
      const ok = status === 'remote';
      notify(ok ? 'Terhubung ke database.' : 'Kunci tersimpan, cek status koneksi.', ok ? 'success' : 'info');
      return ok;
    },
    [init, notify],
  );

  const clearAccessKey = useCallback(() => {
    setAccessKey('');
    void init();
  }, [init]);

  const openAdd = useCallback(() => {
    setEditingTx(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingTx(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      transactions,
      budget,
      budgetMonth,
      loading,
      refreshing,
      dbMode: backendRef.current.mode,
      dbStatus,
      toasts,
      notify,
      dismissToast,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAll,
      saveBudget,
      refresh,
      saveAccessKey,
      clearAccessKey,
      formOpen,
      editingTx,
      openAdd,
      openEdit,
      closeForm,
    }),
    [
      transactions,
      budget,
      budgetMonth,
      loading,
      refreshing,
      dbStatus,
      toasts,
      notify,
      dismissToast,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAll,
      saveBudget,
      refresh,
      saveAccessKey,
      clearAccessKey,
      formOpen,
      editingTx,
      openAdd,
      openEdit,
      closeForm,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}