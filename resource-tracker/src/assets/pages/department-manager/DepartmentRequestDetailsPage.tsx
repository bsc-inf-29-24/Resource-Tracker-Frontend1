import { Link, useParams } from "react-router-dom";
import RequestDetails from "../../components/requests/RequestDetails";
import RequestTimeline from "../../components/requests/RequestTimeline";
import { mockUsers } from "../../data/mock-data";
import { useResourceRequests } from "../../data/request-store";
import { getCurrentDepartmentManager } from "../../utils/department-manager";
import styles from "./DepartmentRequestDetailsPage.module.css";

export default function DepartmentRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { requests, persistenceWarning } = useResourceRequests();
  const manager = getCurrentDepartmentManager();
  const request = requests.find((item) => item.id === id);

  if (!request) {
    return (
      <section className={styles.page}>
        <Link className={styles.backLink} to="/department-manager/requests">
          Back to requests
        </Link>
        <h1>Request not found</h1>
        <p>No request matching {id ?? "this ID"} is available in this browser.</p>
      </section>
    );
  }

  if (request.department !== manager?.department) {
    return (
      <section className={styles.page}>
        <Link className={styles.backLink} to="/department-manager/requests">
          Back to requests
        </Link>
        <h1>Request unavailable</h1>
        <p>
          This request belongs to another department and is not visible to the current Department Manager.
        </p>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topActions}>
        <Link className={styles.backLink} to="/department-manager/requests">
          Back to requests
        </Link>
        <Link className={styles.backLinkSecondary} to="/department-manager/dashboard">
          Return to dashboard
        </Link>
      </div>

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <RequestDetails request={request} />

      <section className={`rt-root rt-card ${styles.history}`} aria-labelledby="department-request-history-title">
        <h2 id="department-request-history-title" className="rt-card__title">
          Request history
        </h2>
        <RequestTimeline
          request={request}
          getUserName={(userId) => mockUsers.find((user) => user.id === userId)?.name ?? userId}
        />
      </section>
    </div>
  );
}
