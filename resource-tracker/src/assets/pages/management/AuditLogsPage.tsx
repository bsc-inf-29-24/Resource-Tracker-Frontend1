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
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Audit record lookup</h2>
        <div className={styles.grid}>
          <label className={styles.field} htmlFor="audit-entity-type">
            <span>Entity type</span>
            <input
              id="audit-entity-type"
              value={entityType}
              placeholder="Enter entity type e.g user"
              onChange={(event) => setEntityType(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="audit-entity-id">
            <span>Entity ID</span>
            <input
              id="audit-entity-id"
              value={entityId}
              placeholder="Enter entity id"
              onChange={(event) => setEntityId(event.target.value)}
            />
          </label>
        </div>
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
        title="Audit Records"
        data={data}
        loading={loading}
        error={error}
        expandableRecords
      />
    </section>
  );
}
