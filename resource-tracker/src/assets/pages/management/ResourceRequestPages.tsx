import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  resourceRequestsApi,
  type ApiRequestStatus,
} from "../../data/api-services";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
} from "../../data/api-response";
import ApiDataView from "./ApiDataView";
import styles from "./ApiManagementPage.module.css";

type ApiRecord = Record<string, unknown>;
type PageMode = "history" | "review" | "query-response";

const requestStatuses: ApiRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "QUERIED",
  "APPROVED",
  "REJECTED",
];
const reviewStatuses = ["QUERIED", "APPROVED", "REJECTED"] as const;
type ReviewStatus = (typeof reviewStatuses)[number];

interface ResourceRequestsPageProps {
  title: string;
  description: string;
  mode?: PageMode;
  includeAudit?: boolean;
  initialStatus?: ApiRequestStatus | "";
}

function formatValue(value: unknown): string {
  return formatApiValue(value);
}

function isApiRequestStatus(value: string): value is ApiRequestStatus {
  return requestStatuses.some((status) => status === value);
}

function isReviewStatus(value: string): value is ReviewStatus {
  return reviewStatuses.some((status) => status === value);
}

export function ResourceRequestsPage({
  title,
  description,
  mode = "history",
  includeAudit = false,
  initialStatus = "",
}: ResourceRequestsPageProps) {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("requestId") ?? "";
  const initialId = routeId ?? queryId;
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ApiRequestStatus | "">(initialStatus);
  const [data, setData] = useState<unknown>();
  const [detail, setDetail] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("APPROVED");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await resourceRequestsApi.list(undefined, statusFilter || undefined));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Resource requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadDetail = useCallback(
    async (requestId: string) => {
      setDetailLoading(true);
      setDetailError("");
      setError("");
      setNotice("");
      setSelectedId(requestId);
      setDetail(undefined);
      try {
        setDetail(
          await resourceRequestsApi.get(
            requestId,
            includeAudit ? "audit" : undefined,
          ),
        );
      } catch (requestError) {
        setDetail(undefined);
        setDetailError(
          requestError instanceof Error
            ? requestError.message
            : "Request details could not be loaded.",
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [includeAudit],
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (initialId) void loadDetail(initialId);
  }, [initialId, loadDetail]);

  const records = useMemo(
    () => getApiRecords(data),
    [data],
  );
  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const keys = Array.from(
      new Set(
        records.flatMap((record) => Object.keys(flattenApiRecord(record))),
      ),
    );
    const result: DataTableColumn<ApiRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatValue(flattenApiRecord(record)[key]),
    }));
    result.push({
      key: "actions",
      header: "Actions",
      render: (record) => {
        const requestId = record.id;
        if (typeof requestId !== "string" && typeof requestId !== "number") {
          return "Request ID not provided";
        }
        return (
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            onClick={() => void loadDetail(String(requestId))}
          >
            View
          </button>
        );
      },
    });
    return result;
  }, [loadDetail, records]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) {
      setError("Select a request from the backend list first.");
      return;
    }
    if (
      (reviewStatus === "QUERIED" || reviewStatus === "REJECTED") &&
      !note.trim()
    ) {
      setError("A note is required for a query or rejection.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const body =
      reviewStatus === "QUERIED" || reviewStatus === "REJECTED"
        ? { status: reviewStatus, note: note.trim() }
        : { status: reviewStatus };
    try {
      setDetail(await resourceRequestsApi.update(selectedId, body));
      setNotice(`Request ${selectedId} was updated to ${reviewStatus}.`);
      setNote("");
      await loadRequests();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The request decision could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  }

  const detailId = initialId || selectedId;

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title={title} description={description} />
      {mode === "query-response" && (
        // <p className={styles.formError} role="note">
        //   Swagger documents no requester-reply field or transition for a
        //   queried request. The details are available, but this page will not
        //   send an invented response payload.
        // </p>
      )}
      {error && (
        <ErrorMessage
          title="Request operation failed"
          message={error}
          onRetry={loadRequests}
        />
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.panelHeading}>
          <h2>Backend requests</h2>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={loading}
            onClick={() => void loadRequests()}
          >
            Refresh
          </button>
        </div>
        <label className={styles.field} htmlFor="request-status-filter">
          <span>Filter by status</span>
          <select
            id="request-status-filter"
            value={statusFilter}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value === "" ? "" : isApiRequestStatus(value) ? value : "");
            }}
          >
            <option value="">All statuses</option>
            {requestStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        {loading ? (
          <LoadingState message="Loading backend requests..." />
        ) : records.length > 0 ? (
          <DataTable
            columns={columns}
            rows={records}
            itemLabel="request"
            emptyTitle="No requests"
            emptyDescription="no requests."
          />
        ) : data !== undefined ? (
          <EmptyState
            title="No backend requests"
            description="returned an empty request list for the selected status."
          />
        ) : (
          <EmptyState
            title="No response data"
            description="Refresh to request the current list. "
          />
        )}
      </section>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Request details</h2>
          {detailError && (
            <ErrorMessage
              title="Request details could not be loaded"
              message={detailError}
              onRetry={() => void loadDetail(detailId)}
            />
          )}
          {detailLoading ? (
            <LoadingState message="Loading request details..." />
          ) : detail !== undefined ? (
            <ApiDataView data={detail} />
          ) : (
            <label className={styles.field} htmlFor="request-id">
              <span>Request ID</span>
              <input
                id="request-id"
                value={selectedId || initialId}
                onChange={(event) => setSelectedId(event.target.value)}
                placeholder="Select a row or enter the request UUID"
              />
            </label>
          )}
          {detail === undefined && (
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={detailLoading || !(selectedId || initialId).trim()}
              onClick={() => void loadDetail(selectedId || initialId)}
            >
              Load request details
            </button>
          )}
          {mode === "review" && (
            <form className={styles.form} onSubmit={submitReview}>
              <h3>Submit a Line Manager decision</h3>
              <label className={styles.field} htmlFor="request-review-status">
                <span>Decision</span>
                <select
                  id="request-review-status"
                  value={reviewStatus}
                  onChange={(event) => {
                    if (isReviewStatus(event.target.value)) {
                      setReviewStatus(event.target.value);
                    }
                  }}
                >
                  {reviewStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              {(reviewStatus === "QUERIED" || reviewStatus === "REJECTED") && (
                <label className={styles.field} htmlFor="request-review-note">
                  <span>Note *</span>
                  <textarea
                    id="request-review-note"
                    rows={4}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    required
                  />
                </label>
              )}
              <button
                type="submit"
                className="rt-root rt-btn rt-btn--primary"
                disabled={busy || !selectedId.trim()}
              >
                {busy ? "Submitting..." : "Submit decision"}
              </button>
            </form>
          )}
      </section>
    </section>
  );
}

