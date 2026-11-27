import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  MessageCircle,
  Package,
  UsersRound,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import StatusLabel from "../../components/status/StatusLabel";
import { useAuth } from "../../context/AuthContext";
import {
  isApiRecord,
  formatApiValue,
} from "../../data/api-response";
import {
  resourceRequestsApi,
  teamsApi,
  type ApiRequestStatus,
} from "../../data/api-services";
import { getAssignedTeams, getTeamId, relatedLabel, recordsFromResponse } from "./manager-data";
import styles from "./LineManagerDashboard.module.css";

type RecordValue = Record<string, unknown>;
type TrendPeriod = "daily" | "weekly" | "monthly";
type DashboardAction = "approve" | "reject" | "query";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "QUERIED" | "OTHER";

const chartStatuses: { status: RequestStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "#b7791f" },
  { status: "APPROVED", label: "Approved", color: "#23815b" },
  { status: "REJECTED", label: "Rejected", color: "#b43f3f" },
  { status: "QUERIED", label: "Queried", color: "#5865a5" },
];

function requestStatus(request: RecordValue): RequestStatus {
  const status = String(request.status ?? "").trim().toUpperCase();
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED" || status === "DECLINED") return "REJECTED";
  if (status === "QUERIED") return "QUERIED";
  if (status === "SUBMITTED" || status === "PENDING") return "PENDING";
  return "OTHER";
}

