import { AlertIcon, EmptyBoxIcon } from '../icons/Icons';
import Button from '../layout/Button';

/** Spinner with an accessible label. */
export function Spinner({ label = 'Loading…' }) {
  return <span className="rt-spinner" role="status" aria-label={label} />;
}

/** Full-area loading state (dashboards, pages). */
export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="rt-loading" role="status" aria-live="polite">
      <span className="rt-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/** Grey shimmer bar for skeleton screens. */
export function Skeleton({ width = '100%', height = 16 }) {
  return <span className="rt-skeleton" style={{ width, height }} aria-hidden="true" />;
}

/** Shown when a table or dashboard has nothing to display. */
export function EmptyState({ title = 'Nothing here yet', message, actionLabel, onAction, icon }) {
  return (
    <div className="rt-empty">
      {icon ?? <EmptyBoxIcon />}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

/** Block error with optional retry – use when a whole section fails to load. */
export function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rt-error" role="alert">
      <AlertIcon />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Small one-line error, e.g. under a form after a failed save. */
export function InlineError({ children }) {
  if (!children) return null;
  return <div className="rt-inline-error" role="alert">{children}</div>;
}
