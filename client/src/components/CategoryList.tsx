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
    <ul className="space-y-4">
      {totals.map((c) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        return (
          <li key={c.category}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5 text-ink-soft">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: categoryColor(c.category) }}
                />
                {c.category}
              </span>
              <span className="tnum text-ink">
                {formatIDR(c.total)}
                {showPercent && <span className="ml-2 text-sm text-ink-muted">{pct.toFixed(0)}%</span>}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(pct, 1.5)}%`, backgroundColor: categoryColor(c.category) }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}