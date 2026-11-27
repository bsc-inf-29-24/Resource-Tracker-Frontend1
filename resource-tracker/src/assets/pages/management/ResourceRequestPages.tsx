import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import WarningMessage from "../../components/feedback/WarningMessage";
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
  lineManagerActions?: boolean;
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

function getRequestId(record: ApiRecord): string | undefined {
  const id = record.id ?? record.requestId;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function isAwaitingManagerDecision(record: ApiRecord): boolean {
  const status = String(record.status ?? "").toUpperCase();
  return status === "SUBMITTED" || status === "PENDING";
}

export function ResourceRequestsPage({
  title,
  description,
  mode = "history",
  includeAudit = false,
  initialStatus = "",
  lineManagerActions = false,
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
  const [errorTitle, setErrorTitle] = useState("Unable to load requests");
  const [warning, setWarning] = useState("");
  const [detailError, setDetailError] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("APPROVED");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingApproval, setPendingApproval] = useState<ApiRecord | null>(null);
  const [pendingRejection, setPendingRejection] = useState<ApiRecord | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const detailsDialogRef = useRef<HTMLDialogElement>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarning("");
    try {
      setData(await resourceRequestsApi.list(undefined, statusFilter || undefined));
    } catch (requestError) {
      setErrorTitle("Unable to load requests");
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

  useEffect(() => {
    const dialog = detailsDialogRef.current;
    if (!dialog) return;
    if (detailsDialogOpen && !dialog.open) dialog.showModal();
    else if (!detailsDialogOpen && dialog.open) dialog.close();
  }, [detailsDialogOpen]);

  const records = useMemo(
    () => getApiRecords(data),
    [data],
  );
  const openRequestDetails = useCallback((requestId: string) => {
    if (!initialId) setDetailsDialogOpen(true);
    void loadDetail(requestId);
  }, [initialId, loadDetail]);

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
        const requestId = getRequestId(record);
        if (!requestId) {
          return "Request ID not provided";
        }
        return (
          <div className={styles.requestRowActions}>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              aria-label={`View request ${requestId}`}
              onClick={() => openRequestDetails(requestId)}
            >
              View
            </button>
            {lineManagerActions && isAwaitingManagerDecision(record) && (
              <>
                <button
                  type="button"
                  className="rt-root rt-btn rt-btn--primary"
                  disabled={actionBusy}
                  onClick={() => {
                    setError("");
                    setPendingApproval(record);
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rt-root rt-btn rt-btn--danger"
                  disabled={actionBusy}
                  onClick={() => {
                    setError("");
                    setRejectionNote("");
                    setPendingRejection(record);
                  }}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        );
      },
    });
    return result;
  }, [actionBusy, lineManagerActions, openRequestDetails, records]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) {
      setError("");
      setWarning("Please select a request from the list before submitting a decision.");
      return;
    }
    if (
      (reviewStatus === "QUERIED" || reviewStatus === "REJECTED") &&
      !note.trim()
    ) {
      setError("");
      setWarning("Please provide a note before submitting a query or rejection.");
      return;
    }
    setBusy(true);
    setError("");
    setWarning("");
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
      setErrorTitle("Unable to update request");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The request decision could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitRowDecision(
    record: ApiRecord,
    status: "APPROVED" | "REJECTED",
    decisionNote?: string,
  ) {
    const requestId = getRequestId(record);
    if (!requestId) {
      setError("");
      setWarning("The selected request does not have an identifier and cannot be updated.");
      return;
    }
    if (status === "REJECTED" && !decisionNote?.trim()) {
      setError("");
      setWarning("Please provide a rejection reason before continuing.");
      return;
    }
    setActionBusy(true);
    setError("");
    setWarning("");
    setNotice("");
    try {
      await resourceRequestsApi.update(requestId, {
        status,
        ...(decisionNote?.trim() ? { note: decisionNote.trim() } : {}),
      });
      setPendingApproval(null);
      setPendingRejection(null);
      setRejectionNote("");
      setNotice(
        `Request ${requestId} was ${status === "APPROVED" ? "approved" : "rejected"}.`,
      );
      await loadRequests();
      if (selectedId === requestId) await loadDetail(requestId);
    } catch (requestError) {
      setErrorTitle("Unable to update request");
      setError(
        requestError instanceof Error
          ? requestError.message
          : `The request could not be ${status === "APPROVED" ? "approved" : "rejected"}.`,
      );
    } finally {
      setActionBusy(false);
    }
  }

  const detailId = selectedId || initialId;
  const detailContent = (
    <>
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
      ) : !detailError ? (
        <EmptyState
          title="Request details are not loaded"
          description="Select a request from the table to view its details."
        />
      ) : null}
      {mode === "review" && selectedId && (
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
    </>
  );

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title={title} description={description} />
      {error && (
        <ErrorMessage
          title={errorTitle}
          message={error}
          onRetry={loadRequests}
        />
      )}
      {warning && (
        <WarningMessage title="Action required" message={warning} />
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.panelHeading}>
          <h2>Requests {!loading && !error ? `(${records.length})` : ""}</h2>
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
        ) : records.length > 0 || (lineManagerActions && data !== undefined) ? (
          <DataTable
            title={lineManagerActions ? `Requests (${records.length})` : undefined}
            columns={columns}
            rows={records}
            rowKey={(record, index) => getRequestId(record) ?? index}
            itemLabel="request"
            showEmptyTable={lineManagerActions}
            emptyTitle="No requests"
            emptyDescription="No requests are currently available for the selected filter."
          />
        ) : data !== undefined ? (
          <EmptyState
            title="No backend requests"
            description="No requests are currently available for the selected status."
          />
        ) : (
          <EmptyState
            title="No response data"
            description="No request data was received."
          />
        )}
      </section>

      {initialId && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>Request details</h2>
          {detailContent}
        </section>
      )}

      {!initialId && (
        <dialog
          ref={detailsDialogRef}
          className={styles.assignmentDialog}
          aria-labelledby="request-details-title"
          onClose={() => setDetailsDialogOpen(false)}
        >
          <div className={styles.dialogHeading}>
            <h2 id="request-details-title">Request details</h2>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </button>
          </div>
          {detailContent}
        </dialog>
      )}

      <ConfirmDialog
        open={Boolean(pendingApproval)}
        title="Approve this request?"
        message={
          pendingApproval
            ? `Confirm approval of request ${getRequestId(pendingApproval) ?? ""}.`
            : ""
        }
        confirmLabel="Approve"
        onCancel={() => {
          if (!actionBusy) setPendingApproval(null);
        }}
        onConfirm={() => {
          if (pendingApproval) {
            void submitRowDecision(pendingApproval, "APPROVED");
          }
        }}
        loading={actionBusy}
      />

      {pendingRejection && (
        <div
          className={styles.rejectBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionBusy) {
              setPendingRejection(null);
            }
          }}
        >
          <section
            className={styles.rejectDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-rejection-title"
          >
            <h2 id="request-rejection-title">Reject request</h2>
            <p>
              Request {getRequestId(pendingRejection)}. Provide a reason to continue.
            </p>
            <form
              className={styles.rejectForm}
              onSubmit={(event) => {
                event.preventDefault();
                void submitRowDecision(
                  pendingRejection,
                  "REJECTED",
                  rejectionNote,
                );
              }}
            >
              <label className={styles.field} htmlFor="request-rejection-note">
                <span>Rejection reason</span>
                <textarea
                  id="request-rejection-note"
                  rows={4}
                  required
                  value={rejectionNote}
                  onChange={(event) => setRejectionNote(event.target.value)}
                />
              </label>
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className="rt-root rt-btn rt-btn--outline"
                  disabled={actionBusy}
                  onClick={() => setPendingRejection(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rt-root rt-btn rt-btn--danger"
                  disabled={actionBusy || !rejectionNote.trim()}
                >
                  {actionBusy ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
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

export function LineManagerAllRequestsPage() {
  return (
    <ResourceRequestsPage
      title="All resource requests"
      description="Browse backend requests available to the authenticated Line Manager."
      lineManagerActions
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
      title="Requests"
      description=""
    />
  );
}

export function DepartmentRequestDetailsPage() {
  return (
    <ResourceRequestsPage
      title="Request details"
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

