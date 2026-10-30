import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import styles from "./ResourceAllocationDashboard.module.css";

const resourceRequests = [
  { id: "REQ-2401", project: "Predictive Insights", team: "AI Engineering", resource: "GPU workstations", type: "Hardware", requested: 8, approved: 6, requestedAt: "2026-09-04" },
  { id: "REQ-2402", project: "Predictive Insights", team: "AI Engineering", resource: "Cloud compute units", type: "Cloud services", requested: 24, approved: 24, requestedAt: "2026-09-08" },
  { id: "REQ-2403", project: "Predictive Insights", team: "Core Development", resource: "Developer laptops", type: "Hardware", requested: 5, approved: 3, requestedAt: "2026-09-10" },
  { id: "REQ-2404", project: "Customer Portal", team: "Core Development", resource: "Developer laptops", type: "Hardware", requested: 7, approved: 7, requestedAt: "2026-09-12" },
  { id: "REQ-2405", project: "Customer Portal", team: "Core Development", resource: "Cloud compute units", type: "Cloud services", requested: 16, approved: 12, requestedAt: "2026-09-15" },
  { id: "REQ-2406", project: "Customer Portal", team: "Finance", resource: "Analytics licenses", type: "Software", requested: 10, approved: 8, requestedAt: "2026-09-18" },
  { id: "REQ-2407", project: "Forecast Modernization", team: "Finance", resource: "Analytics licenses", type: "Software", requested: 14, approved: 14, requestedAt: "2026-09-20" },
  { id: "REQ-2408", project: "Forecast Modernization", team: "AI Engineering", resource: "GPU workstations", type: "Hardware", requested: 4, approved: 0, requestedAt: "2026-09-24" },
  { id: "REQ-2409", project: "Forecast Modernization", team: "Core Development", resource: "Cloud compute units", type: "Cloud services", requested: 12, approved: 8, requestedAt: "2026-10-02" },
  { id: "REQ-2410", project: "Data Governance", team: "Finance", resource: "Secure storage units", type: "Infrastructure", requested: 6, approved: 4, requestedAt: "2026-10-05" },
  { id: "REQ-2411", project: "Data Governance", team: "AI Engineering", resource: "Analytics licenses", type: "Software", requested: 6, approved: 6, requestedAt: "2026-10-08" },
  { id: "REQ-2412", project: "Data Governance", team: "Core Development", resource: "Developer laptops", type: "Hardware", requested: 3, approved: 2, requestedAt: "2026-10-12" },
];

const allocationHistory = [
  { id: "ALC-8101", resource: "GPU workstations", project: "Predictive Insights", team: "AI Engineering", type: "Hardware", date: "2026-10-01", quantity: 4, status: "Deployed" },
  { id: "ALC-8102", resource: "Cloud compute units", project: "Predictive Insights", team: "AI Engineering", type: "Cloud services", date: "2026-10-03", quantity: 12, status: "Deployed" },
  { id: "ALC-8103", resource: "Developer laptops", project: "Customer Portal", team: "Core Development", type: "Hardware", date: "2026-10-06", quantity: 5, status: "Deployed" },
  { id: "ALC-8104", resource: "Analytics licenses", project: "Customer Portal", team: "Finance", type: "Software", date: "2026-10-09", quantity: 6, status: "In progress" },
  { id: "ALC-8105", resource: "Analytics licenses", project: "Forecast Modernization", team: "Finance", type: "Software", date: "2026-10-11", quantity: 10, status: "Deployed" },
  { id: "ALC-8106", resource: "Cloud compute units", project: "Forecast Modernization", team: "Core Development", type: "Cloud services", date: "2026-10-14", quantity: 4, status: "In progress" },
  { id: "ALC-8107", resource: "Secure storage units", project: "Data Governance", team: "Finance", type: "Infrastructure", date: "2026-10-17", quantity: 2, status: "Scheduled" },
  { id: "ALC-8108", resource: "Analytics licenses", project: "Data Governance", team: "AI Engineering", type: "Software", date: "2026-10-20", quantity: 6, status: "Deployed" },
];

const numberFormat = new Intl.NumberFormat();
const filterOptions = (items, key) =>
  [...new Set(items.map((item) => item[key]))].sort((a, b) => a.localeCompare(b));

