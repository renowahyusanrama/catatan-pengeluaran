import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} open={open} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secondary px-4 py-2" onClick={onCancel} disabled={busy}>
          Batal
        </button>
        <button
          type="button"
          className={danger ? 'btn-danger px-4 py-2' : 'btn-primary px-4 py-2'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Memproses…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}