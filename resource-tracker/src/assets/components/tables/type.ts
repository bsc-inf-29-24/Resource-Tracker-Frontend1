import type { Key, ReactNode } from "react";

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  render?: (row: Row) => ReactNode;
}

export interface DataTableProps<Row extends object> {
  title?: string;
  columns: DataTableColumn<Row>[];
  rows?: Row[];
  rowKey?: string | ((row: Row, index: number) => Key);
  onRowClick?: (row: Row) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  itemLabel?: string;
}