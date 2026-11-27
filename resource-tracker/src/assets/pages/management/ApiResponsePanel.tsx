import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import ApiDataView from "./ApiDataView";
import styles from "./ApiManagementPage.module.css";

interface ApiResponsePanelProps {
  title: string;
  data: unknown;
  loading?: boolean;
  error?: string;
  errorTitle?: string;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  noResponseTitle?: string;
  noResponseDescription?: string;
}

export default function ApiResponsePanel({
  title,
  data,
  loading = false,
  error,
  errorTitle = "Unable to load data",
  onRefresh,
  emptyTitle = "No records returned",
  emptyDescription = "The backend response did not contain any records.",
  noResponseTitle = "No response yet",
  noResponseDescription = "Run a request to load the response.",
}: ApiResponsePanelProps) {
  return (
    <section className={`rt-root rt-card ${styles.panel}`}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
        {onRefresh && (
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={loading}
            onClick={onRefresh}
          >
            Refresh
          </button>
        )}
      </div>
      {loading ? (
        <LoadingState message="Loading data..." />
      ) : error ? (
        <ErrorMessage title={errorTitle} message={error} onRetry={onRefresh} />
      ) : data === undefined ? (
        <EmptyState
          title={noResponseTitle}
          description={noResponseDescription}
        />
      ) : (
        <ApiDataView
          data={data}
          hideIdFields={title === "Users"}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}
    </section>
  );
}
