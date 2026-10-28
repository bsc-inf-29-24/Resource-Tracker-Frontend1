import { Link } from "react-router-dom";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import {
  LINE_MANAGER_ID,
  useResourceRequests,
} from "../../data/request-store";
import PageHeader from "../../components/layout/PageHeader";
import { getRequestsAwaitingAction, hasTeamLeadReplied } from "../../utils/status";
import RequestTable from "./RequestTable";
import styles from "./LineManagerDashboard.module.css";

export default function LineManagerDashboard() {
  const { requests, persistenceWarning } = useResourceRequests();
  const awaitingAction = getRequestsAwaitingAction(requests);
  const queriedAwaitingResponse = requests.filter(
    (request) => request.status === "Queried" && !hasTeamLeadReplied(request)
  );
  const repliedQueries = requests.filter(hasTeamLeadReplied).length;
  const managerApprovals = requests.reduce(
    (total, request) =>
      total +
      request.history.filter(
        (change) => change.changedBy === LINE_MANAGER_ID && change.status === "Approved"
      ).length,
    0
  );
  const managerRejections = requests.reduce(
    (total, request) =>
      total +
      request.history.filter(
        (change) => change.changedBy === LINE_MANAGER_ID && change.status === "Rejected"
      ).length,
    0
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Line Manager Dashboard"
        description="Review and follow up on resource requests."
        supplementary={<Link to="/line-manager/requests">Open review queue</Link>}
      />

      
      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <StatusCardGrid>
        <StatusCard label="Pending review" value={awaitingAction.length} />
        <StatusCard
          label="Queried"
          value={requests.filter((request) => request.status === "Queried").length}
          note={`${repliedQueries} with a Team Lead response`}
        />
        <StatusCard
          label="Approved by you"
          value={managerApprovals}
        />
        <StatusCard
          label="Rejected by you"
          value={managerRejections}
        />
      </StatusCardGrid>

      <section className={`rt-root rt-card ${styles.attention}`} aria-labelledby="attention-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="attention-heading" className="rt-card__title">
              Requests needing attention
            </h2>
            <p className={styles.muted}>
              {queriedAwaitingResponse.length} queried{" "}
              {queriedAwaitingResponse.length === 1 ? "request is" : "requests are"} awaiting a
              Team Lead response.
            </p>
          </div>
          <Link to="/line-manager/requests">View queue</Link>
        </div>
        {awaitingAction.length === 0 && queriedAwaitingResponse.length === 0 ? (
          <p className={styles.muted}>Nothing needs your action right now.</p>
        ) : (
          <div className={styles.attentionGroups}>
            {awaitingAction.length > 0 && (
              <div>
                <h3>Ready for your review</h3>
                <ul className={styles.attentionList}>
                  {awaitingAction.slice(0, 4).map((request) => (
                    <li key={request.id}>
                      <Link to={`/line-manager/requests/${encodeURIComponent(request.id)}`}>
                        <strong>{request.id}</strong> — {request.itemDescription}
                      </Link>
                      <span className={styles.muted}>
                        {request.status === "Queried"
                          ? "Team Lead has replied"
                          : "Awaiting review"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {queriedAwaitingResponse.length > 0 && (
              <div>
                <h3>Waiting for Team Lead response</h3>
                <ul className={styles.attentionList}>
                  {queriedAwaitingResponse.slice(0, 4).map((request) => (
                    <li key={request.id}>
                      <Link to={`/line-manager/requests/${encodeURIComponent(request.id)}`}>
                        <strong>{request.id}</strong> — {request.itemDescription}
                      </Link>
                      <span className={styles.muted}>Query sent; response pending</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={styles.requestSection} aria-labelledby="all-requests-title">
        <div className={styles.sectionHeading}>
          <h2 id="all-requests-title">All resource requests</h2>
        </div>
        <RequestTable requests={requests} />
      </section>
    </div>
  );
}