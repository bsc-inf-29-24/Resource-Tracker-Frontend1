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
  onRefresh?: () => void;
}

export default function ApiResponsePanel({
  title,
  data,
  loading = false,
  error,
  onRefresh,
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
        <ErrorMessage title="API operation failed" message={error} onRetry={onRefresh} />
      ) : data === undefined ? (
        <EmptyState
          title="No response yet"
          description="Run a request to load the response."
        />
      ) : (
        <ApiDataView data={data} />
      )}
    </section>
  );
}
