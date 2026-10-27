import Pagination from './Pagination';
import { Skeleton, EmptyState, ErrorMessage } from '../feedback/Feedback';
import StatusTag from '../status/StatusTag';

/**
 * Reusable table.
 *
 * columns: [{ key, header, render?(row), width? }]
 *   - use  render: (row) => <StatusTag status={row.status} />  for custom cells
 *   - or   type: 'status'  as a shortcut for the status tag
 * data:    array of row objects
 * rowKey:  field that is unique per row (default "id")
 * loading / error / onRetry: show skeleton rows or an error block
 * emptyTitle / emptyMessage: shown when data is empty
 * pagination: { page, pageSize, total, onPageChange, itemLabel }
 * onRowClick(row): makes rows clickable
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = 'id',
  loading = false,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyMessage = 'There is nothing to show here yet.',
  pagination,
  onRowClick,
  caption,
}) {
  if (error) return <ErrorMessage title="Could not load data" message={typeof error === 'string' ? error : undefined} onRetry={onRetry} />;

  const empty = !loading && data.length === 0;
  if (empty) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div>
      <div className="rt-table-wrap">
        <table className="rt-table" aria-busy={loading}>
          {caption && <caption className="rt-sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pagination?.pageSize ?? 5 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (<td key={c.key}><Skeleton /></td>))}
                  </tr>
                ))
              : data.map((row) => (
                  <tr
                    key={row[rowKey]}
                    className={onRowClick ? 'is-clickable' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                  >
                    {columns.map((c) => (
                      <td key={c.key}>
                        {c.render ? c.render(row) : c.type === 'status' ? <StatusTag status={row[c.key]} /> : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {pagination && !loading && <Pagination {...pagination} />}
    </div>
  );
}
