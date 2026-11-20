import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import {
  resourceRequestsApi,
  type ApiRequestStatus,
} from "../../data/api-services";
import styles from "./RequestHistoryPage.module.css";

type RequestRecord = Record<string, unknown>;

const statuses: ApiRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "QUERIED",
  "APPROVED",
  "REJECTED",
];

function requestTimestamp(record: RequestRecord): number {
  const value = record.submittedAt ?? record.createdAt;
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default function RequestHistoryPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("requestId") ?? routeId ?? null;
  const requestedStatus = searchParams.get("status")?.toUpperCase() ?? "";
  const selectedStatus = statuses.includes(requestedStatus as ApiRequestStatus)
    ? requestedStatus as ApiRequestStatus
    : "";
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = unwrapApiResponse(await resourceRequestsApi.list());
      const records = getApiRecords(response);
      if (!Array.isArray(response) || records.length !== response.length) {
        throw new Error("The resource-request endpoint returned an unexpected response.");
      }
      setRequests(records);
    } catch (loadError) {
      setRequests([]);
      setError(
        loadError instanceof Error ? loadError.message : "Request history could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    let active = true;
    if (!requestedId) {
      setSelectedRequest(undefined);
      setDetailError("");
      return () => { active = false; };
    }

    setDetailLoading(true);
    setDetailError("");
    void resourceRequestsApi.get(requestedId).then((response) => {
      const record = unwrapApiResponse(response);
      if (!isApiRecord(record)) {
        throw new Error("The request-details endpoint returned an unexpected response.");
      }
      if (active) setSelectedRequest(record);
    }).catch((loadError: unknown) => {
      if (active) {
        setSelectedRequest(undefined);
        setDetailError(
          loadError instanceof Error ? loadError.message : "Request details could not be loaded.",
        );
      }
    }).finally(() => {
      if (active) setDetailLoading(false);
    });

    return () => { active = false; };
  }, [requestedId]);

  const visibleRequests = useMemo(() => requests
    .filter((request) => !selectedStatus || request.status === selectedStatus)
    .filter((request) => !requestedId || String(request.id) === requestedId)
    .sort((a, b) => requestTimestamp(b) - requestTimestamp(a)), [
    requests,
    requestedId,
    selectedStatus,
  ]);
  const columns = useMemo<DataTableColumn<RequestRecord>[]>(() => {
    const keys = ["id", "itemDescription", "projectName", "submittedAt", "status"]
      .filter((key) => requests.some((row) => key in row));
    const result: DataTableColumn<RequestRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key),
      render: (row: RequestRecord) => formatApiValue(flattenApiRecord(row)[key]),
    }));
    result.push({
      key: "action",
      header: "Action",
      render: (row: RequestRecord) => (
        typeof row.id === "string" || typeof row.id === "number" ? (
          <Link to={`/team-lead/requests?requestId=${encodeURIComponent(String(row.id))}`}>
            View details
          </Link>
        ) : "Request ID unavailable"
      ),
    });
    return result;
  }, [requests]);

  function clearFilters() {
    navigate("/team-lead/requests");
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Request history"
       // description="Review resource requests and their latest status from the backend."
        supplementary={<Link to="/team-lead/dashboard"></Link>}
      />
      <div className={styles.filters}>
        <label htmlFor="request-status-filter">Filter by status</label>
        <select
          id="request-status-filter"
          value={selectedStatus}
          onChange={(event) => {
            const status = event.target.value;
            navigate(status
              ? `/team-lead/requests?status=${encodeURIComponent(status)}`
              : "/team-lead/requests");
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{humanizeApiKey(status)}</option>
          ))}
        </select>
        {(requestedId || selectedStatus) && (
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          className="rt-root rt-btn rt-btn--outline"
          disabled={loading}
          onClick={() => void loadRequests()}
        >
          Refresh
        </button>
      </div>
      <DataTable
        title={requestedId ? "Selected request" : "All requests"}
        columns={columns}
        rows={visibleRequests}
        loading={loading}
        error={error || undefined}
        onRetry={() => void loadRequests()}
        itemLabel="request"
        emptyTitle="No requests found"
        emptyDescription={selectedStatus
          ? `No requests have the status ${humanizeApiKey(selectedStatus)}.`
          : "Submitted requests for your account will appear here."}
        emptyActionLabel={requestedId || selectedStatus ? "Clear filters" : undefined}
        onEmptyAction={requestedId || selectedStatus ? clearFilters : undefined}
      />
      {requestedId && (
        <section className={`rt-root rt-card ${styles.timeline}`}>
          <div className={styles.timelineHeading}>
            <div>
              <h2>Request details</h2>
              <p>{requestedId}</p>
            </div>
          </div>
          {detailLoading ? (
            <LoadingState message="Loading request details..." />
          ) : detailError ? (
            <ErrorMessage title="Request details unavailable" message={detailError} />
          ) : selectedRequest ? (
            <dl className={styles.requestDetails}>
              {Object.entries(flattenApiRecord(selectedRequest)).map(([key, value]) => (
                <div key={key}>
                  <dt>{humanizeApiKey(key)}</dt>
                  <dd>{formatApiValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      )}
    </section>
  );
}
