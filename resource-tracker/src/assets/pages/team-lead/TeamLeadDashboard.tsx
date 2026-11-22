import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import { useAuth } from "../../context/AuthContext";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  unwrapApiResponse,
} from "../../data/api-response";
import {
  resourceRequestsApi,
  type ApiRequestStatus,
} from "../../data/api-services";
import styles from "./TeamLeadDashboard.module.css";

type RequestRecord = Record<string, unknown>;

const requestStatuses: ApiRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "QUERIED",
  "APPROVED",
  "REJECTED",
];

function requestDate(record: RequestRecord): number {
  const value = record.submittedAt ?? record.createdAt;
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TeamLeadDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRecord[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setRequests(undefined);
      setError(
        loadError instanceof Error ? loadError.message : "Requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const rows = requests ?? [];
  const counts = useMemo(
    () => Object.fromEntries(
      requestStatuses.map((status) => [
        status,
        rows.filter((request) => request.status === status).length,
      ]),
    ) as Record<ApiRequestStatus, number>,
    [rows],
  );
  const columns = useMemo<DataTableColumn<RequestRecord>[]>(() => {
    const keys = ["id", "itemDescription", "quantity", "status", "submittedAt"]
      .filter((key) => rows.some((row) => key in row));
    const result: DataTableColumn<RequestRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key),
      render: (row: RequestRecord) => formatApiValue(flattenApiRecord(row)[key]),
    }));
    result.push({
      key: "details",
      header: "Details",
      render: (row: RequestRecord) =>
        typeof row.id === "string" || typeof row.id === "number" ? (
          <Link to={`/team-lead/requests?requestId=${encodeURIComponent(String(row.id))}`}>
            View request
          </Link>
        ) : "Request ID unavailable",
    });
    return result;
  }, [rows]);

  return (
    <section className={`rt-root ${styles.page}`}>
      {/* <PageHeader
        title="Team Lead Dashboard"
        description={user ? `Requests for ${user.fullName}` : "Your resource requests"}
        supplementary={
          <Link className="rt-root rt-btn rt-btn--primary" to="/team-lead/requests/new">
            
          </Link>
        }
      /> */}
      {error && (
        <ErrorMessage
          title="Request data unavailable"
          message={error}
          onRetry={() => void loadRequests()}
        />
      )}
      {!error && loading ? (
        <LoadingState message="Loading your requests from the backend..." />
      ) : !error ? (
        <>
          <StatusCardGrid>
            <StatusCard label="All requests" value={rows.length} onClick={() => navigate("/team-lead/requests")} />
            {requestStatuses.map((status) => (
              <StatusCard
                key={status}
                label={humanizeApiKey(status)}
                value={counts[status]}
                onClick={() => navigate(`/team-lead/requests?status=${status}`)}
              />
            ))}
          </StatusCardGrid>
          {rows.length ? (
            <DataTable
              title="Recent requests"
              columns={columns}
              rows={[...rows].sort((a, b) => requestDate(b) - requestDate(a)).slice(0, 5)}
              itemLabel="request"
              emptyTitle="No requests"
              emptyDescription="No requests have been returned for your account."
            />
          ) : (
            <EmptyState
              title="No requests found"
              description="Your submitted requests will appear here."
              actionLabel="Create a request"
              onAction={() => navigate("/team-lead/requests/new")}
            />
          )}
          <div className={styles.sectionHeading}>
            <Link to="/team-lead/requests">View request history</Link>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={loading}
              onClick={() => void loadRequests()}
            >
              Refresh
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
