import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { auditLogsApi } from "../../data/api-services";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

export default function AuditLogsPage() {
  const [data, setData] = useState<unknown>();
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
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

  async function loadRecord() {
    if (!entityType.trim() || !entityId.trim()) {
      setError("Enter both the entity type and entity ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(
        await auditLogsApi.record(entityType.trim(), entityId.trim()),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The audit record could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Audit logs"
        description="Inspect audit log responses from the documented API. The response schema is not defined in Swagger."
      />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Audit record lookup</h2>
        <div className={styles.grid}>
          <label className={styles.field} htmlFor="audit-entity-type">
            <span>Entity type</span>
            <input
              id="audit-entity-type"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="audit-entity-id">
            <span>Entity ID</span>
            <input
              id="audit-entity-id"
              value={entityId}
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
            Load all logs
          </button>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--primary"
            disabled={loading}
            onClick={() => void loadRecord()}
          >
            Load entity record
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
