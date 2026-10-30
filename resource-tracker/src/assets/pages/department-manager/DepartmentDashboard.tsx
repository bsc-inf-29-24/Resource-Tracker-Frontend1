import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import FilterToolbar from "../../components/filters/filterToolbar";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import StatusLabel from "../../components/status/StatusLabel";
import { useResourceRequests } from "../../data/request-store";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  applyDepartmentFilters,
  getApprovedAmount,
  getCurrentDepartmentManager,
  getDepartmentRequests,
  getProjectTotals,
  getRecentRequests,
  getRequestedAmount,
  getSpentDifference,
  getStatusCounts,
} from "../../utils/department-manager";
import type { RequestStatus, ResourceRequest } from "../../types/resource-request";
import type { ToolbarFilter } from "../../components/filters/filterToolbar";
import styles from "./DepartmentDashboard.module.css";

type StatusFilter = RequestStatus | "All";

export default function DepartmentDashboard() {
  const navigate = useNavigate();
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

  const statusCounts = getStatusCounts(filteredRequests);
  const requestedTotal = getRequestedAmount(filteredRequests);
  const approvedTotal = getApprovedAmount(filteredRequests);
  const comparisonDifference = getSpentDifference(filteredRequests);
  const recentRequests = getRecentRequests(filteredRequests, 5);
  const projectTotals = getProjectTotals(filteredRequests);

  const filters: ToolbarFilter[] = [
    {
      id: "department-status-filter",
      label: "Status",
      type: "select",
      value: status,
      onChange: (value: any) => setStatus(value),
      options: [
        { value: "All", label: "All statuses" },
        ...(["Submitted", "Pending", "Queried", "Approved", "Rejected"] as RequestStatus[]).map(
          (value) => ({ value, label: value })
        ),
      ],
    },
    {
      id: "department-project-filter",
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
      id: "department-team-filter",
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
      id: "department-date-from",
      label: "Submitted from",
      type: "date",
      value: fromDate,
      max: toDate || undefined,
      onChange: setFromDate,
    },
    {
      id: "department-date-to",
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

  const columns = [
    { key: "id", header: "Request ID" },
    { key: "itemDescription", header: "Item description" },
    { key: "team", header: "Requesting team" },
    { key: "project", header: "Project" },
    {
      key: "submittedAt",
      header: "Submission date",
      render: (request: ResourceRequest) => formatDate(request.submittedAt),
    },
    {
      key: "estimatedPrice",
      header: "Estimated amount",
      render: (request: ResourceRequest) => formatCurrency(request.estimatedPrice),
    },
    {
      key: "status",
      header: "Current status",
      render: (request: ResourceRequest) => <StatusLabel status={request.status} />,
    },
    {
      key: "actions",
      header: "Available action",
      render: (request: ResourceRequest) => (
        <Link
          className={styles.detailLink}
          to={`/department-manager/requests/${encodeURIComponent(request.id)}`}
        >
          View request
        </Link>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Department Manager Dashboard"
        description={`${departmentName} department overview`}
        supplementary={
          <Link className={styles.linkButton} to="/department-manager/requests">
            Open request list
          </Link>
        }
      />

      
      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <StatusCardGrid>
        <StatusCard label="Departmental requests" value={departmentRequests.length} />
        <StatusCard label="Submitted" value={statusCounts.Submitted} />
        <StatusCard label="Pending" value={statusCounts.Pending} />
        <StatusCard label="Queried" value={statusCounts.Queried} />
        <StatusCard label="Approved" value={statusCounts.Approved} />
        <StatusCard label="Rejected" value={statusCounts.Rejected} />
      </StatusCardGrid>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2 className="rt-card__title">Spending overview</h2>
        <div className={styles.summaryGrid}>
          <StatusCard label="Requested spending" value={formatCurrency(requestedTotal)} />
          <StatusCard label="Approved spending" value={formatCurrency(approvedTotal)} />
          <StatusCard
            label="Difference"
            value={formatCurrency(comparisonDifference)}
            note={comparisonDifference >= 0 ? "Requested minus approved" : "Negative variance"}
          />
        </div>
      </section>

      <section className={`rt-root rt-card ${styles.panel}`} aria-labelledby="department-spending-visualization">
        <h2 id="department-spending-visualization" className="rt-card__title">
          Spending by project
        </h2>
        {projectTotals.length === 0 ? (
          <p className={styles.empty}>No spending data to visualize for the current filters.</p>
        ) : (
          <div className={styles.chart} aria-label="Department spending by project">
            {projectTotals.map(({ project, amount }) => {
              const max = Math.max(...projectTotals.map((entry) => entry.amount), 1);
              const width = `${(amount / max) * 100}%`;
              return (
                <div key={project} className={styles.chartRow}>
                  <div className={styles.chartMeta}>
                    <span>{project}</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>
                  <div className={styles.chartTrack}>
                    <div className={styles.chartBar} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.tableSection}>
        <FilterToolbar
          searchLabel="Search requests"
          searchPlaceholder="ID, team, project or item"
          searchValue=""
          onSearchChange={() => undefined}
          filters={filters}
          onClear={resetFilters}
        />
        <DataTable
          title={`Recent ${filteredRequests.length} ${filteredRequests.length === 1 ? "request" : "requests"}`}
          columns={columns}
          rows={recentRequests}
          pageSize={5}
          itemLabel="request"
          emptyTitle="No requests found"
          emptyDescription="No requests match the selected department filters."
          onRowClick={(request) => navigate(`/department-manager/requests/${encodeURIComponent(request.id)}`)}
        />
      </section>
    </div>
  );
}
