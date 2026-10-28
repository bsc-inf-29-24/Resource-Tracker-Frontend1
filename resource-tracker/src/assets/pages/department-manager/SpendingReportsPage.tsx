import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FilterToolbar from "../../components/filters/filterToolbar";
import PageHeader from "../../components/layout/PageHeader";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import { useResourceRequests } from "../../data/request-store";
import { formatCurrency } from "../../utils/format";
import {
  applyDepartmentFilters,
  getApprovedAmount,
  getCurrentDepartmentManager,
  getDepartmentRequests,
  getProjectTotals,
  getRequestedAmount,
  getSpentDifference,
} from "../../utils/department-manager";
import type { RequestStatus } from "../../types/resource-request";
import type { ToolbarFilter } from "../../components/filters/filterToolbar";
import styles from "./SpendingReportsPage.module.css";

type StatusFilter = RequestStatus | "All";

export default function SpendingReportsPage() {
  const { requests, persistenceWarning } = useResourceRequests();
  const manager = getCurrentDepartmentManager();
  const departmentName = manager?.department ?? "Data Science";
  const departmentRequests = useMemo(
    () => getDepartmentRequests(requests, departmentName),
    [departmentName, requests]
  );

  const [status, setStatus] = useState<StatusFilter>("All");
  const [project, setProject] = useState("All");
  const [team, setTeam] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const projectOptions = useMemo(
    () => Array.from(new Set(departmentRequests.map((request) => request.project))).sort(),
    [departmentRequests]
  );
  const teamOptions = useMemo(
    () => Array.from(new Set(departmentRequests.map((request) => request.team))).sort(),
    [departmentRequests]
  );

  const filteredRequests = useMemo(
    () =>
      applyDepartmentFilters(departmentRequests, {
        project,
        team,
        status,
        startDate: fromDate,
        endDate: toDate,
      }),
    [departmentRequests, fromDate, project, status, team, toDate]
  );

  const requestedTotal = getRequestedAmount(filteredRequests);
  const approvedTotal = getApprovedAmount(filteredRequests);
  const variance = getSpentDifference(filteredRequests);
  const projectTotals = getProjectTotals(filteredRequests);

  const filters: ToolbarFilter[] = [
    {
      id: "spend-status-filter",
      label: "Status",
      type: "select",
      value: status,
      onChange: setStatus,
      options: [
        { value: "All", label: "All statuses" },
        ...(["Submitted", "Pending", "Queried", "Approved", "Rejected"] as RequestStatus[]).map(
          (statusValue) => ({ value: statusValue, label: statusValue })
        ),
      ],
    },
    {
      id: "spend-project-filter",
      label: "Project",
      type: "select",
      value: project,
      onChange: setProject,
      options: [
        { value: "All", label: "All projects" },
        ...projectOptions.map((value) => ({ value, label: value })),
      ],
    },
    {
      id: "spend-team-filter",
      label: "Requesting team",
      type: "select",
      value: team,
      onChange: setTeam,
      options: [
        { value: "All", label: "All teams" },
        ...teamOptions.map((value) => ({ value, label: value })),
      ],
    },
    {
      id: "spend-from",
      label: "Submitted from",
      type: "date",
      value: fromDate,
      max: toDate || undefined,
      onChange: setFromDate,
    },
    {
      id: "spend-to",
      label: "Submitted to",
      type: "date",
      value: toDate,
      min: fromDate || undefined,
      onChange: setToDate,
    },
  ];

  function resetFilters() {
    setStatus("All");
    setProject("All");
    setTeam("All");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Spending Reports"
        description={`${departmentName} departmental spending summary`}
        supplementary={
          <Link className={styles.linkButton} to="/department-manager/dashboard">
            Return to dashboard
          </Link>
        }
      />

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <FilterToolbar
        filters={filters}
        onClear={resetFilters}
      />

      <StatusCardGrid>
        <StatusCard label="Requested spending summary" value={formatCurrency(requestedTotal)} />
        <StatusCard label="Approved spending summary" value={formatCurrency(approvedTotal)} />
        <StatusCard
          label="Spending comparison"
          value={formatCurrency(variance)}
          note={variance >= 0 ? "Requested less approved" : "Variance to approved"}
        />
      </StatusCardGrid>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2 className="rt-card__title">Project spending</h2>
        {projectTotals.length === 0 ? (
          <p className={styles.empty}>No spending data is available for the selected filters.</p>
        ) : (
          <div className={styles.chart}>
            {projectTotals.map(({ project, amount }) => {
              const max = Math.max(...projectTotals.map((entry) => entry.amount), 1);
              return (
                <div key={project} className={styles.chartRow}>
                  <div className={styles.chartMeta}>
                    <span>{project}</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>
                  <div className={styles.chartTrack}>
                    <div className={styles.chartBar} style={{ width: `${(amount / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
