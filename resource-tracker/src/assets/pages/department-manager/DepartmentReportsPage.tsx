import { useEffect, useState } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { reportsApi } from "../../data/api-services";
import ApiResponsePanel from "../management/ApiResponsePanel";
import styles from "./SpendingReportsPage.module.css";
import useDepartmentScope from "./useDepartmentScope";

export default function DepartmentReportsPage() {
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    if (!department) return;
    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await reportsApi.department(
        String(department.id),
        startDate || undefined,
        endDate || undefined,
      );
      setReport(response);
    } catch (loadError) {
      setReport(undefined);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The department report could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department) void loadReport();
  }, [department?.id]);

  if (scopeLoading) return <LoadingState message="Loading department..." />;
  if (scopeError) {
    return (
      <ErrorMessage
        title="Department unavailable"
        message={scopeError}
        onRetry={reload}
      />
    );
  }
  if (!department) return null;

  return (
    <div className="rt-root">
      <PageHeader
        title="Department Reports"
        description={`Approvals, spending, and allocations for ${department.name}`}
      />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2 className="rt-card__title">Report period</h2>
        <div className={styles.summaryGrid}>
          <label>
            Start date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--primary"
            disabled={loading}
            onClick={() => void loadReport()}
          >
            {loading ? "Loading..." : "Update report"}
          </button>
        </div>
      </section>
      {error && (
        <ErrorMessage
          title="Department report unavailable"
          message={error}
          onRetry={() => void loadReport()}
        />
      )}
      <ApiResponsePanel
        title="Department backend report"
        data={report}
        loading={loading}
        emptyTitle="No department report data"
        emptyDescription="The backend returned no report for this period."
      />
    </div>
  );
}
