import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { auditLogsApi } from "../../data/api-services";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

export default function AuditLogsPage() {
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await auditLogsApi.list());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Audit logs could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Audit logs"
        description="Inspect audit log responses from the documented API. The response schema is not defined in Swagger."
      />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Audit log entries</h2>
        <p>The backend currently supports listing audit logs; entity-specific lookup is not documented.</p>
        <div className={styles.actions}>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={loading}
            onClick={() => void loadAuditLogs()}
          >
            Refresh logs
          </button>
        </div>
      </section>
      <ApiResponsePanel
        title="Audit response"
        data={data}
        loading={loading}
        error={error}
      />
    </section>
  );
}
