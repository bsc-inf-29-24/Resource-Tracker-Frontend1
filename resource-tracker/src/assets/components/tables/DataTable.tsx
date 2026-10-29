import { useState } from "react";
import type { Key, ReactNode } from "react";
import { isValidElement } from "react";
import EmptyState from "../feedback/EmptyState";
import ErrorMessage from "../feedback/ErrorMessage";
import LoadingState from "../feedback/LoadingState";
import StatusLabel from "../status/StatusLabel";
import type { DataTableColumn, DataTableProps } from "./type";
import styles from "./DataTable.module.css";

function getCellValue<Row extends object>(row: Row, key: string): ReactNode {
  const value = Reflect.get(row, key) as unknown;
  if (value === null || value === undefined || typeof value === "boolean") {
    return value === true ? "Yes" : value === false ? "No" : "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    isValidElement(value)
  ) {
    return value;
  }
  return String(value);
}

function getRowKey<Row extends object>(
  row: Row,
  rowKey: DataTableProps<Row>["rowKey"],
  index: number
): Key {
  const value =
    typeof rowKey === "function"
      ? rowKey(row, index)
      : Reflect.get(row, rowKey ?? "id");
  return typeof value === "string" || typeof value === "number"
    ? value
    : index;
}

function DataTable<Row extends object>({
  title,
  columns,
  rows = [],
  rowKey = "id",
  onRowClick,
  loading = false,
  error,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  emptyActionLabel,
  onEmptyAction,
  page,
  pageSize = 8,
  total,
  onPageChange,
  itemLabel = "record",
}: DataTableProps<Row>) {
  const [internalPage, setInternalPage] = useState(1);
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 8;
  const externallyPaginated = typeof onPageChange === "function";
  const recordCount = externallyPaginated ? total ?? rows.length : rows.length;
  const pageCount = Math.max(1, Math.ceil(recordCount / safePageSize));
  const currentPage = externallyPaginated
    ? Math.min(Math.max(page ?? 1, 1), pageCount)
    : Math.min(internalPage, pageCount);
  const visibleRows = externallyPaginated
    ? rows
    : rows.slice((currentPage - 1) * safePageSize, currentPage * safePageSize);

  function changePage(nextPage: number) {
    if (externallyPaginated) onPageChange?.(nextPage);
    else setInternalPage(nextPage);
  }

  function activateRow(row: Row, target: EventTarget | null) {
    if (
      target instanceof Element &&
      target.closest(
        "a, button, input, select, textarea, summary, [role='button'], [contenteditable='true']"
      )
    ) {
      return;
    }
    onRowClick?.(row);
  }

  let content: ReactNode;
  if (loading) {
    content = <LoadingState.Skeleton rows={safePageSize} />;
  } else if (error) {
    content = (
      <ErrorMessage
        message={error}
        title="Could not load data"
        onRetry={onRetry}
      />
    );
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  } else {
    content = (
      <div className={`rt-table-wrap ${styles.tableWrap}`}>
        <table className="rt-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr
                key={getRowKey(row, rowKey, index)}
                {...(onRowClick
                  ? {
                      tabIndex: 0,
                      onClick: (event) => activateRow(row, event.target),
                      onKeyDown: (event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      },
                    }
                  : {})}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : getCellValue(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className={`rt-root rt-card ${styles.container}`}>
      {title && (
        <h2 className="rt-card__title" aria-live="polite">
          {title}
        </h2>
      )}
      {content}
      {!loading && !error && rows.length > 0 && (
        <div className={`rt-table__footer ${styles.footer}`}>
          <span>
            Showing{" "}
            {(currentPage - 1) * safePageSize + 1}
            -
            {externallyPaginated
              ? (currentPage - 1) * safePageSize + visibleRows.length
              : Math.min(currentPage * safePageSize, recordCount)}{" "}
            of {recordCount} {itemLabel}
            {recordCount === 1 ? "" : "s"}
          </span>
          {pageCount > 1 && (
            <nav className="rt-pagination" aria-label={`${itemLabel} pages`}>
              <button
                type="button"
                className="rt-page-btn"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => changePage(currentPage - 1)}
              >
                Previous
              </button>
              <span aria-current="page">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                className="rt-page-btn"
                aria-label="Next page"
                disabled={currentPage >= pageCount}
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}

export function statusColumn<Row extends object>(
  key = "status",
  header = "Status"
): DataTableColumn<Row> {
  return {
    key,
    header,
    render: (row) => {
      const value = Reflect.get(row, key) as unknown;
      return <StatusLabel status={typeof value === "string" ? value : undefined} />;
    },
  };
}

export default DataTable;