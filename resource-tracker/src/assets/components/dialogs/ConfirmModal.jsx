import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from '../layout/Button';

/**
 * Confirmation dialog for approve / reject / delete etc.
 * variant="danger" gives the red treatment for destructive actions.
 * Closes on Escape or clicking the dark backdrop. Focus moves to the Cancel button when opened.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="rt-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div
        className={`rt-dialog${variant === 'danger' ? ' rt-dialog--danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rt-dialog-title"
        aria-describedby="rt-dialog-msg"
      >
        <h2 id="rt-dialog-title">{title}</h2>
        <p id="rt-dialog-msg">{message}</p>
        <div className="rt-dialog__actions">
          <button ref={cancelRef} type="button" className="rt-btn rt-btn--secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
