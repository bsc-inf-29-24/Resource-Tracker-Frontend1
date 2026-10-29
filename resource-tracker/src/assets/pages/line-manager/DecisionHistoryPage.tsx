import { Link, useSearchParams } from "react-router-dom";
import RequestTimeline from "../../components/requests/RequestTimeline";
import PageHeader from "../../components/layout/PageHeader";
import { mockUsers } from "../../data/mock-data";
import { useResourceRequests } from "../../data/request-store";
import styles from "./DecisionHistoryPage.module.css";

export default function DecisionHistoryPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");
  const { requests, persistenceWarning } = useResourceRequests();
  const historyRequests = requests.filter((request) => {
    if (requestId) return request.id === requestId;
    return (
      request.comments.length > 0 ||
      request.history.some((change) =>
        ["Queried", "Approved", "Rejected"].includes(change.status)
      )
    );
  });

  return (
    <div className={styles.page}>
      <div className={styles.headerLinks}>
        <div>
          <Link to="/line-manager/dashboard">Dashboard</Link>
          <PageHeader
            title={requestId ? `History for ${requestId}` : "Decision history"}
            description="Queries, comments, decisions, and recorded status changes."
          />
        </div>
        <Link to="/line-manager/requests">Requests to review</Link>
      </div>

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      {historyRequests.length === 0 ? (
        <section className={`rt-root ${styles.empty}`} role="status">
          <h2>No decision history available</h2>
          <p>
            {requestId
              ? "This request was not found or has no recorded history."
              : "Queries and decisions will appear here when they are recorded."}
          </p>
          <Link to="/line-manager/requests">Return to requests</Link>
        </section>
      ) : (
        <div className={styles.records}>
          {historyRequests.map((request) => (
            <section
              className={`rt-root rt-card ${styles.record}`}
              key={request.id}
              aria-labelledby={`history-${request.id}`}
            >
              <header className={styles.recordHeader}>
                <div>
                  <h2 id={`history-${request.id}`}>{request.id}</h2>
                  <p>{request.itemDescription}</p>
                </div>
                <Link to={`/line-manager/requests/${encodeURIComponent(request.id)}`}>
                  Open request
                </Link>
              </header>
              <RequestTimeline
                request={request}
                getUserName={(userId) =>
                  mockUsers.find((user) => user.id === userId)?.name ?? userId
                }
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
