import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./UserProfileMenu.module.css";

interface UserProfileMenuProps {
  userName?: string | null;
  email?: string | null;
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
  email,
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
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
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
        {/* Initial leters on the user profile in a circle */}
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(userName)}
        </span>
        <span className={styles.triggerText}>
          {/* {User Name on the app heafer} */}
          <strong>{displayName}</strong>
          {/* <span>{roleLabel ? `${roleLabel}` : "Not signed in"}</span> */}
        </span>
      </button>
      {open && (
        <div
          className={styles.menu}
          role="group"
          aria-label="Signed-in user details"
        >
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className={styles.accountLink}
          >
            My account
          </Link>
          <dl className={styles.details}>
            <div className={styles.detail}>
              <dd><span>Name: </span>{displayName}</dd>
            </div>
            <div className={styles.detail}>
              <dd><span>Role: </span>{roleLabel || "No authenticated account"}</dd>
            </div>
            <div className={styles.detail}>
              <dd><span>Email: </span>{email?.trim() || "Not available"}</dd>
            </div>
          </dl>
          <button
            type="button"
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
