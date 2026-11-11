import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { reportsApi } from "../../data/api-services";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

type ReportName =
  | "approval-history"
  | "departmental-spending"
  | "allocation-history"
  | "department"
  | "organization";

const reportOptions: { value: ReportName; label: string }[] = [
  { value: "approval-history", label: "Approval history" },
  { value: "departmental-spending", label: "Departmental spending" },
  { value: "allocation-history", label: "Allocation history" },
  { value: "department", label: "Department report" },
  { value: "organization", label: "Organization report" },
];

interface ReportsPageProps {
  initialReport?: ReportName;
  allowedReports?: ReportName[];
  title?: string;
  description?: string;
  requireDepartmentId?: boolean;
}

export default function ReportsPage({
  initialReport = "approval-history",
  allowedReports = reportOptions.map((option) => option.value),
  title = "Reports",
  description = "",
  requireDepartmentId = false,
}: ReportsPageProps) {
  const [report, setReport] = useState<ReportName>(initialReport);
  const [departmentId, setDepartmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const availableOptions = reportOptions.filter((option) =>
    allowedReports.includes(option.value),
  );

  async function loadReport() {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    if (
      (requireDepartmentId || report === "department") &&
      !/^[1-9]\d*$/.test(departmentId.trim())
    ) {
      setError("Enter the department ID required for this report.");
      return;
    }
    if (
      departmentId.trim() &&
      !/^[1-9]\d*$/.test(departmentId.trim())
    ) {
      setError("Department ID must be a positive whole number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let response: unknown;
      switch (report) {
        case "approval-history":
          response = await reportsApi.approvalHistory(
            departmentId.trim() || undefined,
            startDate || undefined,
            endDate || undefined,
          );
          break;
        case "departmental-spending":
          response = await reportsApi.departmentalSpending(
            departmentId.trim() || undefined,
            startDate || undefined,
            endDate || undefined,
          );
          break;
        case "allocation-history":
          response = await reportsApi.allocationHistory(
            departmentId.trim() || undefined,
            startDate || undefined,
            endDate || undefined,
          );
          break;
        case "department":
          response = await reportsApi.department(
            departmentId.trim(),
            startDate || undefined,
            endDate || undefined,
          );
          break;
        case "organization":
          response = await reportsApi.organization(
            startDate || undefined,
            endDate || undefined,
          );
          break;
      }
      setData(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The report could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title={title}
        description={description}
      />
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Report filters</h2>
        <div className={styles.grid}>
          {availableOptions.length > 1 && (
            <label className={styles.field} htmlFor="report-name">
              <span>Report</span>
              <select
                id="report-name"
                value={report}
                onChange={(event) =>
                  setReport(event.target.value as ReportName)
                }
              >
                {availableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {report !== "organization" && (
            <label className={styles.field} htmlFor="report-department-id">
            <span>
              Department ID{requireDepartmentId || report === "department" ? " *" : ""}
            </span>
            <input
              id="report-department-id"
              type="number"
              min="1"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            />
            </label>
          )}
          <label className={styles.field} htmlFor="report-start-date">
            <span>Start date</span>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="report-end-date">
            <span>End date</span>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="rt-root rt-btn rt-btn--primary"
          disabled={loading}
          onClick={() => void loadReport()}
        >
          {loading ? "Loading..." : "Run report"}
        </button>
      </section>
      <ApiResponsePanel
        title="Backend report response"
        data={data}
        loading={loading}
        error={error}
      />
    </section>
  );
}

export function DepartmentSpendingReportPage() {
  return (
    <ReportsPage
      initialReport="departmental-spending"
      allowedReports={["departmental-spending"]}
      requireDepartmentId
      title="Spending Reports"
      description=""
    />
  );
}

export function AllocationHistoryReportPage() {
  return (
    <ReportsPage
      initialReport="allocation-history"
      allowedReports={["allocation-history"]}
      requireDepartmentId
      title="Resource Allocation"
      description=""
    />
  );
}

export function DepartmentReportsPage() {
  return (
    <ReportsPage
      allowedReports={[
        "approval-history",
        "departmental-spending",
        "allocation-history",
        "department",
      ]}
      requireDepartmentId
      title="Department Reports"
      description=""
    />
  );
}
