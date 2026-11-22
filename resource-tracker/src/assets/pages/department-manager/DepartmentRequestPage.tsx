import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
} from "../../data/api-response";
import type { ApiRecord } from "../../data/api-response";
import { departmentsApi } from "../../data/api-services";
import useDepartmentScope from "./useDepartmentScope";
import styles from "./DepartmentRequestPage.module.css";

type StatusFilter = "All" | "SUBMITTED" | "QUERIED" | "APPROVED" | "REJECTED";

function getRequestId(record: ApiRecord): string | null {
  return typeof record.id === "string" || typeof record.id === "number"
    ? String(record.id)
    : null;
}

export default function DepartmentRequestPage() {
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    if (!department) return;
    setLoading(true);
    setError("");
    try {
      const response = await departmentsApi.requests(String(department.id));
      setRecords(getApiRecords(response));
    } catch (loadError) {
      setRecords([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Department requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department) void loadRequests();
  }, [department?.id]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const statusMatches =
        status === "All" ||
        String(record.status ?? "").toUpperCase() === status;
      const searchMatches =
        !term || JSON.stringify(record).toLowerCase().includes(term);
      return statusMatches && searchMatches;
    });
  }, [records, search, status]);

  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const flattened = records.map(flattenApiRecord);
    const keys = Array.from(
      new Set(flattened.flatMap((record) => Object.keys(record))),
    );
    const result: DataTableColumn<ApiRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) =>
        key.toLowerCase().endsWith("status") ? (
          <StatusLabel status={String(flattenApiRecord(record)[key] ?? "")} />
        ) : (
          formatApiValue(flattenApiRecord(record)[key])
        ),
    }));
    result.push({
      key: "departmentRequestAction",
      header: "Action",
      render: (record) => {
        const requestId = getRequestId(record);
        return requestId ? (
          <Link
            className={styles.linkButton}
            to={`/department-manager/requests/${encodeURIComponent(requestId)}`}
          >
            View details
          </Link>
        ) : (
          "—"
        );
      },
    });
    return result;
  }, [records]);

  if (scopeLoading) return <LoadingState message="Loading your department..." />;
  if (scopeError) {
    return (
      <ErrorMessage
        title="Department unavailable"
        message={scopeError}
        onRetry={reload}
      />
    );
  }
  if (!department) return null;

  return (
    <div className="rt-root">
      <PageHeader
        title="Department Requests"
        description={`Resource requests for ${department.name}`}
      />
      {error && (
        <ErrorMessage
          title="Department requests unavailable"
          message={error}
          onRetry={() => void loadRequests()}
        />
      )}
      <section className={styles.tableSection}>
        <label>
          Search requests
          <input
            type="search"
            value={search}
            placeholder="Search request details"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="All">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="QUERIED">Queried</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <DataTable
          title={`${filteredRecords.length} department ${filteredRecords.length === 1 ? "request" : "requests"}`}
          columns={columns}
          rows={filteredRecords}
          rowKey={(record, index) => getRequestId(record) ?? index}
          loading={loading}
          itemLabel="request"
          emptyTitle="No department requests found"
          emptyDescription="No requests match the current search and status."
        />
      </section>
    </div>
  );
}
