import { InboxIcon } from "../icons";
import Button from "../forms/Button";

/** Shown when a list has nothing to display. Give the user a next step via actionLabel/onAction. */
export default function EmptyState({ title = "Nothing here yet", description, icon, actionLabel, onAction }) {
  return (
    <div className="rt-root rt-state">
      <span className="rt-state__icon">{icon ?? <InboxIcon width="56" height="56" />}</span>
      <h3 className="rt-state__title">{title}</h3>
      {description && <p className="rt-state__text">{description}</p>}
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
