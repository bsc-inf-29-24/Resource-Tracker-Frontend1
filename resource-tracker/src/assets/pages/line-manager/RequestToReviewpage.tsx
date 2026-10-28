import { Link } from "react-router-dom";
import { useResourceRequests } from "../../data/request-store";
import { getRequestsAwaitingAction } from "../../utils/status";
import RequestTable from "./RequestTable";
import PageHeader from "../../components/layout/PageHeader";
import styles from "./RequestToReviewPage.module.css";

export default function RequestToReviewPage() {
  const { requests, persistenceWarning } = useResourceRequests();
  const awaitingAction = getRequestsAwaitingAction(requests);

  return (
    <div className={styles.page}>
      <div>
        <Link to="/line-manager/dashboard">Dashboard</Link>
      </div>
      <PageHeader
        title="Requests to review"
        description="Pending requests and queried requests with a response from the requesting Team Lead."
      />
      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}
      <RequestTable requests={awaitingAction} />
    </div>
  );
}
