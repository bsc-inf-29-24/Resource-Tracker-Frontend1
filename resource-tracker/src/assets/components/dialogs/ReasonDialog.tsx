import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./ReasonDialog.module.css";

interface ReasonDialogProps {
    open: boolean;
    title: string;
    label: string;
    submitLabel: string;
    onSubmit: (reason: string) => void;
    onCancel: () => void;
}

export default function ReasonDialog({
    open,
    title,
    label,
    submitLabel,
    onSubmit,
    onCancel, 
}: ReasonDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            setReason("");
            setError("");
            dialog.showModal();
        }else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();

    if (!trimmed) {
      setError("This field is required.");
      return;
    }

    onSubmit(trimmed);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="reason-dialog-title"
      onCancel={(e) => {
        // Fires when the user presses Escape.
        e.preventDefault();
        onCancel();
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2 id="reason-dialog-title" className={styles.title}>
          {title}
        </h2>

        <label htmlFor="reason-text" className={styles.label}>
          {label}
        </label>
        <textarea
          id="reason-text"
          className={styles.textarea}
          rows={5}
          placeholder="Enter your reason..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "reason-error" : undefined}
        />
        {error && (
          <p id="reason-error" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">{submitLabel}</button>
        </div>
      </form>
    </dialog>
  );
}