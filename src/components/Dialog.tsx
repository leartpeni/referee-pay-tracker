import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  /** Accessible name of the dialog. */
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Close when clicking outside the content. Default true. */
  closeOnBackdrop?: boolean;
}

/**
 * Native <dialog> shown with showModal(): gives focus trapping, Escape to close,
 * and an inert background for free.
 */
export function Dialog({ labelledBy, onClose, children, className = '', closeOnBackdrop = true }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    el.addEventListener('cancel', handleCancel);
    return () => {
      el.removeEventListener('cancel', handleCancel);
      if (el.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={className}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (closeOnBackdrop && e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      {children}
    </dialog>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, destructive, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      labelledBy="confirm-title"
      onClose={onCancel}
      className="m-auto w-[min(92vw,420px)] rounded-[20px] bg-white p-0 text-ink shadow-xl"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold text-navy">
          {title}
        </h2>
        <div className="mt-2 text-muted">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl px-4 font-medium text-navy hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`min-h-11 rounded-xl px-4 font-semibold text-white ${
              destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-navy hover:bg-navy-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}




