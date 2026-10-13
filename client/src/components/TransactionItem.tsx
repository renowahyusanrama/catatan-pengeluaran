import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '../lib/types';
import { formatIDR } from '../lib/format';
import { formatDate, weekdayName } from '../lib/dates';

interface TransactionItemProps {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  showDate?: boolean;
}

export function TransactionItem({ tx, onEdit, onDelete, showDate = true }: TransactionItemProps) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{tx.description}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
            {tx.category}
          </span>
          {showDate && (
            <span>
              {weekdayName(tx.date)}, {formatDate(tx.date)}
            </span>
          )}
          {tx.note && <span className="text-gray-400">· {tx.note}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-semibold text-gray-900">{formatIDR(tx.amount)}</span>
        <button
          type="button"
          onClick={() => onEdit(tx)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(tx)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Hapus"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}