import { useEffect, useRef } from "react";
import { WarningIcon } from "../icons";
import Button from "../forms/Button";

/**
 * Modal confirmation, matches the "Are you sure you want to Logout ?" prototype.
 * Esc or backdrop click cancels. Focus starts on Cancel (the safe choice) and is trapped inside.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onCancel, loading = false, destructive = false,
}) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Tab" && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll("button:not(:disabled)");
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previouslyFocused?.focus?.(); };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="rt-root rt-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div ref={dialogRef} className="rt-dialog" role="alertdialog" aria-modal="true" aria-labelledby="rt-dialog-title" aria-describedby={message ? "rt-dialog-text" : undefined}>
        <WarningIcon className="rt-dialog__icon" />
        <h2 id="rt-dialog-title" className="rt-dialog__title">{title}</h2>
        {message && <p id="rt-dialog-text" className="rt-dialog__text">{message}</p>}
        <div className="rt-dialog__actions">
          <Button ref={cancelRef} variant="outline" pill onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? "danger" : "primary"} pill onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
