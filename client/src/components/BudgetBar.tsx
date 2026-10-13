import { formatIDR } from '../lib/format';

interface BudgetBarProps {
  budget: number | null;
  spent: number;
}

export function BudgetBar({ budget, spent }: BudgetBarProps) {
  if (budget === null) return null;

  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  let tone = 'bg-brand-500';
  let textTone = 'text-brand-700';
  let label = 'Sisa anggaran';

  if (pct >= 100) {
    tone = 'bg-red-500';
    textTone = 'text-red-600';
    label = 'Anggaran terlampaui';
  } else if (pct >= 80) {
    tone = 'bg-amber-500';
    textTone = 'text-amber-600';
    label = 'Hampir melewati anggaran';
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className={`text-sm font-semibold ${textTone}`}>{label}</span>
        <span className="text-sm font-semibold text-gray-900">{formatIDR(remaining)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Terpakai {formatIDR(spent)}</span>
        <span>dari {formatIDR(budget)}</span>
      </div>
    </div>
  );
}