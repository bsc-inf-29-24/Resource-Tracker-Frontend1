import type { ReactNode } from "react";
import { InboxIcon } from "../icons";
import Button from "../forms/Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({
  title = "Nothing here yet",
  message,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const emptyDescription =
    description ?? message ?? "There is nothing to display here for now.";
  return (
    <div className="rt-root rt-state">
      <span className="rt-state__icon">
        {icon ?? <InboxIcon width="56" height="56" />}
      </span>
      <h3 className="rt-state__title">{title}</h3>
      <p className="rt-state__text">{emptyDescription}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export default EmptyState;
