import { useEffect, useState } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { reportsApi } from "../../data/api-services";
import { isApiRecord, unwrapApiResponse } from "../../data/api-response";
import ApiResponsePanel from "../management/ApiResponsePanel";
import styles from "./SpendingReportsPage.module.css";
import useDepartmentScope from "./useDepartmentScope";

export default function SpendingReportsPage() {
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [spending, setSpending] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSpending() {
    if (!department) return;
    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const reportResponse = await reportsApi.department(
        String(department.id),
        startDate || undefined,
        endDate || undefined,
      );
      const report = unwrapApiResponse(reportResponse);
      setSpending(
        isApiRecord(report) && "spending" in report
          ? report.spending
          : report,
      );
    } catch (loadError) {
      setSpending(undefined);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Department spending could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department) void loadSpending();
  }, [department?.id]);

  if (scopeLoading) return <LoadingState message="Loading your department..." />;
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
        title="Department Spending"
        description={`Reported spending for ${department.name}`}
      />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2 className="rt-card__title">Spending period</h2>
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
            onClick={() => void loadSpending()}
          >
            {loading ? "Loading..." : "Update spending"}
          </button>
        </div>
      </section>
      {error && (
        <ErrorMessage
          title="Department spending unavailable"
          message={error}
          onRetry={() => void loadSpending()}
        />
      )}
      <ApiResponsePanel
        title="Department spending report"
        data={spending}
        loading={loading}
        emptyTitle="No spending records"
        emptyDescription="The backend returned no spending for this department and period."
      />
    </div>
  );
}
