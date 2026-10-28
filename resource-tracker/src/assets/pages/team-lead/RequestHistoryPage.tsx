import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import RequestTimeline from "../../components/requests/RequestTimeline";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import { mockUsers } from "../../data/mock-data";
import { TEAM_LEAD_ID, useResourceRequests } from "../../data/request-store";
import type { RequestStatus, ResourceRequest } from "../../types/resource-request";
import { All_STATUSES } from "../../utils/status";
import { formatDate } from "../../utils/format";
import styles from "./RequestHistoryPage.module.css";

export default function RequestHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { requests, persistenceWarning } = useResourceRequests();
  const requestedId = searchParams.get("requestId");
  const requestedStatus = searchParams.get("status");
  const selectedStatus = All_STATUSES.includes(requestedStatus as RequestStatus)
    ? (requestedStatus as RequestStatus)
    : null;
  const ownRequests = useMemo(
    () => requests.filter((request) => request.requestedById === TEAM_LEAD_ID),
    [requests]
  );
  const selectedRequest = requestedId
    ? ownRequests.find((request) => request.id === requestedId)
    : undefined;
  const visibleRequests = useMemo(() => {
    let rows = ownRequests;
    if (requestedId) rows = rows.filter((request) => request.id === requestedId);
    if (selectedStatus) {
      rows = rows.filter((request) => request.status === selectedStatus);
    }
    return [...rows].sort((a, b) => {
      const aDate = Date.parse(a.submittedAt);
      const bDate = Date.parse(b.submittedAt);
      const safeA = Number.isFinite(aDate) ? aDate : Number.NEGATIVE_INFINITY;
      const safeB = Number.isFinite(bDate) ? bDate : Number.NEGATIVE_INFINITY;
      if (safeA === safeB) return a.id.localeCompare(b.id);
      return safeB > safeA ? 1 : -1;
    });
  }, [ownRequests, requestedId, selectedStatus]);

  const columns = [
    { key: "id", header: "Request ID" },
    { key: "itemDescription", header: "Item description" },
    { key: "project", header: "Project" },
    {
      key: "submittedAt",
      header: "Submission date",
      render: (request: ResourceRequest) => formatDate(request.submittedAt),
    },
    {
      key: "status",
      header: "Current status",
      render: (request: ResourceRequest) => <StatusLabel status={request.status} />,
    },
    {
      key: "action",
      header: "Available action",
      render: (request: ResourceRequest) => (
        request.status === "Queried" ? (
          <Link className={styles.link} to={`/team-lead/requests/${encodeURIComponent(request.id)}/respond`}>
            View query
          </Link>
        ) : (
          <Link className={styles.link} to={`/team-lead/requests?requestId=${encodeURIComponent(request.id)}`}>
            View history
          </Link>
        )
      ),
    },
  ];

  function clearFilters() {
    setSearchParams({});
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Request history"
        description="Review the current status and recorded timeline for your requests."
        supplementary={<Link to="/team-lead/dashboard">Back to dashboard</Link>}
      />
      {persistenceWarning && (
        <ErrorMessage title="Using demo request data" message={persistenceWarning} />
      )}

      <div className={styles.filters}>
        <label htmlFor="request-status-filter">Filter by current status</label>
        <select
          id="request-status-filter"
          value={selectedStatus ?? ""}
          onChange={(event) => {
            const next = new URLSearchParams(searchParams);
            next.delete("requestId");
            if (event.target.value) next.set("status", event.target.value);
            else next.delete("status");
            setSearchParams(next);
          }}
        >
          <option value="">All statuses</option>
          {All_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        {(requestedId || selectedStatus) && (
          <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {requestedId && !selectedRequest && (
        <ErrorMessage
          title="Request not found"
          message="That request is not available in the Team Lead preview account's request history."
        />
      )}

      <DataTable
        title={requestedId ? "Selected request" : "All your requests"}
        columns={columns}
        rows={visibleRequests}
        emptyTitle="No requests found"
        emptyDescription={
          selectedStatus
            ? `You have no requests with the current status "${selectedStatus}".`
            : "Your submitted requests will appear here."
        }
        emptyActionLabel={requestedId || selectedStatus ? "Clear filters" : undefined}
        onEmptyAction={requestedId || selectedStatus ? clearFilters : undefined}
      />

      {selectedRequest && (
        <section className={`rt-root rt-card ${styles.timeline}`} aria-labelledby="selected-request-title">
          <div className={styles.timelineHeading}>
            <div>
              <h2 id="selected-request-title">{selectedRequest.id} history</h2>
              <p>{selectedRequest.itemDescription}</p>
            </div>
            <StatusLabel status={selectedRequest.status} />
          </div>
          <RequestTimeline
            request={selectedRequest}
            getUserName={(userId) =>
              mockUsers.find((user) => user.id === userId)?.name ?? userId
            }
          />
        </section>
      )}
    </section>
  );
}
