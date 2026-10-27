import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons';

/** "Showing 5 of 15 request" + page buttons (‹ 1 2 ›). */
export default function Pagination({ page, pageSize, total, onPageChange, itemLabel = 'request' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const shown = Math.min(pageSize, Math.max(0, total - (page - 1) * pageSize));
  return (
    <div className="rt-table-footer">
      <span>Showing {shown} of {total} {itemLabel}</span>
      <nav className="rt-pagination" aria-label="Pagination">
        <button className="rt-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeftIcon size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className="rt-page-btn"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        <button className="rt-page-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRightIcon size={16} />
        </button>
      </nav>
    </div>
  );
}
