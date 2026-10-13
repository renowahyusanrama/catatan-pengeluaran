import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-1 text-gray-400">{icon}</div>}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}