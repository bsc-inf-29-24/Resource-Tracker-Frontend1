import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import PageHeader from "../../components/layout/PageHeader";
import {
  auditLogsApi,
  type AuditLogFilters,
} from "../../data/api-services";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
  type ApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import styles from "./ApiManagementPage.module.css";

type AuditRow = Record<string, unknown> & { __row: number };
const sensitiveKey = /password|token|secret|credential/i;

function readableAuditRecords(response: unknown): ApiRecord[] {
  const records = getApiRecords(response);
  if (records.length) return records;
  const unwrapped = unwrapApiResponse(response);
  return isApiRecord(unwrapped) && Object.keys(unwrapped).length
    ? [unwrapped]
    : [];
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
      setRows(records.map((record, index) => {
        const flattened = flattenApiRecord(record);
        for (const key of Object.keys(flattened)) {
          if (sensitiveKey.test(key)) flattened[key] = "[redacted]";
        }
        return { ...flattened, __row: index };
      }));
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

  const columns = useMemo<DataTableColumn<AuditRow>[]>(() => {
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "__row"))));
    return keys.map((key) => ({
      key,
      header: humanizeApiKey(key),
      render: (row) => formatApiValue(row[key]),
    }));
  }, [rows]);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = filters.userId?.trim();
    if (userId && !/^\d+$/.test(userId)) {
      setError("User ID must be a number.");
      return;
    }
    const applied = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value?.trim() || undefined]),
    ) as AuditLogFilters;
    void loadAuditLogs(applied);
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title="Audit logs" description="Review audit records returned for your account." />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Audit record filters</h2>
        <p className={styles.notice}>The backend applies supplied filters using OR logic. Leave a field empty to omit that filter.</p>
        <form onSubmit={submitFilters}>
          <div className={styles.grid}>
            <label className={styles.field} htmlFor="audit-user-id"><span>User ID</span><input id="audit-user-id" inputMode="numeric" placeholder="Enter a user ID" value={filters.userId ?? ""} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} /></label>
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
