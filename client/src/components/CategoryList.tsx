import { categoryColor } from '../lib/categories';
import { formatIDR } from '../lib/format';
import type { CategoryTotal } from '../lib/analytics';

interface CategoryListProps {
  totals: CategoryTotal[];
  total: number;
  showPercent?: boolean;
}

export function CategoryList({ totals, total, showPercent = true }: CategoryListProps) {
  if (totals.length === 0) return null;

  return (
    <ul className="space-y-3">
      {totals.map((c) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        return (
          <li key={c.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: categoryColor(c.category) }}
                />
                {c.category}
              </span>
              <span className="font-medium text-gray-900">
                {formatIDR(c.total)}
                {showPercent && <span className="ml-2 text-xs font-normal text-gray-500">{pct.toFixed(0)}%</span>}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: categoryColor(c.category) }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}