import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, hint, icon, accent = 'bg-brand-500' }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <span className={`mt-2 block h-0.5 w-8 rounded-full ${accent}`} />
    </div>
  );
}