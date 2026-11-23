import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import PageHeader from "../../components/layout/PageHeader";
import {
  auditLogsApi,
  type AuditLogFilters,
} from "../../data/api-services";
import {
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
  type ApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import styles from "./AuditLogsPage.module.css";

type AuditRow = {
  __row: number;
  activity: string;
  recordType: string;
  summary: string;
  occurredAt: string;
};

function readableAuditRecords(response: unknown): ApiRecord[] {
  const records = getApiRecords(response);
  if (records.length) return records;
  const unwrapped = unwrapApiResponse(response);
  return isApiRecord(unwrapped) && Object.keys(unwrapped).length
    ? [unwrapped]
    : [];
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseDetails(value: unknown): ApiRecord | null {
  if (isApiRecord(value)) return value;
  if (typeof value !== "string") return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isApiRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function displayLabel(value: unknown, fallback: string): string {
  const text = textValue(value);
  return text
    ? humanizeApiKey(text).toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : fallback;
}

function auditSummary(record: ApiRecord): string {
  const details = parseDetails(record.details);
  const summary =
    textValue(record.note) ??
    textValue(details?.summary) ??
    textValue(details?.details) ??
    textValue(details?.description) ??
    textValue(details?.message) ??
    textValue(record.summary) ??
    textValue(record.description);

  if (summary) {
    return summary.replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, (code) =>
      displayLabel(code, code),
    );
  }
  return typeof record.details === "string" && !details
    ? record.details
    : "No additional details.";
}

function auditDate(value: unknown): string {
  const text = textValue(value);
  if (!text) return "Date unavailable";

  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? text
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function toAuditRow(record: ApiRecord, index: number): AuditRow {
  return {
    __row: index,
    activity: displayLabel(record.actionType ?? record.action, "Activity"),
    recordType: displayLabel(record.entityType ?? record.entity, "Record"),
    summary: auditSummary(record),
    occurredAt: auditDate(
      record.createdAt ?? record.created_at ?? record.timestamp ?? record.date,
    ),
  };
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [hasResponseRecords, setHasResponseRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = useCallback(async (appliedFilters: AuditLogFilters = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await auditLogsApi.list(appliedFilters);
      const records = readableAuditRecords(response);
      setHasResponseRecords(records.length > 0);
      setRows(records.map(toAuditRow));
    } catch (loadError) {
      setRows([]);
      setHasResponseRecords(false);
      const message = loadError instanceof Error ? loadError.message : "Audit logs could not be loaded.";
      setError(/403|forbidden/i.test(message)
        ? `You do not have permission to view these audit logs. ${message}`
        : message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const columns = useMemo<DataTableColumn<AuditRow>[]>(() => [
    { key: "activity", header: "Activity" },
    { key: "recordType", header: "Record type" },
    {
      key: "summary",
      header: "Details",
      render: (row) => <span className={styles.summary}>{row.summary}</span>,
    },
    { key: "occurredAt", header: "Date" },
  ], []);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const applied = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value?.trim() || undefined]),
    ) as AuditLogFilters;
    void loadAuditLogs(applied);
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title="Audit logs" description="Review audit records returned for your account." />
      <section className={`rt-root rt-card ${styles.filters}`}>
        <h2 className={styles.filterTitle}>Audit record filters</h2>
        <form className={styles.form} onSubmit={submitFilters}>
          <div className={styles.grid}>
            <label className={styles.field} htmlFor="audit-action-type"><span>Action type</span><input id="audit-action-type" placeholder="e.g. create, update, delete" value={filters.actionType ?? ""} onChange={(event) => setFilters({ ...filters, actionType: event.target.value })} /></label>
            <label className={styles.field} htmlFor="audit-entity-type"><span>Entity type</span><input id="audit-entity-type" placeholder="e.g. user, resource, request" value={filters.entityType ?? ""} onChange={(event) => setFilters({ ...filters, entityType: event.target.value })} /></label>
            <label className={styles.field} htmlFor="audit-date"><span>Date</span><input id="audit-date" type="date" value={filters.date ?? ""} onChange={(event) => setFilters({ ...filters, date: event.target.value })} /></label>
            <label className={styles.field} htmlFor="audit-time"><span>Time</span><input id="audit-time" type="time" value={filters.time ?? ""} onChange={(event) => setFilters({ ...filters, time: event.target.value })} /></label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={loading}>Apply filters</button>
            <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={loading} onClick={() => { setFilters({}); void loadAuditLogs({}); }}>Clear filters</button>
          </div>
        </form>
      </section>
      <DataTable
        title="Audit records"
        columns={columns}
        rows={rows}
        rowKey="__row"
        loading={loading}
        error={error}
        onRetry={() => void loadAuditLogs(filters)}
        emptyTitle={hasResponseRecords ? "Audit records returned in an unsupported format" : "No audit records found"}
        emptyDescription={hasResponseRecords ? "The backend returned data that this table cannot safely interpret. The response schema is not specified in Swagger." : "No audit records were returned for the selected filters."}
        itemLabel="audit record"
      />
    </section>
  );
}
