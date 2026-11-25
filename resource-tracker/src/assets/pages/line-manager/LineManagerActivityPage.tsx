import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { auditLogsApi } from "../../data/api-services";
import { getApiRecords, humanizeApiKey, isApiRecord, unwrapApiResponse } from "../../data/api-response";
import styles from "./LineManagerActivityPage.module.css";

type RecordValue = Record<string, unknown>;

function activityRecords(response: unknown): RecordValue[] {
  const unwrapped = unwrapApiResponse(response);
  if (Array.isArray(unwrapped)) {
    const records = getApiRecords(unwrapped);
    if (records.length !== unwrapped.length) {
      throw new Error("The activity endpoint returned an item with an unexpected response shape.");
    }
    return records;
  }
  if (isApiRecord(unwrapped)) {
    return Object.keys(unwrapped).length ? [unwrapped] : [];
  }
  throw new Error("The activity endpoint returned an unexpected response shape.");
}

function label(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return humanizeApiKey(value.trim());
}

function summary(record: RecordValue): string {
  const details = isApiRecord(record.details) ? record.details : {};
  const value = record.note ?? details.summary ?? details.details ?? details.description ?? details.message ?? record.summary ?? record.description;
  return typeof value === "string" && value.trim() ? value : "No additional details.";
}

function dateLabel(record: RecordValue): string {
  const value = record.createdAt ?? record.created_at ?? record.timestamp ?? record.date;
  if (typeof value !== "string") return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function LineManagerActivityPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = useCallback(async () => {
    if (!user?.id) {
      setError("The authenticated manager profile does not include a user ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setRecords(activityRecords(await auditLogsApi.list({ userId: user.id })));
    } catch (requestError) {
      setRecords([]);
      setError(
        /403|forbidden/i.test(requestError instanceof Error ? requestError.message : "")
          ? "Your account is not authorized to view activity history."
          : requestError instanceof Error
            ? requestError.message
            : "Activity history could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const rows = useMemo(() => records.map((record, index) => ({
    rowId: String(record.id ?? index),
    activity: label(record.actionType ?? record.action, "Activity"),
    recordType: label(record.entityType ?? record.entity, "Record"),
    details: summary(record),
    occurredAt: dateLabel(record),
  })), [records]);
  const columns = useMemo<DataTableColumn<(typeof rows)[number]>[]>(() => [
    { key: "activity", header: "Activity" },
    { key: "recordType", header: "Record type" },
    { key: "details", header: "Details" },
    { key: "occurredAt", header: "Date" },
  ], []);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title="Activity history" description="Audit activity returned for your authenticated manager account." />
      {error && <ErrorMessage title="Activity history unavailable" message={error} onRetry={() => void loadActivity()} />}
      {loading ? <LoadingState message="Loading activity history…" /> : !error && (
        <DataTable
          title="Manager activity"
          columns={columns}
          rows={rows}
          rowKey="rowId"
          pageSize={10}
          itemLabel="activity"
          emptyTitle="No activity records"
          emptyDescription="The backend returned no audit records for this manager."
        />
      )}
    </section>
  );
}
