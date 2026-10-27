/**
 * Summary card: icon + title + count (e.g. "Total Request 32").
 * Pass `onClick` or `href` to make it navigate; otherwise it is a static card.
 */
export default function StatusCard({ title, count, icon, onClick, href }) {
  const body = (
    <>
      {icon && <span className="rt-status-card__icon">{icon}</span>}
      <span>
        <span className="rt-status-card__title">{title}</span>
        <span className="rt-status-card__count">{count}</span>
      </span>
    </>
  );
  if (href) return <a className="rt-status-card" href={href}>{body}</a>;
  if (onClick) return <button type="button" className="rt-status-card" onClick={onClick}>{body}</button>;
  return <div className="rt-status-card">{body}</div>;
}
