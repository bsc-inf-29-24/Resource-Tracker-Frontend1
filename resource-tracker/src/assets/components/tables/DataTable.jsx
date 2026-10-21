import StatusLabel from "../status/StatusLabel";
import LoadingState from "../feedback/LoadingState";
import EmptyState from "../feedback/EmptyState";
import ErrorMessage from "../feedback/ErrorMessage";

/**
 * Reusable table with built-in loading, error, empty and pagination states.
 *
 *  columns: [{ key: "status", header: "Status", render?: (row) => node }]
 *  Use `statusColumn("status")` for a column that renders <StatusLabel />.
 *  Pagination is server-driven: pass page, pageSize, total, onPageChange.
 */
export const statusColumn = (key = "status", header = "Status") => ({
  key, header, render: (row) => <StatusLabel status={row[key]} />,
});

export default function DataTable({
  title, columns, rows = [], rowKey = "id", onRowClick,
  loading = false, error, onRetry,
  emptyTitle = "No records found", emptyDescription, emptyActionLabel, onEmptyAction,
  page = 1, pageSize = 5, total, onPageChange, itemLabel = "request",
}) {
  const count = total ?? rows.length;
  const pages = Math.max(1, Math.ceil(count / pageSize));

  let body;
  if (loading) body = <LoadingState.Skeleton rows={pageSize} />;
  else if (error) body = <ErrorMessage message={error} title="Could not load data" onRetry={onRetry} />;
  else if (!rows.length) body = <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} onAction={onEmptyAction} />;
  else body = (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col">{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              {...(onRowClick && {
                tabIndex: 0,
                onClick: () => onRowClick(row),
                onKeyDown: (e) => e.key === "Enter" && onRowClick(row),
              })}
            >
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="rt-root rt-card">
      {title && <h2 className="rt-card__title">{title}</h2>}
      {body}
      {!loading && !error && rows.length > 0 && (
        <div className="rt-table__footer">
          <span>Showing {rows.length} of {count} {itemLabel}{count === 1 ? "" : "s"}</span>
          {onPageChange && pages > 1 && (
            <nav className="rt-pagination" aria-label="Pagination">
              <button className="rt-page-btn" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className="rt-page-btn" aria-current={n === page ? "page" : undefined} onClick={() => onPageChange(n)}>{n}</button>
              ))}
              <button className="rt-page-btn" aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>›</button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
