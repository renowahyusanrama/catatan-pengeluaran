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
    <li className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-fill">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{tx.description}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-muted">
          {showDate && (
            <span>
              {weekdayName(tx.date)}, {formatDate(tx.date)}
            </span>
          )}
          {tx.category && (
            <span className="text-ink-muted/80">· {tx.category}</span>
          )}
        </div>
        {tx.note && <p className="mt-0.5 truncate text-sm text-ink-muted">{tx.note}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <span className="tnum text-sm font-semibold text-ink">{formatIDR(tx.amount)}</span>
        <button
          type="button"
          onClick={() => onEdit(tx)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-muted opacity-100 transition-colors hover:bg-surface hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(tx)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Hapus"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}