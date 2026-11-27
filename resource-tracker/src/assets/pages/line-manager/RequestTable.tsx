import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { RequestStatus, ResourceRequest } from "../../types/resource-request";
import { formatCurrency, formatDate } from "../../utils/format";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import FilterToolbar from "../../components/filters/filterToolbar";
import type { ToolbarFilter } from "../../components/filters/filterToolbar";
import styles from "./RequestTable.module.css";

type StatusFilter = RequestStatus | "All";

interface RequestTableProps {
  requests: ResourceRequest[];
}

const pageSize = 8;

function getSubmissionDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RequestTable({ requests }: RequestTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [project, setProject] = useState("All");
  const [team, setTeam] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const projects = useMemo(
    () =>
      Array.from(new Set(requests.map((request) => request.project).filter(Boolean))).sort(),
    [requests]
  );
  const teams = useMemo(
    () =>
      Array.from(new Set(requests.map((request) => request.team).filter(Boolean))).sort(),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();

    return requests.filter((request) => {
      const requestDay = getSubmissionDay(request.submittedAt);
      const searchableText = [
        request.id,
        request.team,
        request.project,
        request.itemDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!term || searchableText.includes(term)) &&
        (status === "All" || request.status === status) &&
        (project === "All" || request.project === project) &&
        (team === "All" || request.team === team) &&
        (!fromDate || (requestDay && requestDay >= fromDate)) &&
        (!toDate || (requestDay && requestDay <= toDate))
      );
    });
  }, [requests, search, status, project, team, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const filters: ToolbarFilter[] = [
    {
      id: "request-status-filter",
      label: "Status",
      type: "select",
      value: status,
      onChange: (value) => updateStatus(value as StatusFilter),
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
      onChange: updateProject,
      options: [
        { value: "All", label: "All projects" },
        ...projects.map((value) => ({ value, label: value })),
      ],
    },
    {
      id: "request-team-filter",
      label: "Requesting team",
      type: "select",
      value: team,
      onChange: updateTeam,
      options: [
        { value: "All", label: "All teams" },
        ...teams.map((value) => ({ value, label: value })),
      ],
    },
    {
      id: "request-date-from-filter",
      label: "Submitted from",
      type: "date",
      value: fromDate,
      max: toDate || undefined,
      onChange: (value) => updateDateRange(value, toDate),
    },
    {
      id: "request-date-to-filter",
      label: "Submitted to",
      type: "date",
      value: toDate,
      min: fromDate || undefined,
      onChange: (value) => updateDateRange(fromDate, value),
    },
  ];

  const columns: DataTableColumn<ResourceRequest>[] = [
    { key: "id", header: "Request ID" },
    {
      key: "team",
      header: "Requesting team",
      render: (request) => request.team || "Not provided",
    },
    {
      key: "project",
      header: "Project",
      render: (request) => request.project || "Not provided",
    },
    {
      key: "submittedAt",
      header: "Submission date",
      render: (request) => formatDate(request.submittedAt),
    },
    {
      key: "estimatedPrice",
      header: "Estimated amount",
      render: (request) => formatCurrency(request.estimatedPrice),
    },
    {
      key: "status",
      header: "Status",
      render: (request) => <StatusLabel status={request.status} />,
    },
    {
      key: "actions",
      header: "Available actions",
      render: (request) => (
        <Link
          className={styles.detailsLink}
          to={`/line-manager/requests/${encodeURIComponent(request.id)}`}
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
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatus(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function updateProject(value: string) {
    setProject(value);
    setPage(1);
  }

  function updateTeam(value: string) {
    setTeam(value);
    setPage(1);
  }

  function updateDateRange(start: string, end: string) {
    setFromDate(start);
    setToDate(end);
    setPage(1);
  }

  return (
    <section className={`rt-root ${styles.section}`} aria-label="Resource requests">
      <FilterToolbar
        searchLabel="Search requests"
        searchPlaceholder="Request ID, team, project or item"
        searchValue={search}
        onSearchChange={updateSearch}
        filters={filters}
        onClear={resetFilters}
      />
      <DataTable
        title={`${filteredRequests.length} ${
          filteredRequests.length === 1 ? "request" : "requests"
        }`}
        columns={columns}
        rows={visibleRequests}
        page={currentPage}
        pageSize={pageSize}
        total={filteredRequests.length}
        onPageChange={setPage}
        itemLabel="request"
        emptyTitle="No matching requests"
        emptyDescription="Try changing or clearing the search and filters."
        emptyActionLabel="Clear filters"
        onEmptyAction={resetFilters}
      />
    </section>
  );
}
