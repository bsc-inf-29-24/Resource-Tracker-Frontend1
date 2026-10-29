import { useEffect, useRef, useState } from "react";
import styles from "./UserProfileMenu.module.css";

interface UserProfileMenuProps {
  userName?: string | null;
  roleLabel?: string;
  inert?: boolean;
  onSignOut: () => void;
}

function getInitials(userName: string | null | undefined) {
  if (!userName?.trim()) return "RT";
  return userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserProfileMenu({
  userName,
  roleLabel,
  inert = false,
  onSignOut,
}: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = userName?.trim() || "Preview mode";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.profile} ref={rootRef} inert={inert}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(userName)}
        </span>
        <span className={styles.triggerText}>
          <strong>{displayName}</strong>
          <span>{roleLabel ? `${roleLabel} preview` : "Not signed in"}</span>
        </span>
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label="Profile menu">
          <p className={styles.menuName}>{displayName}</p>
          <p className={styles.menuRole}>
            {roleLabel ? `${roleLabel} preview` : "No authenticated account"}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}