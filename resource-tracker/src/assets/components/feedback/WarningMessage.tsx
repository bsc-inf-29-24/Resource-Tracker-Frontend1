import { useEffect, useState } from "react";
import { WarningIcon } from "../icons";

interface WarningMessageProps {
  title?: string;
  message?: string;
  variant?: "inline" | "block";
  id?: string;
}

/**
 * Displays a formal, user-facing warning banner or inline notice.
 */
function WarningMessage({
  title = "Notice",
  message,
  variant = "block",
  id,
}: WarningMessageProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;

    const timeoutId = window.setTimeout(() => setVisible(false), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  if (!message || !visible) return null;
  if (variant === "inline") {
    return (
      <p id={id} className="rt-root rt-warning-inline" role="alert">
        <WarningIcon /> {message}
      </p>
    );
  }
  return (
    <div className="rt-root rt-warning-block" role="alert">
      <WarningIcon />
      <div>
        <p className="rt-warning-block__title">{title}</p>
        <p className="rt-warning-block__text">{message}</p>
      </div>
    </div>
  );
}

export default WarningMessage;
