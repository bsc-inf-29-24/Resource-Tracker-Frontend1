import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import WarningMessage from "../../components/feedback/WarningMessage";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import { useAuth } from "../../context/AuthContext";
import { getApiRecords, isApiRecord, unwrapApiResponse } from "../../data/api-response";
import { ApiError } from "../../data/api-client";
import { resourceRequestsApi } from "../../data/api-services";
import { formatCurrency } from "../../utils/format";
import styles from "./DepartmentDashboard.module.css";

type RequestRecord = Record<string, unknown>;

const requestStatuses = ["SUBMITTED", "QUERIED", "APPROVED", "REJECTED"] as const;

function valueLabel(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (isApiRecord(value)) {
    const label = value.name ?? value.title ?? value.id;
    if (typeof label === "string" || typeof label === "number") return String(label);
  }
  return "Not specified";
}

function requestAmount(request: RequestRecord, approved = false): number {
  const resource = isApiRecord(request.resource) ? request.resource : undefined;
  const unitPrice = Number(request.price ?? resource?.price ?? 0);
  const rawQuantity = approved
    ? request.approvedQuantity ?? request.quantity
    : request.quantity;
  const quantity = Number(rawQuantity ?? 0);
  return Number.isFinite(unitPrice * quantity) ? unitPrice * quantity : 0;
}

function requestDate(request: RequestRecord): number {
  const submittedAt = request.submittedAt ?? request.createdAt;
  const date = typeof submittedAt === "string" ? Date.parse(submittedAt) : Number.NaN;
  return Number.isFinite(date) ? date : 0;
}

function formattedDate(value: unknown): string {
  if (typeof value !== "string") return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString();
}

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentAssignmentRequired, setDepartmentAssignmentRequired] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    setDepartmentAssignmentRequired(false);
    try {
      const response = unwrapApiResponse(await resourceRequestsApi.list());
      const records = getApiRecords(response);
      if (!Array.isArray(response) || records.length !== response.length) {
        throw new Error("The resource-request endpoint returned an unexpected response.");
      }
      setRequests(records);
    } catch (loadError) {
      setRequests([]);
      if (loadError instanceof ApiError && loadError.status === 403) {
        setDepartmentAssignmentRequired(true);
        setError(
          "Your account is not currently assigned to a department. Please contact your system administrator to have your department assignment reviewed.",
        );
      } else {
        setError(
          "We are unable to display department information at this time. Please retry. If the issue persists, contact your system administrator.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const counts = useMemo(() => ({
    total: requests.length,
    ...Object.fromEntries(
      requestStatuses.map((status) => [
        status.toLowerCase(),
        requests.filter((request) => String(request.status ?? "").toUpperCase() === status).length,
      ]),
    ),
  }), [requests]);

  const requestedTotal = useMemo(
    () => requests.reduce((total, request) => total + requestAmount(request), 0),
    [requests],
  );
  const approvedTotal = useMemo(
    () => requests
      .filter((request) => String(request.status ?? "").toUpperCase() === "APPROVED")
      .reduce((total, request) => total + requestAmount(request, true), 0),
    [requests],
  );
  const projectTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const request of requests) {
      const project = valueLabel(request.projectName ?? request.project ?? request.projectId);
      totals.set(project, (totals.get(project) ?? 0) + requestAmount(request));
    }
    return Array.from(totals, ([project, amount]) => ({ project, amount }))
      .sort((left, right) => right.amount - left.amount);
  }, [requests]);

  const columns = useMemo<DataTableColumn<RequestRecord>[]>(() => [
    {
      key: "id",
      header: "Request ID",
      render: (request) => request.id == null ? "Not provided" : String(request.id),
    },
    {
      key: "resource",
      header: "Resource",
      render: (request) => String(request.itemDescription ?? request.itemName ?? "Not specified"),
    },
    {
      key: "team",
      header: "Team",
      render: (request) => valueLabel(request.teamName ?? request.team ?? request.teamId),
    },
    {
      key: "project",
      header: "Project",
      render: (request) => valueLabel(request.projectName ?? request.project ?? request.projectId),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (request) => formattedDate(request.submittedAt ?? request.createdAt),
    },
    {
      key: "amount",
      header: "Requested amount",
      render: (request) => formatCurrency(requestAmount(request)),
    },
    {
      key: "status",
      header: "Status",
      render: (request) => <StatusLabel status={String(request.status ?? "Unknown")} />,
    },
    {
      key: "details",
      header: "Details",
      render: (request) => request.id == null
        ? "Unavailable"
        : <Link to={`/department-manager/requests/${encodeURIComponent(String(request.id))}`}>View request</Link>,
    },
  ], []);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Dashboard"
        description={user?.department ? `${user.department} department overview` : "Department request analytics"}
      />
      <div className={styles.dashboardContent}>
          {error && (departmentAssignmentRequired ? (
            <WarningMessage title="Department assignment required" message={error} />
          ) : (
            <ErrorMessage title="Department information unavailable" message={error} onRetry={() => void loadRequests()} />
          ))}
          <StatusCardGrid>
            <StatusCard label="Total requests" value={requests.length} loading={loading} />
            <StatusCard label="Submitted" value={counts.submitted ?? 0} loading={loading} />
            <StatusCard label="Queried" value={counts.queried ?? 0} loading={loading} />
            <StatusCard label="Approved" value={counts.approved ?? 0} loading={loading} />
            <StatusCard label="Rejected" value={counts.rejected ?? 0} loading={loading} />
          </StatusCardGrid>

          <section className={`rt-root rt-card ${styles.panel}`}>
            <h2 className="rt-card__title">Spending overview</h2>
            <div className={styles.summaryGrid}>
              <StatusCard label="Requested spending" value={formatCurrency(requestedTotal)} loading={loading} />
              <StatusCard label="Approved spending" value={formatCurrency(approvedTotal)} loading={loading} />
              <StatusCard label="Unapproved amount" value={formatCurrency(requestedTotal - approvedTotal)} loading={loading} />
            </div>
          </section>

          <section className={`rt-root rt-card ${styles.panel}`}>
            <h2 className="rt-card__title">Requested spending by project</h2>
            {loading ? (
              <LoadingState message="Loading department analytics..." />
            ) : projectTotals.length ? (
              <div className={styles.chart} aria-label="Requested spending by project">
                {projectTotals.map(({ project, amount }) => (
                  <div key={project} className={styles.chartRow}>
                    <div className={styles.chartMeta}>
                      <span>{project}</span>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                    <div className={styles.chartTrack}>
                      <div
                        className={styles.chartBar}
                        style={{ width: `${(amount / Math.max(...projectTotals.map((item) => item.amount), 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No spending data" description="Department request spending will appear here." />
            )}
          </section>

          {loading ? (
            <LoadingState message="Loading department requests..." />
          ) : !error && requests.length ? (
            <DataTable
              title="Recent requests"
              columns={columns}
              rows={[...requests].sort((left, right) => requestDate(right) - requestDate(left)).slice(0, 5)}
              itemLabel="request"
              emptyTitle="No requests"
              emptyDescription="No department requests are currently available."
            />
          ) : !error ? (
            <EmptyState
              title="No department requests"
              description="Requests submitted by teams in your department will appear here."
              actionLabel="View requests"
              onAction={() => navigate("/department-manager/requests")}
            />
          ) : null}
      </div>
    </section>
  );
}