function getApprovalStatus(requested, approved) {
  if (approved === 0) return "Pending";
  if (approved >= requested) return "Fully approved";
  return "Partially approved";
}

function aggregateBy(rows, key) {
  const grouped = new Map();
  rows.forEach((row) => {
    const group = grouped.get(row[key]) ?? { name: row[key], requested: 0, approved: 0 };
    group.requested += row.requested;
    group.approved += row.approved;
    grouped.set(row[key], group);
  });
  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function FulfillmentBar({ requested, approved, label }) {
  const percent = requested ? Math.min((approved / requested) * 100, 100) : 0;
  return (
    <div className={styles.fulfillment} aria-label={`${label}: ${Math.round(percent)}% fulfilled`}>
      <div className={styles.fulfillmentTrack}>
        <div className={styles.fulfillmentValue} style={{ width: `${percent}%` }} />
      </div>
      <span>{Math.round(percent)}%</span>
    </div>
  );
}

function ApprovalTag({ requested, approved }) {
  const status = getApprovalStatus(requested, approved);
  const className =
    status === "Fully approved"
      ? styles.approved
      : status === "Partially approved"
        ? styles.partial
        : styles.pending;
  return <span className={`${styles.status} ${className}`}>{status}</span>;
}

function SummaryCard({ label, value, note, accent }) {
  return (
    <article className={`${styles.summaryCard} ${accent ? styles.summaryAccent : ""}`}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong className={styles.summaryValue}>{value}</strong>
      <span className={styles.summaryNote}>{note}</span>
    </article>
  );
}

function EmptyTableRow({ columns, message }) {
  return (
    <tr>
      <td className={styles.emptyCell} colSpan={columns}>{message}</td>
    </tr>
  );
}

export default function ResourceAllocationDashboard() {
  const [project, setProject] = useState("All");
  const [team, setTeam] = useState("All");
  const [resourceType, setResourceType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const projects = useMemo(() => filterOptions(resourceRequests, "project"), []);
  const teams = useMemo(() => filterOptions(resourceRequests, "team"), []);
  const resourceTypes = useMemo(() => filterOptions(resourceRequests, "type"), []);

  const filteredRequests = useMemo(
    () =>
      resourceRequests.filter(
        (request) =>
          (project === "All" || request.project === project) &&
          (team === "All" || request.team === team) &&
          (resourceType === "All" || request.type === resourceType) &&
          (!startDate || request.requestedAt >= startDate) &&
          (!endDate || request.requestedAt <= endDate)
      ),
    [endDate, project, resourceType, startDate, team]
  );

  const filteredHistory = useMemo(
    () =>
      allocationHistory.filter(
        (allocation) =>
          (project === "All" || allocation.project === project) &&
          (team === "All" || allocation.team === team) &&
          (resourceType === "All" || allocation.type === resourceType) &&
          (!startDate || allocation.date >= startDate) &&
          (!endDate || allocation.date <= endDate)
      ),
    [endDate, project, resourceType, startDate, team]
  );

  const projectTotals = useMemo(() => aggregateBy(filteredRequests, "project"), [filteredRequests]);
  const teamTotals = useMemo(() => aggregateBy(filteredRequests, "team"), [filteredRequests]);
  const requestedTotal = filteredRequests.reduce((total, row) => total + row.requested, 0);
  const approvedTotal = filteredRequests.reduce((total, row) => total + row.approved, 0);
  const fulfillmentRate = requestedTotal ? Math.round((approvedTotal / requestedTotal) * 100) : 0;

  function clearFilters() {
    setProject("All");
    setTeam("All");
    setResourceType("All");
    setStartDate("");
    setEndDate("");
  }

  return (
    <main className={styles.page}>
      <PageHeader
        title="Resource Allocation"
        description="Track requested resources, approvals, and active allocations across projects and teams."
        supplementary={
          <Link className={styles.backLink} to="/department-manager/dashboard">
            Back to department dashboard
          </Link>
        }
      />

      <p className={styles.demoNotice}>Sample allocation data is provided for this local demo. Filters update all summaries and tables immediately.</p>

      <section className={styles.filterPanel} aria-label="Allocation filters">
        <div className={styles.filterHeading}>
          <div>
            <h2>Filter allocations</h2>
            <p>Choose a project, team, resource category, or date range.</p>
          </div>
          <button className={styles.clearButton} type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
        <div className={styles.filters}>
          <label className={styles.filterField}>
            <span>Project</span>
            <select value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="All">All projects</option>
              {projects.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Team</span>
            <select value={team} onChange={(event) => setTeam(event.target.value)}>
              <option value="All">All teams</option>
              {teams.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Resource type</span>
            <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
              <option value="All">All resource types</option>
              {resourceTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className={styles.filterField}>
            <span>End date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Allocation summary">
        <SummaryCard
          label="Total resources requested"
          value={numberFormat.format(requestedTotal)}
          note={`Across ${numberFormat.format(filteredRequests.length)} resource requests`}
        />
        <SummaryCard
          label="Total resources approved"
          value={numberFormat.format(approvedTotal)}
          note={`${numberFormat.format(requestedTotal - approvedTotal)} units not yet approved`}
        />
        <SummaryCard
          label="Overall fulfillment"
          value={`${fulfillmentRate}%`}
          note="Approved quantity compared with requested"
          accent
        />
      </section>

      <section className={styles.section} aria-labelledby="project-overview-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="project-overview-title">Project resource overview</h2>
            <p>Requested and approved quantities by project.</p>
          </div>
          <span className={styles.resultCount}>{projectTotals.length} projects</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Project name</th><th>Requested resources</th><th>Approved resources</th><th>Fulfillment</th></tr>
            </thead>
            <tbody>
              {projectTotals.length ? projectTotals.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{numberFormat.format(row.requested)}</td>
                  <td>{numberFormat.format(row.approved)}</td>
                  <td><FulfillmentBar requested={row.requested} approved={row.approved} label={row.name} /></td>
                </tr>
              )) : <EmptyTableRow columns={4} message="No project requests match these filters." />}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="team-overview-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="team-overview-title">Team resource overview</h2>
            <p>Resource quantities assigned to each team.</p>
          </div>
          <span className={styles.resultCount}>{teamTotals.length} teams</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Team</th><th>Requested resources</th><th>Approved resources</th><th>Fulfillment</th></tr>
            </thead>
            <tbody>
              {teamTotals.length ? teamTotals.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{numberFormat.format(row.requested)}</td>
                  <td>{numberFormat.format(row.approved)}</td>
                  <td><FulfillmentBar requested={row.requested} approved={row.approved} label={row.name} /></td>
                </tr>
              )) : <EmptyTableRow columns={4} message="No team requests match these filters." />}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="quantity-comparison-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="quantity-comparison-title">Resource quantity comparison</h2>
            <p>Compare requested quantities with approval decisions.</p>
          </div>
          <span className={styles.resultCount}>{filteredRequests.length} resource items</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Resource</th><th>Type</th><th>Project</th><th>Team</th><th>Quantity requested</th><th>Quantity approved</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filteredRequests.length ? filteredRequests.map((row) => (
                <tr key={row.id}>
                  <th scope="row"><span className={styles.resourceName}>{row.resource}</span><span className={styles.requestId}>{row.id}</span></th>
                  <td>{row.type}</td>
                  <td>{row.project}</td>
                  <td>{row.team}</td>
                  <td>{numberFormat.format(row.requested)}</td>
                  <td>{numberFormat.format(row.approved)}</td>
                  <td><ApprovalTag requested={row.requested} approved={row.approved} /></td>
                </tr>
              )) : <EmptyTableRow columns={7} message="No resource requests match these filters." />}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="allocation-history-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="allocation-history-title">Allocation history</h2>
            <p>Resources deployed or scheduled for delivery to projects and teams.</p>
          </div>
          <span className={styles.resultCount}>{filteredHistory.length} records</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Allocation ID</th><th>Resource name</th><th>Assigned target</th><th>Date allocated</th><th>Quantity</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filteredHistory.length ? filteredHistory.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.id}</th>
                  <td>{row.resource}</td>
                  <td><span className={styles.targetName}>{row.team}</span><span className={styles.targetProject}>{row.project}</span></td>
                  <td><time dateTime={row.date}>{new Date(`${row.date}T12:00:00`).toLocaleDateString()}</time></td>
                  <td>{numberFormat.format(row.quantity)}</td>
                  <td><span className={`${styles.status} ${row.status === "Deployed" ? styles.approved : styles.partial}`}>{row.status}</span></td>
                </tr>
              )) : <EmptyTableRow columns={6} message="No allocation history matches these filters." />}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
