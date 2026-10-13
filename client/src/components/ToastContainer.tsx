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
            ? 'bg-brand-600 text-white'
            : t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-ink text-white';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex min-w-[220px] max-w-sm items-center gap-2.5 rounded-full px-4 py-3 text-sm font-medium text-white ${tone}`}
          >
            <Icon size={17} className="shrink-0" />
            <span className="text-left">{t.text}</span>
          </button>
        );
      })}
    </div>
  );
}