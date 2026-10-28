import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import FilterToolbar from "../../components/filters/filterToolbar";
import StatusLabel from "../../components/status/StatusLabel";
import { useResourceRequests } from "../../data/request-store";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  applyDepartmentFilters,
  getCurrentDepartmentManager,
  getDepartmentRequests,
} from "../../utils/department-manager";
import type { RequestStatus, ResourceRequest } from "../../types/resource-request";
import type { ToolbarFilter } from "../../components/filters/filterToolbar";
import styles from "./DepartmentRequestPage.module.css";

type StatusFilter = RequestStatus | "All";

export default function DepartmentRequestPage() {
  const navigate = useNavigate();
  const { requests, persistenceWarning } = useResourceRequests();
  const manager = getCurrentDepartmentManager();
  const departmentName = manager?.department ?? "Data Science";
  const departmentRequests = useMemo(
    () => getDepartmentRequests(requests, departmentName),
    [departmentName, requests]
  );

  const [search, setSearch] = useState("");
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

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byFilters = applyDepartmentFilters(departmentRequests, {
      project,
      team,
      status,
      startDate: fromDate,
      endDate: toDate,
    });

    return byFilters.filter((request) => {
      if (!term) return true;
      const haystack = [request.id, request.itemDescription, request.project, request.team]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [departmentRequests, fromDate, project, search, status, team, toDate]);

  const filters: ToolbarFilter[] = [
    {
      id: "request-status-filter",
      label: "Status",
      type: "select",
      value: status,
      onChange: setStatus,
      options: [
        { value: "All", label: "All statuses" },
        ...(["Submitted", "Pending", "Queried", "Approved", "Rejected"] as RequestStatus[]).map(
          (value) => ({ value, label: value })
        ),
      ],
    },
    {
      id: "request-project-filter",
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
      id: "request-team-filter",
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
      id: "request-from-date",
      label: "Submitted from",
      type: "date",
      value: fromDate,
      max: toDate || undefined,
      onChange: setFromDate,
    },
    {
      id: "request-to-date",
      label: "Submitted to",
      type: "date",
      value: toDate,
      min: fromDate || undefined,
      onChange: setToDate,
    },
  ];

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
      header: "Status",
      render: (request: ResourceRequest) => <StatusLabel status={request.status} />,
    },
    {
      key: "actions",
      header: "Action",
      render: (request: ResourceRequest) => (
        <Link
          className={styles.linkButton}
          to={`/department-manager/requests/${encodeURIComponent(request.id)}`}
        >
          View details
        </Link>
      ),
    },
  ];

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setProject("All");
    setTeam("All");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Departmental Requests"
        description={`Department requests for ${departmentName}`}
        supplementary={
          <Link className={styles.linkButton} to="/department-manager/dashboard">
            Back to dashboard
          </Link>
        }
      />

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <section className={styles.tableSection}>
        <FilterToolbar
          searchLabel="Search requests"
          searchPlaceholder="Request ID, item, project or team"
          searchValue={search}
          onSearchChange={setSearch}
          filters={filters}
          onClear={resetFilters}
        />

        <DataTable
          title={`${filteredRequests.length} ${filteredRequests.length === 1 ? "request" : "requests"}`}
          columns={columns}
          rows={filteredRequests}
          itemLabel="request"
          emptyTitle="No departmental requests found"
          emptyDescription="Try changing the filters or search term to widen the result set."
          onRowClick={(request) => navigate(`/department-manager/requests/${encodeURIComponent(request.id)}`)}
        />
      </section>
    </div>
  );
}
