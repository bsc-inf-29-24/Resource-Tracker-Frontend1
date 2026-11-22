import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import StatusLabel from "../../components/status/StatusLabel";
import { getApiRecords, isApiRecord, unwrapApiResponse } from "../../data/api-response";
import type { ApiRecord } from "../../data/api-response";
import { dashboardApi, departmentsApi, reportsApi } from "../../data/api-services";
import { formatCurrency, formatDate } from "../../utils/format";
import useDepartmentScope from "./useDepartmentScope";
import styles from "./DepartmentDashboard.module.css";

interface DepartmentDashboardData {
  summary: ApiRecord;
  requests: ApiRecord[];
  teams: ApiRecord[];
  projects: ApiRecord[];
  users: ApiRecord[];
  report: ApiRecord;
}

interface DepartmentRequestRow {
  id: string;
  itemDescription: string;
  team: string;
  project: string;
  submittedAt: string;
  amount: number | null;
  status: string;
}

function getRecord(value: unknown): ApiRecord {
  const unwrapped = unwrapApiResponse(value);
  return isApiRecord(unwrapped) ? unwrapped : {};
}

function getNumber(record: ApiRecord, key: string, fallback = 0): number {
  const value = Number(record[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function getLabel(value: unknown, fallback: string): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isApiRecord(value)) {
    const label = value.name ?? value.fullName ?? value.title;
    if (typeof label === "string" || typeof label === "number") return String(label);
  }
  return fallback;
}

function getRequestAmount(request: ApiRecord): number | null {
  const directAmount =
    request.totalAmount ?? request.estimatedPrice ?? request.amount;
  if (directAmount !== undefined && directAmount !== null) {
    const amount = Number(directAmount);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }

  const price = Number(request.price);
  const quantity = Number(request.quantity);
  return request.price !== null &&
    request.price !== undefined &&
    Number.isFinite(price) &&
    price >= 0 &&
    Number.isFinite(quantity) &&
    quantity > 0
    ? price * quantity
    : null;
}

export default function DepartmentDashboard() {
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [data, setData] = useState<DepartmentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadDashboard() {
    if (!department) return;
    setLoading(true);
    setError("");
    try {
      const [
        dashboardResponse,
        requestsResponse,
        teamsResponse,
        projectsResponse,
        usersResponse,
        reportResponse,
      ] = await Promise.all([
        dashboardApi.department(String(department.id)),
        departmentsApi.requests(String(department.id)),
        departmentsApi.teams(String(department.id)),
        departmentsApi.projects(String(department.id)),
        departmentsApi.users(String(department.id)),
        reportsApi.department(String(department.id)),
      ]);
      const dashboard = getRecord(dashboardResponse);
      setData({
        summary: getRecord(dashboard.summary),
        requests: getApiRecords(requestsResponse),
        teams: getApiRecords(teamsResponse),
        projects: getApiRecords(projectsResponse),
        users: getApiRecords(usersResponse),
        report: getRecord(reportResponse),
      });
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The department dashboard could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department) void loadDashboard();
  }, [department?.id]);

  const requestRows = useMemo<DepartmentRequestRow[]>(() => {
    if (!data) return [];
    const teamsById = new Map(
      data.teams.map((team) => [String(team.id), getLabel(team.name, "Team")]),
    );
    const projectsById = new Map(
      data.projects.map((project) => [String(project.id), getLabel(project.name, "Project")]),
    );
    return data.requests
      .map((request) => {
        const requestId = request.id;
        if (typeof requestId !== "string" && typeof requestId !== "number") return null;
        const teamId = request.teamId;
        const projectId = request.projectId;
        return {
          id: String(requestId),
          itemDescription: getLabel(
            request.itemDescription ?? request.itemName,
            "Resource request",
          ),
          team: getLabel(
            request.team,
            teamId === undefined
              ? "—"
              : teamsById.get(String(teamId)) ?? `Team ${teamId}`,
          ),
          project: getLabel(
            request.project,
            projectId === undefined
              ? "—"
              : projectsById.get(String(projectId)) ?? `Project ${projectId}`,
          ),
          submittedAt: String(request.submittedAt ?? request.createdAt ?? ""),
          amount: getRequestAmount(request),
          status: String(request.status ?? "Unknown"),
        };
      })
      .filter((request): request is DepartmentRequestRow => request !== null)
      .sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() -
          new Date(left.submittedAt).getTime(),
      );
  }, [data]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? requestRows.filter((request) =>
          [
            request.id,
            request.itemDescription,
            request.project,
            request.team,
            request.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : requestRows;
    return filtered.slice(0, 5);
  }, [requestRows, search]);

  const columns = useMemo<DataTableColumn<DepartmentRequestRow>[]>(
    () => [
      { key: "id", header: "Request ID" },
      { key: "itemDescription", header: "Item description" },
      { key: "team", header: "Requesting team" },
      { key: "project", header: "Project" },
      {
        key: "submittedAt",
        header: "Submission date",
        render: (request) => formatDate(request.submittedAt),
      },
      {
        key: "amount",
        header: "Amount",
        render: (request) =>
          request.amount === null ? "—" : formatCurrency(request.amount),
      },
      {
        key: "status",
        header: "Current status",
        render: (request) => <StatusLabel status={request.status} />,
      },
      {
        key: "actions",
        header: "Action",
        render: (request) => (
          <Link
            className={styles.detailLink}
            to={`/department-manager/requests/${encodeURIComponent(request.id)}`}
          >
            View request
          </Link>
        ),
      },
    ],
    [],
  );

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

  if (loading && !data) return <LoadingState message="Loading department dashboard..." />;

  const spendingRecords = getApiRecords(data?.report.spending);
  const totalSpending = spendingRecords.reduce((total, record) => {
    const amount = Number(record.totalSpending);
    return total + (Number.isFinite(amount) && amount >= 0 ? amount : 0);
  }, 0);
  const summary = data?.summary ?? {};

  return (
    <div className={styles.page}>
      <PageHeader
        title="Department Dashboard"
        description={`${department.name} department overview`}
      />

      {error && (
        <ErrorMessage
          title="Dashboard data unavailable"
          message={error}
          onRetry={() => void loadDashboard()}
        />
      )}

      {data && (
        <>
          <StatusCardGrid>
            <StatusCard
              label="Departmental requests"
              value={getNumber(summary, "totalRequests", data.requests.length)}
            />
            <StatusCard
              label="Pending approvals"
              value={getNumber(summary, "pendingApprovals")}
            />
            <StatusCard
              label="Approved requests"
              value={getNumber(summary, "approvedRequests")}
            />
            <StatusCard
              label="Rejected requests"
              value={getNumber(summary, "rejectedRequests")}
            />
            <StatusCard label="Teams" value={data.teams.length} />
            <StatusCard label="Projects" value={data.projects.length} />
            <StatusCard label="Department users" value={data.users.length} />
          </StatusCardGrid>

          <section className={`rt-root rt-card ${styles.panel}`}>
            <h2 className="rt-card__title">Department spending</h2>
            <div className={styles.summaryGrid}>
              <StatusCard
                label="Total spending"
                value={formatCurrency(totalSpending)}
                note="Reported by the department spending endpoint"
              />
            </div>
          </section>

          <section className={styles.tableSection}>
            <label>
              Search department requests
              <input
                type="search"
                value={search}
                placeholder="Request, team, project or status"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <DataTable
              title="Recent department requests"
              columns={columns}
              rows={visibleRequests}
              itemLabel="request"
              loading={loading}
              onRetry={() => void loadDashboard()}
              emptyTitle="No department requests found"
              emptyDescription="No resource requests were returned for this department."
            />
            <Link to="/department-manager/requests">View all department requests</Link>
          </section>
        </>
      )}
    </div>
  );
}
