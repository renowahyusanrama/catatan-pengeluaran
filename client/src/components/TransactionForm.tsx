import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { CATEGORIES } from '../lib/categories';
import { todayISO, formatDate } from '../lib/dates';
import { parseNumeric, formatInputIDR } from '../lib/format';

export function TransactionForm() {
  const { formOpen, editingTx, closeForm, addTransaction, updateTransaction } = useApp();

  const [amountDigits, setAmountDigits] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Makanan & Minuman');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!formOpen) return;
    if (editingTx) {
      setAmountDigits(String(editingTx.amount));
      setDescription(editingTx.description);
      setCategory(editingTx.category);
      setDate(editingTx.date);
      setNote(editingTx.note);
    } else {
      setAmountDigits('');
      setDescription('');
      setCategory('Makanan & Minuman');
      setDate(todayISO());
      setNote('');
    }
    setError(null);
    setBusy(false);
  }, [formOpen, editingTx]);

  const onSave = async () => {
    const amount = parseInt(amountDigits, 10);
    if (!amountDigits || Number.isNaN(amount) || amount <= 0) {
      setError('Nominal harus lebih dari nol.');
      return;
    }
    if (description.trim() === '') {
      setError('Nama pengeluaran wajib diisi.');
      return;
    }
    if (!date) {
      setError('Tanggal wajib diisi.');
      return;
    }

    setBusy(true);
    setError(null);

    const input = {
      amount,
      description: description.trim(),
      category,
      date,
      note: note.trim(),
    };

    const ok = editingTx
      ? await updateTransaction(editingTx.id, input)
      : await addTransaction(input);

    setBusy(false);
    if (ok) closeForm();
  };

  return (
    <Modal
      title={editingTx ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
      open={formOpen}
      onClose={closeForm}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="label">
            Nominal
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">Rp</span>
            <input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={formatInputIDR(amountDigits)}
              onChange={(e) => setAmountDigits(parseNumeric(e.target.value))}
              className="input pl-10 text-base font-medium"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="label">
            Nama Pengeluaran
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Nasi goreng"
            autoComplete="off"
            className="input"
          />
        </div>

        <div>
          <span className="label">Kategori</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  category === c
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="label">
              Tanggal
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">{formatDate(date || todayISO())}</p>
          </div>

          <div>
            <label htmlFor="note" className="label">
              Catatan <span className="font-normal text-gray-400">(opsional)</span>
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsional"
              autoComplete="off"
              className="input"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary px-4 py-2" onClick={closeForm} disabled={busy}>
            Batal
          </button>
          <button type="button" className="btn-primary px-4 py-2" onClick={onSave} disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}