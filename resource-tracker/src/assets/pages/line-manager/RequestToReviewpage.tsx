import { Link } from "react-router-dom";
import WarningMessage from "../../components/feedback/WarningMessage";
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
    
      <PageHeader
        title="Requests to review"
        description="Pending requests and queried requests with a response from the requesting Team Lead."
      />
      {persistenceWarning && (
        <WarningMessage variant="inline" message={persistenceWarning} />
      )}
      <RequestTable requests={awaitingAction} />
    </div>
  );
}