export function TeamLeadRequestHistoryPage() {
  return (
    <ResourceRequestsPage
      title="Request history"
      description=""
    />
  );
}

export function TeamLeadQueryResponsePage() {
  return (
    <ResourceRequestsPage
      title="Respond to request query"
      description="Review the selected request."
      mode="query-response"
    />
  );
}

export function LineManagerReviewQueuePage() {
  return (
    <ResourceRequestsPage
      title="Requests to review"
      description="Load and review requests assigned to the authenticated Line Manager."
      mode="review"
      initialStatus="SUBMITTED"
    />
  );
}

export function LineManagerReviewDetailsPage() {
  return (
    <ResourceRequestsPage
      title="Review resource request"
      description="Inspect the selected request and submit a documented Line Manager decision."
      mode="review"
    />
  );
}

export function LineManagerDecisionHistoryPage() {
  return (
    <ResourceRequestsPage
      title="Decision history"
      description="Filter requests by their documented status and inspect the returned record details."
    />
  );
}

export function DepartmentRequestListPage() {
  return (
    <ResourceRequestsPage
      title="Department requests"
      description=""
    />
  );
}

export function DepartmentRequestDetailsPage() {
  return (
    <ResourceRequestsPage
      title="Department request details"
      description="Inspect request details and the audit trail."
      includeAudit
    />
  );
}

export function ManagingDirectorRequestDetailsPage() {
  return (
    <ResourceRequestsPage
      title="Request details"
      description="Inspect request details for the authenticated Managing Director."
    />
  );
}
