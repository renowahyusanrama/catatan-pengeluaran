import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        const tone =
          t.type === 'success'
            ? 'border-brand-200 bg-brand-50 text-brand-800'
            : t.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-gray-200 bg-gray-50 text-gray-800';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex min-w-[220px] max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm ${tone}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="text-left">{t.text}</span>
          </button>
        );
      })}
    </div>
  );
}