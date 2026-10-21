import { useMemo, useState } from "react";
import { mockRequests } from "../../data/mock-data";
import type { RequestStatus } from "../../types/resource-request";
import {
  All_STATUSES,
  countByStatus,
  filterByStatus,
  getRequestsAwaitingAction,
  hasTeamLeadReplied,
} from "../../utils/status";
import { formatCurrency, formatDate } from "../../utils/format";
import styles from "./LineManagerDashboard.module.css";

type StatusFilter = RequestStatus | "All";

export default function LineManagerDashboard() {
  // TODO: replace with data from services/ filtered to this manager's requests.
  const requests = mockRequests;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [project, setProject] = useState("All");
  const [team, setTeam] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Cards always show totals across all requests, not the filtered list.
  const counts = countByStatus(requests);
  const queriedReplied = filterByStatus(requests, "Queried").filter(
    hasTeamLeadReplied
  ).length;
  const awaitingAction = getRequestsAwaitingAction(requests);

  const projects = useMemo(
    () => Array.from(new Set(requests.map((r) => r.project))).sort(),
    [requests]
  );
  const teams = useMemo(
    () => Array.from(new Set(requests.map((r) => r.team))).sort(),
    [requests]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((r) => {
      const day = r.submittedAt.slice(0, 10); // "YYYY-MM-DD"

      if (term) {
        const text = `${r.id} ${r.itemDescription} ${r.team} ${r.project}`.toLowerCase();
        if (!text.includes(term)) return false;
      }
      if (status !== "All" && r.status !== status) return false;
      if (project !== "All" && r.project !== project) return false;
      if (team !== "All" && r.team !== team) return false;
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    });
  }, [requests, search, status, project, team, fromDate, toDate]);

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
      <h1 className={styles.heading}>Line Manager Dashboard</h1>

      {/* Summary cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Pending review</p>
          <p className={styles.cardValue}>{counts.Pending}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Queried</p>
          <p className={styles.cardValue}>{counts.Queried}</p>
          <p className={styles.cardNote}>{queriedReplied} with a reply</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Approved</p>
          <p className={styles.cardValue}>{counts.Approved}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Rejected</p>
          <p className={styles.cardValue}>{counts.Rejected}</p>
        </div>
      </div>

      {/* Requests requiring attention */}
      <section aria-labelledby="attention-heading" className={styles.section}>
        <h2 id="attention-heading" className={styles.sectionTitle}>
          Requests requiring attention
        </h2>
        {awaitingAction.length === 0 ? (
          <p className={styles.muted}>Nothing needs your action right now.</p>
        ) : (
          <ul className={styles.attentionList}>
            {awaitingAction.map((r) => (
              <li key={r.id} className={styles.attentionItem}>
                <strong>{r.id}</strong> {r.itemDescription}
                <span className={styles.muted}>
                  {" "}
                  {r.status === "Queried" ? "(Team Lead replied)" : "(awaiting review)"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Request list with search and filters */}
      <section aria-labelledby="requests-heading" className={styles.section}>
        <h2 id="requests-heading" className={styles.sectionTitle}>
          All requests
        </h2>

        <div className={styles.filters}>
          <label className={styles.filter}>
            Search
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID, item, team or project"
            />
          </label>

          <label className={styles.filter}>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="All">All</option>
              {All_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filter}>
            Project
            <select value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="All">All</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filter}>
            Team
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="All">All</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filter}>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>

          <label className={styles.filter}>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>

          <button type="button" onClick={resetFilters} className={styles.reset}>
            Reset
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Team</th>
                <th>Project</th>
                <th>Submitted</th>
                <th>Estimated amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>
                    No requests match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.team}</td>
                    <td>{r.project}</td>
                    <td>{formatDate(r.submittedAt)}</td>
                    <td>{formatCurrency(r.estimatedPrice)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}