import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import { mockUsers } from "../../data/mock-data";
import { TEAM_LEAD_ID, useResourceRequests } from "../../data/request-store";
import type { ResourceRequest } from "../../types/resource-request";
import { countByStatus } from "../../utils/status";
import { formatDate } from "../../utils/format";
import styles from "./TeamLeadDashboard.module.css";

function getSubmittedAt(request: ResourceRequest) {
  const date = Date.parse(request.submittedAt);
  return Number.isFinite(date) ? date : Number.NEGATIVE_INFINITY;
}

export default function TeamLeadDashboard() {
  const navigate = useNavigate();
  const { requests, persistenceWarning } = useResourceRequests();
  const teamLead = mockUsers.find((user) => user.id === TEAM_LEAD_ID);
  const ownRequests = useMemo(
    () => requests.filter((request) => request.requestedById === TEAM_LEAD_ID),
    [requests]
  );
  const counts = countByStatus(ownRequests);
  const submittedCount = ownRequests.filter((request) =>
    request.history.some((change) => change.status === "Submitted")
  ).length;
  const recentRequests = [...ownRequests]
    .sort((a, b) => {
      const aDate = getSubmittedAt(a);
      const bDate = getSubmittedAt(b);
      if (aDate === bDate) return a.id.localeCompare(b.id);
      return bDate > aDate ? 1 : -1;
    })
    .slice(0, 5);

  const columns = [
    { key: "id", header: "Request ID" },
    { key: "itemDescription", header: "Item description" },
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
        <Link
          to={`/team-lead/requests?requestId=${encodeURIComponent(request.id)}`}
          className={styles.tableLink}
        >
          View history
        </Link>
      ),
    },
  ];

  if (!teamLead) {
    return (
      <section className={`rt-root ${styles.page}`}>
        <PageHeader title="Team Lead Dashboard" />
        <ErrorMessage
          title="Preview account unavailable"
          message="The demo Team Lead account is missing. Request data cannot be safely associated with a user."
        />
      </section>
    );
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Team Lead Dashboard"
        description={`Requests associated with ${teamLead.name} · Preview mode`}
        supplementary={
          <Link className="rt-root rt-btn rt-btn--primary" to="/team-lead/requests/new">
            Submit a request
          </Link>
        }
      />

      <p className={styles.previewNotice} role="note">
        This demonstration filters browser-local request data by the seeded Team Lead account.
        It is not server-side authentication or authorization.
      </p>

      {persistenceWarning && (
        <ErrorMessage
          title="Using demo request data"
          message={persistenceWarning}
        />
      )}

      <StatusCardGrid>
        <StatusCard
          label="Submitted"
          value={submittedCount}
          note="All requests ever submitted"
          onClick={() => navigate("/team-lead/requests")}
        />
        <StatusCard
          label="Pending"
          value={counts.Pending}
          note="Awaiting review"
          onClick={() => navigate("/team-lead/requests?status=Pending")}
        />
        <StatusCard
          label="Queried"
          value={counts.Queried}
          note="Current status"
          onClick={() => navigate("/team-lead/requests?status=Queried")}
        />
        <StatusCard
          label="Approved"
          value={counts.Approved}
          note="Current status"
          onClick={() => navigate("/team-lead/requests?status=Approved")}
        />
        <StatusCard
          label="Rejected"
          value={counts.Rejected}
          note="Current status"
          onClick={() => navigate("/team-lead/requests?status=Rejected")}
        />
      </StatusCardGrid>

      <div className={styles.sectionHeading}>
        <h2>Recent requests</h2>
        <Link to="/team-lead/requests">View request history</Link>
      </div>
      {ownRequests.length === 0 ? (
        <div className={`rt-root rt-card ${styles.empty}`}>
          <EmptyState
            title="No requests submitted"
            description="Your requests will appear here after you submit one."
            actionLabel="Create a request"
            onAction={() => navigate("/team-lead/requests/new")}
          />
        </div>
      ) : (
        <DataTable
          title="Your five most recent requests"
          columns={columns}
          rows={recentRequests}
          emptyTitle="No recent requests"
          emptyDescription="Submit a request to see it here."
        />
      )}
    </section>
  );
}