function requestDate(request: RecordValue): Date | null {
  const raw = request.submittedAt ?? request.createdAt ?? request.requestedAt;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function teamName(request: RecordValue): string {
  return relatedLabel(request.team ?? request.teamName ?? request.requestingTeam);
}

function requestTeamId(request: RecordValue): string {
  const raw = request.teamId ?? (isApiRecord(request.team) ? request.team.id : undefined);
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
}

function requestMatchesTeam(request: RecordValue, team: RecordValue): boolean {
  const id = getTeamId(team);
  const name = relatedLabel(team).toLocaleLowerCase();
  return (id && requestTeamId(request) === id) || teamName(request).toLocaleLowerCase() === name;
}

function localDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodBuckets(period: TrendPeriod, requests: RecordValue[]) {
  const end = new Date();
  const start = new Date(end);
  if (period === "daily") start.setDate(end.getDate() - 6);
  if (period === "weekly") start.setDate(end.getDate() - 49);
  if (period === "monthly") start.setMonth(end.getMonth() - 5, 1);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const firstDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const maxBuckets = period === "daily" ? 7 : period === "weekly" ? 8 : 6;
  const buckets: { key: string; label: string; value: number }[] = [];

  if (period === "daily") {
    const bucketStart = new Date(Math.max(firstDay.getTime(), endDay.getTime() - (maxBuckets - 1) * 86400000));
    for (const date = new Date(bucketStart); date <= endDay; date.setDate(date.getDate() + 1)) {
      buckets.push({
        key: localDay(date),
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: 0,
      });
    }
  } else if (period === "weekly") {
    const startWeek = new Date(firstDay);
    startWeek.setDate(startWeek.getDate() - ((startWeek.getDay() + 6) % 7));
    const endWeek = new Date(endDay);
    endWeek.setDate(endWeek.getDate() - ((endWeek.getDay() + 6) % 7));
    const cappedStart = new Date(Math.max(startWeek.getTime(), endWeek.getTime() - (maxBuckets - 1) * 7 * 86400000));
    for (const date = new Date(cappedStart); date <= endWeek; date.setDate(date.getDate() + 7)) {
      buckets.push({
        key: localDay(date),
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: 0,
      });
    }
  } else {
    const startMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    const endMonth = new Date(endDay.getFullYear(), endDay.getMonth(), 1);
    const cappedStart = new Date(Math.max(startMonth.getTime(), new Date(endMonth.getFullYear(), endMonth.getMonth() - maxBuckets + 1, 1).getTime()));
    for (const date = new Date(cappedStart); date <= endMonth; date.setMonth(date.getMonth() + 1)) {
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        value: 0,
      });
    }
  }

  for (const request of requests) {
    const date = requestDate(request);
    if (!date) continue;
    const key = period === "daily"
      ? localDay(date)
      : period === "weekly"
        ? (() => {
            const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
            return localDay(weekStart);
          })()
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.value += 1;
  }
  return buckets;
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function requestIdentifier(request: RecordValue) {
  const id = request.id ?? request.requestId;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

export default function LineManagerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RecordValue[]>([]);
  const [teams, setTeams] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("daily");
  const [actionRequest, setActionRequest] = useState<RecordValue | null>(null);
  const [actionType, setActionType] = useState<DashboardAction | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [approveRequestRecord, setApproveRequestRecord] = useState<RecordValue | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const [requestResult, teamResult] = await Promise.allSettled([
      resourceRequestsApi.list(),
      teamsApi.list(),
    ]);
    const nextErrors: Record<string, string> = {};
    if (requestResult.status === "fulfilled") {
      try {
        setRequests(recordsFromResponse(requestResult.value, "resource requests"));
      } catch (error) {
        setRequests([]);
        nextErrors.requests = error instanceof Error ? error.message : "Requests could not be loaded.";
      }
    } else {
      setRequests([]);
      nextErrors.requests = requestResult.reason instanceof Error
        ? requestResult.reason.message
        : "Resource requests could not be loaded.";
    }
    if (teamResult.status === "fulfilled") {
      try {
        setTeams(recordsFromResponse(teamResult.value, "teams"));
      } catch (error) {
        setTeams([]);
        console.error("Line Manager dashboard team data could not be loaded.", error);
        nextErrors.teams = error instanceof Error ? error.message : "Teams could not be loaded.";
      }
    } else {
      setTeams([]);
      console.error("Line Manager dashboard team data request failed.", teamResult.reason);
      nextErrors.teams = teamResult.reason instanceof Error
        ? teamResult.reason.message
        : "Assigned teams could not be loaded.";
    }
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void loadDashboard();
    };
    const intervalId = window.setInterval(refreshOnFocus, 60_000);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [loadDashboard]);

  const assignedTeams = useMemo(
    () => user ? getAssignedTeams(teams, user) : [],
    [teams, user],
  );
  const assignedTeamNames = useMemo(() => {
    const names = new Set(assignedTeams.map((team) => relatedLabel(team)).filter((name) => name !== "—"));
    if (user?.team) names.add(user.team);
    for (const request of requests) {
      if (request.team && !isApiRecord(request.team)) names.add(String(request.team));
    }
    return Array.from(names);
  }, [assignedTeams, requests, user?.team]);

  const scopedRequests = useMemo(() => {
    if (!assignedTeams.length) return requests;
    return requests.filter((request) => assignedTeams.some((team) => requestMatchesTeam(request, team)));
  }, [assignedTeams, requests]);
  const counts = useMemo(() => ({
    total: scopedRequests.length,
    pending: scopedRequests.filter((request) => requestStatus(request) === "PENDING").length,
    approved: scopedRequests.filter((request) => requestStatus(request) === "APPROVED").length,
    rejected: scopedRequests.filter((request) => requestStatus(request) === "REJECTED").length,
    queried: scopedRequests.filter((request) => requestStatus(request) === "QUERIED").length,
  }), [scopedRequests]);

  const statusCounts = chartStatuses.map((entry) => ({
    ...entry,
    value: scopedRequests.filter((request) => requestStatus(request) === entry.status).length,
  }));
  const totalStatusCount = statusCounts.reduce((sum, item) => sum + item.value, 0);
  let chartOffset = 0;
  const doughnutBackground = statusCounts.map((entry) => {
    const start = chartOffset;
    chartOffset += totalStatusCount ? entry.value / totalStatusCount * 100 : 0;
    return `${entry.color} ${start}% ${chartOffset}%`;
  }).join(", ");

  const trend = useMemo(
    () => periodBuckets(trendPeriod, scopedRequests),
    [scopedRequests, trendPeriod],
  );
  const trendMax = Math.max(1, ...trend.map((item) => item.value));
  const trendPoints = trend.map((item, index) => {
    const x = trend.length > 1 ? 12 + index * (576 / (trend.length - 1)) : 300;
    const y = 128 - item.value / trendMax * 105;
    return `${x},${y}`;
  }).join(" ");

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return scopedRequests.filter((request) => {
      const requestTeam = teamName(request);
      const searchable = [
        requestIdentifier(request),
        request.itemDescription,
        request.resourceName,
        request.priority,
        request.requester,
        request.requestedByName,
        relatedLabel(request.requestedBy ?? request.requester ?? request.createdBy),
        requestTeam,
      ].filter((value) => typeof value === "string" || typeof value === "number").join(" ").toLocaleLowerCase();
      const status = requestStatus(request);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      return (
        (!term || searchable.includes(term)) &&
        matchesStatus &&
        (teamFilter === "ALL" || requestTeam === teamFilter)
      );
    }).sort((left, right) => {
      const leftTime = requestDate(left)?.getTime() ?? 0;
      const rightTime = requestDate(right)?.getTime() ?? 0;
      return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [scopedRequests, search, sortOrder, statusFilter, teamFilter]);

  const recentColumns = useMemo<DataTableColumn<RecordValue>[]>(() => [
    { key: "id", header: "Request ID", render: (request) => requestIdentifier(request) || "—" },
    {
      key: "requester",
      header: "Requesting employee",
      render: (request) => relatedLabel(request.requestedBy ?? request.requester ?? request.createdBy ?? request.requestedByName),
    },
    { key: "team", header: "Team", render: teamName },
    {
      key: "resource",
      header: "Resource requested",
      render: (request) => String(request.itemDescription ?? request.resourceName ?? relatedLabel(request.resource)),
    },
    { key: "quantity", header: "Quantity", render: (request) => formatApiValue(request.quantity) },
    {
      key: "date",
      header: "Submission date",
      render: (request) => requestDate(request)?.toLocaleDateString() ?? "—",
    },
    {
      key: "priority",
      header: "Priority",
      render: (request) => formatApiValue(request.priority ?? request.urgency),
    },
    {
      key: "status",
      header: "Status",
      render: (request) => <StatusLabel status={String(request.status ?? "")} />,
    },
    {
      key: "actions",
      header: "Available actions",
      render: (request) => {
        const id = requestIdentifier(request);
        const actionable = requestStatus(request) === "PENDING";
        return (
          <div className={styles.rowActions}>
            {id && <Link to={`/line-manager/requests/${encodeURIComponent(id)}`}>View details</Link>}
            {actionable && id && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActionError("");
                    setApproveRequestRecord(request);
                  }}
                >
                  Approve
                </button>
                <button type="button" onClick={() => openAction(request, "reject")}>Reject</button>
                <button type="button" onClick={() => openAction(request, "query")}>Query</button>
              </>
            )}
          </div>
        );
      },
    },
  ], []);

  function openAction(request: RecordValue, action: DashboardAction) {
    setActionRequest(request);
    setActionType(action);
    setActionNote("");
    setActionError("");
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = actionRequest ? requestIdentifier(actionRequest) : "";
    if (!id || !actionType) {
      setActionError("Select a request before submitting a decision.");
      return;
    }
    const note = actionNote.trim();
    if (!note) {
      setActionError(actionType === "query" ? "Describe the information needed." : "A rejection reason is required.");
      return;
    }
    setBusy(true);
    setActionError("");
    setNotice("");
    const status: ApiRequestStatus = actionType === "query" ? "QUERIED" : "REJECTED";
    try {
      await resourceRequestsApi.update(id, { status, note });
      setNotice(`Request ${id} updated.`);
      setActionRequest(null);
      setActionType(null);
      await loadDashboard();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "The request decision could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmApproveRequest() {
    const id = approveRequestRecord ? requestIdentifier(approveRequestRecord) : "";
    if (!id) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await resourceRequestsApi.update(id, { status: "APPROVED" });
      setApproveRequestRecord(null);
      setNotice(`Request ${id} approved.`);
      await loadDashboard();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "The request could not be approved.");
    } finally {
      setBusy(false);
    }
  }

  const currentDate = new Date();

  function filterByStatus(status: string) {
    setStatusFilter(status);
    document.getElementById("manager-recent-requests")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const actionTitle = actionType === "query" ? "Query request" : "Reject request";

  return (
    <main className={styles.page}>
      <header className={styles.welcome}>
        <div>
          <h1>{getGreeting(currentDate.getHours())}, {user?.fullName ?? "Manager"}</h1>
          <p className={styles.welcomeText}>Here’s what’s happening across your teams today.</p>
        </div>
        <div className={styles.welcomeSide}>
          <time className={styles.currentDate} dateTime={localDay(currentDate)}>
            <CalendarDays size={17} aria-hidden="true" />
            {currentDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </time>
        </div>
      </header>

      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {actionError && <ErrorMessage title="Request action failed" message={actionError} />}
      {errors.requests && <ErrorMessage title="Request data unavailable" message={errors.requests} onRetry={() => void loadDashboard()} />}

      <section className={styles.statsSection} aria-label="Request statistics">
        <StatusCardGrid>
          <StatusCard label="Total requests" value={counts.total} icon={<ClipboardList size={20} />} loading={loading} onClick={() => filterByStatus("ALL")} />
          <StatusCard label="Pending requests" value={counts.pending} icon={<Clock3 size={20} />} note="Awaiting manager decision" loading={loading} onClick={() => filterByStatus("PENDING")} />
          <StatusCard label="Approved requests" value={counts.approved} icon={<CheckCircle2 size={20} />} loading={loading} onClick={() => filterByStatus("APPROVED")} />
          <StatusCard label="Rejected requests" value={counts.rejected} icon={<XCircle size={20} />} loading={loading} onClick={() => filterByStatus("REJECTED")} />
          <StatusCard label="Queried requests" value={counts.queried} icon={<MessageCircle size={20} />} loading={loading} onClick={() => filterByStatus("QUERIED")} />
        </StatusCardGrid>
      </section>

      <div className={styles.analyticsLayout}>
        <section className={styles.chartGrid} aria-label="Request analytics">
          <article className={`rt-root rt-card ${styles.chartCard}`}>
            <div className={styles.cardHeading}>
              <div><h2>Request trends</h2><p>Requests submitted over time</p></div>
              <label className={styles.compactSelect}>Period
                <select value={trendPeriod} onChange={(event) => setTrendPeriod(event.target.value as TrendPeriod)}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </label>
            </div>
            {loading ? <LoadingState message="Loading trend data…" /> : (
              <div className={styles.lineChart}>
                <svg viewBox="0 0 600 150" role="img" aria-label={`${trend.reduce((sum, item) => sum + item.value, 0)} requests shown in the selected trend period`}>
                  <line x1="12" y1="128" x2="588" y2="128" className={styles.axis} />
                  <line x1="12" y1="76" x2="588" y2="76" className={styles.gridLine} />
                  <line x1="12" y1="23" x2="588" y2="23" className={styles.gridLine} />
                  {trend.length > 1 && <polyline points={trendPoints} className={styles.trendLine} />}
                  {trend.map((item, index) => {
                    const x = trend.length > 1 ? 12 + index * (576 / (trend.length - 1)) : 300;
                    const y = 128 - item.value / trendMax * 105;
                    return <g key={`${item.key}-${index}`}><circle cx={x} cy={y} r="4" className={styles.trendPoint}><title>{`${item.label}: ${item.value}`}</title></circle></g>;
                  })}
                </svg>
                <div className={styles.chartLabels}>{trend.map((item) => <span key={item.key}>{item.label}</span>)}</div>
                <p className={styles.chartCaption}>Selected period contains {trend.reduce((sum, item) => sum + item.value, 0)} submitted requests.</p>
              </div>
            )}
          </article>

          <article className={`rt-root rt-card ${styles.chartCard}`}>
            <div className={styles.cardHeading}><div><h2>Request status</h2><p>Distribution by current status</p></div></div>
            {loading ? <LoadingState message="Loading status data…" /> : (
              <div className={styles.doughnutLayout}>
                <div
                  className={styles.doughnut}
                  style={{ background: totalStatusCount ? `conic-gradient(${doughnutBackground})` : "conic-gradient(#e8ece9 0% 100%)" }}
                  role="img"
                  aria-label={statusCounts.map((item) => `${item.label}: ${item.value}`).join(", ")}
                >
                  <span><strong>{totalStatusCount}</strong><small>requests</small></span>
                </div>
                <ul className={styles.legend}>
                  {statusCounts.map((item) => <li key={item.status}><span style={{ backgroundColor: item.color }} />{item.label}<strong>{item.value}</strong></li>)}
                </ul>
              </div>
            )}
          </article>
        </section>

        <section id="manager-recent-requests" className={`rt-root rt-card ${styles.recentSection}`}>
          <div className={styles.cardHeading}>
            <div><h2>Recent requests</h2><p>Latest submissions from your team scope. Review actions are enforced by the backend.</p></div>
            <Link to="/line-manager/all-requests">View all requests</Link>
          </div>
          <div className={styles.tableFilters}>
            <label>Search <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, employee, team, resource…" /></label>
            <label>Status <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="QUERIED">Queried</option></select></label>
            <label>Team <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="ALL">All teams</option>{assignedTeamNames.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
            <label>Sort <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          </div>
          {loading ? <LoadingState message="Loading recent requests…" /> : errors.requests ? null : (
            <DataTable
              columns={recentColumns}
              rows={filteredRequests}
              rowKey={(request, index) => requestIdentifier(request) || index}
              itemLabel="request"
              pageSize={8}
              emptyTitle="No matching requests"
              emptyDescription="Adjust the search criteria or filters to broaden the results."
            />
          )}
        </section>
      </div>

      <section className={`rt-root rt-card ${styles.quickActions}`}>
        <div className={styles.cardHeading}><div><h2>Quick actions</h2><p>Open your common manager workflows.</p></div></div>
        <div className={styles.quickGrid}>
          <Link to="/line-manager/requests"><Clock3 /><span><strong>Review pending requests</strong><small>{counts.pending} waiting</small></span></Link>
          <Link to="/line-manager/all-requests"><ClipboardList /><span><strong>View all requests</strong><small>Search the manager request scope</small></span></Link>
          <Link to="/line-manager/teams"><UsersRound /><span><strong>Assigned teams</strong><small>View team assignments</small></span></Link>
          <Link to="/line-manager/teams?view=members"><UsersRound /><span><strong>Team members</strong><small>Browse members by assigned team</small></span></Link>
          <Link to="/line-manager/allocations"><Package /><span><strong>Resource availability</strong><small>Inspect and allocate inventory</small></span></Link>
          <Link to="/line-manager/reports"><BarChart3 /><span><strong>Generate reports</strong><small>Export scoped request data</small></span></Link>
          <Link to="/line-manager/activity"><History /><span><strong>Activity history</strong><small>Inspect recorded manager audit events</small></span></Link>
        </div>
      </section>

      {actionType && actionRequest && (
        <div className={styles.actionBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            setActionType(null);
            setActionRequest(null);
          }
        }}>
          <section className={styles.actionDialog} role="dialog" aria-modal="true" aria-labelledby="manager-action-title">
            <h2 id="manager-action-title">{actionTitle}</h2>
            <p>Request {requestIdentifier(actionRequest)} — {String(actionRequest.itemDescription ?? actionRequest.resourceName ?? "resource request")}</p>
            {actionError && <ErrorMessage title="Request action failed" message={actionError} />}
            <form onSubmit={(event) => void submitDecision(event)}>
              <label htmlFor="manager-action-note">{actionType === "query" ? "Information required" : "Reason for rejection"}</label>
              <textarea id="manager-action-note" rows={4} value={actionNote} onChange={(event) => setActionNote(event.target.value)} required />
              <div className={styles.dialogButtons}>
                <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={busy} onClick={() => { setActionType(null); setActionRequest(null); }}>Cancel</button>
                <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={busy}>{busy ? "Submitting…" : actionType === "query" ? "Send query" : "Reject request"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(approveRequestRecord)}
        title="Approve this request?"
        message={approveRequestRecord ? `Confirm approval of request ${requestIdentifier(approveRequestRecord)}.` : ""}
        confirmLabel={busy ? "Approving…" : "Approve request"}
        onCancel={() => { if (!busy) setApproveRequestRecord(null); }}
        onConfirm={() => void confirmApproveRequest()}
        loading={busy}
      />
    </main>
  );
}
