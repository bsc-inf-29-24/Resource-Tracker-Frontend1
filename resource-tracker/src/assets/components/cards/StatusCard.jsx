/**
 * Summary card: icon + title + count (e.g. "Pending 12").
 * tone: optional status name ('pending', 'queried', 'approved', 'rejected'). It is added as a CSS class
 *   (rt-status-card--pending etc.) so a status can be styled later; by default every card looks the same:
 *   black icon, green title and count.
 * Pass `onClick` or `href` to make it navigate; otherwise it is a static card.
 */
export default function StatusCard({ title, count, icon, tone = 'neutral', onClick, href }) {
  const cls = `rt-status-card rt-status-card--${tone}`;
  const body = (
    <>
      {icon && <span className="rt-status-card__icon">{icon}</span>}
      <span>
        <span className="rt-status-card__title">{title}</span>
        <span className="rt-status-card__count">{count}</span>
      </span>
    </>
  );
  if (href) return <a className={cls} href={href}>{body}</a>;
  if (onClick) return <button type="button" className={cls} onClick={onClick}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
