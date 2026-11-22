import { useCallback, useEffect, useState, type FormEvent } from "react";
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

  const loadAuditLogs = useCallback(
    async (filters: { entityType?: string; entityId?: string } = {}) => {
      setLoading(true);
      setError("");
      try {
        setData(
          await auditLogsApi.list(filters.entityType, filters.entityId),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Audit logs could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  function searchAuditLogs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAuditLogs({
      entityType: entityType.trim() || undefined,
      entityId: entityId.trim() || undefined,
    });
  }

  function clearFilters() {
    setEntityType("");
    setEntityId("");
    void loadAuditLogs();
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Audit logs"
        description="Review administrative activity and inspect audit records."
      />
      <form
        className={`rt-root rt-card ${styles.panel}`}
        onSubmit={searchAuditLogs}
      >
        <h2>Filter audit records</h2>
        <div className={styles.grid}>
          <label className={styles.field} htmlFor="audit-entity-type">
            <span>Entity type</span>
            <input
              id="audit-entity-type"
              name="entityType"
              value={entityType}
              placeholder="e.g. user"
              onChange={(event) => setEntityType(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="audit-entity-id">
            <span>Entity ID</span>
            <input
              id="audit-entity-id"
              name="entityId"
              value={entityId}
              placeholder="Enter an entity ID"
              onChange={(event) => setEntityId(event.target.value)}
            />
          </label>
        </div>
        <div className={styles.actions}>
          <button
            type="submit"
            className="rt-root rt-btn rt-btn--primary"
            disabled={loading}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={loading || (!entityType && !entityId)}
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </form>
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
