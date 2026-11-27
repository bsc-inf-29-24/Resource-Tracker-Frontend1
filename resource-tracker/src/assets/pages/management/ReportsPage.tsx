import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Filter, X } from "lucide-react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import WarningMessage from "../../components/feedback/WarningMessage";
import PageHeader from "../../components/layout/PageHeader";
import { ApiError } from "../../data/api-client";
import { formatCurrency } from "../../utils/format";
import { getApiRecords } from "../../data/api-response";
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
  const [submittedFilters, setSubmittedFilters] = useState({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const filterDialogRef = useRef<HTMLDialogElement>(null);
  const availableOptions = reportOptions.filter((option) =>
    allowedReports.includes(option.value),
  );
  const isSpendingReport = report === "departmental-spending";

  useEffect(() => {
    const dialog = filterDialogRef.current;
    if (!dialog) return;
    if (filterDialogOpen && !dialog.open) dialog.showModal();
    if (!filterDialogOpen && dialog.open) dialog.close();
  }, [filterDialogOpen]);

  async function loadReport(): Promise<boolean> {
    setWarning("");
    if (startDate && endDate && startDate > endDate) {
      setError("");
      setWarning("Please ensure the start date is on or before the end date.");
      return false;
    }
    if (
      ((requireDepartmentId && report !== "departmental-spending") || report === "department") &&
      !/^[1-9]\d*$/.test(departmentId.trim())
    ) {
      setError("");
      setWarning("Please enter a valid Department ID before running this report.");
      return false;
    }
    if (
      departmentId.trim() &&
      !/^[1-9]\d*$/.test(departmentId.trim())
    ) {
      setError("");
      setWarning("Please enter a positive whole number for the Department ID.");
      return false;
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
      if (report === "departmental-spending") {
        setSubmittedFilters({
          departmentId: departmentId.trim(),
          startDate,
          endDate,
        });
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 403
          ? "Your account does not currently have permission to access this spending report. Please contact your system administrator for assistance."
          : requestError instanceof Error
          ? requestError.message
          : "The report could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
    return true;
  }

  async function applySpendingFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await loadReport()) setFilterDialogOpen(false);
  }

  const spendingRows = useMemo(
    () => getApiRecords(data).map((record, index) => ({
      id: `${String(record.departmentName ?? record.department_name ?? "department")}-${index}`,
      departmentName: String(record.departmentName ?? record.department_name ?? "—"),
      startDate: submittedFilters.startDate || "All dates",
      endDate: submittedFilters.endDate || "All dates",
      totalSpending: Number(record.totalSpending ?? record.total_spending ?? 0),
    })),
    [data, submittedFilters],
  );

  const spendingColumns: DataTableColumn<(typeof spendingRows)[number]>[] = [
    { key: "departmentName", header: "Department Name" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "totalSpending",
      header: "Total Spending",
      render: (row) => formatCurrency(row.totalSpending),
    },
  ];

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title={title}
        description={description}
        supplementary={isSpendingReport ? (
          <button
            type="button"
            className="rt-root rt-btn rt-btn--primary"
            aria-haspopup="dialog"
            aria-expanded={filterDialogOpen}
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter aria-hidden="true" size={17} />
            Filter
          </button>
        ) : undefined}
      />
      {warning && !isSpendingReport && (
        <WarningMessage title="Action required" message={warning} />
      )}
      {isSpendingReport && (
        <dialog
          ref={filterDialogRef}
          className={styles.filterDialog}
          aria-labelledby="spending-filter-title"
          onCancel={(event) => {
            event.preventDefault();
            setFilterDialogOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setFilterDialogOpen(false);
          }}
        >
          <form onSubmit={applySpendingFilters}>
            <div className={styles.filterDialogHeader}>
              <h2 id="spending-filter-title">Filter spending</h2>
              <button
                type="button"
                className={styles.dialogClose}
                aria-label="Close filters"
                onClick={() => setFilterDialogOpen(false)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            {warning && (
              <WarningMessage title="Check the selected filters" message={warning} />
            )}
            <div className={styles.grid}>
              <label
                className={`${styles.field} ${styles.reportFilterField}`}
                htmlFor="spending-filter-start-date"
              >
                <span>Start date</span>
                <input
                  id="spending-filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setWarning("");
                    setStartDate(event.target.value);
                  }}
                />
              </label>
              <label
                className={`${styles.field} ${styles.reportFilterField}`}
                htmlFor="spending-filter-end-date"
              >
                <span>End date</span>
                <input
                  id="spending-filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setWarning("");
                    setEndDate(event.target.value);
                  }}
                />
              </label>
            </div>
            <div className={styles.filterDialogActions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                onClick={() => {
                  setDepartmentId("");
                  setStartDate("");
                  setEndDate("");
                  setWarning("");
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className="rt-root rt-btn rt-btn--primary"
                disabled={loading}
              >
                {loading ? "Applying..." : "Apply filters"}
              </button>
            </div>
          </form>
        </dialog>
      )}
      {report !== "departmental-spending" && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>Report filters</h2>
          <div className={styles.grid}>
            {availableOptions.length > 1 && (
              <label className={styles.field} htmlFor="report-name">
                <span>Report</span>
                <select
                  id="report-name"
                  value={report}
                  onChange={(event) => {
                    setWarning("");
                    setReport(event.target.value as ReportName);
                  }}
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
              <label
                className={`${styles.field} ${styles.reportFilterField}`}
                htmlFor="report-department-id"
              >
                <span>
                  Department ID{requireDepartmentId || report === "department" ? " *" : ""}
                </span>
                <input
                  id="report-department-id"
                  type="number"
                  min="1"
                  value={departmentId}
                  placeholder="Enter department ID"
                  onChange={(event) => {
                    setWarning("");
                    setDepartmentId(event.target.value);
                  }}
                />
              </label>
            )}
            <label
              className={`${styles.field} ${styles.reportFilterField}`}
              htmlFor="report-start-date"
            >
              <span>Start date</span>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setWarning("");
                  setStartDate(event.target.value);
                }}
              />
            </label>
            <label
              className={`${styles.field} ${styles.reportFilterField}`}
              htmlFor="report-end-date"
            >
              <span>End date</span>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(event) => {
                  setWarning("");
                  setEndDate(event.target.value);
                }}
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
      )}
      {isSpendingReport ? (
        <section className={`rt-root rt-card ${styles.panel}`}>
          {loading ? (
            <LoadingState message="Loading spending report..." />
          ) : error ? (
            <ErrorMessage
              title="Unable to load spending report"
              message={error}
              onRetry={() => void loadReport()}
            />
          ) : (
            <DataTable
              columns={spendingColumns}
              rows={spendingRows}
              rowKey="id"
              showEmptyTable
              itemLabel="department"
              emptyTitle={data === undefined ? "No spending data" : "No spending records found"}
              emptyDescription={data === undefined
                ? "Choose filters to load departmental spending totals."
                : "The spending report returned no departmental records."}
            />
          )}
        </section>
      ) : (
        <ApiResponsePanel
          title="Report Responses"
          data={data}
          loading={loading}
          error={error}
          errorTitle="Unable to load report"
          onRefresh={() => void loadReport()}
        />
      )}
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
        "allocation-history",
        "department",
      ]}
      requireDepartmentId
      title="Department Reports"
      description=""
    />
  );
}
