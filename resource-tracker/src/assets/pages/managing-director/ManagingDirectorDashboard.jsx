
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  ShieldCheck,
  LogOut,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Laptop,
  Building2,
  UserCircle,
  Search,
  Eye,
  X,
  ChevronRight,
  FolderKanban,
} from "lucide-react";

import "./ManagingDirectorDashboard.css";

// Sample request data.
// Replace this with data fetched from your backend later.
const requests = [
  {
    id: "RQ-1047",
    project: "Project Apollo",
    department: "IT",
    team: "Development",
    item: "Laptops",
    amount: 75000,
    manager: "Sarah Chen",
    status: "Approved",
    date: "2026-11-06",
    purpose: "Equipment for software development",
    history: [
      { event: "Request submitted", date: "2026-11-04", by: "IT Team" },
      { event: "Reviewed by manager", date: "2026-11-05", by: "Sarah Chen" },
      { event: "Approved", date: "2026-11-06", by: "Finance" },
    ],
  },
  {
    id: "RQ-1046",
    project: "Project Zenith",
    department: "HR",
    team: "Human Resources",
    item: "Office furniture",
    amount: 42500,
    manager: "David Kim",
    status: "Pending",
    date: "2026-11-05",
    purpose: "Furniture for new staff offices",
    history: [
      { event: "Request submitted", date: "2026-11-05", by: "HR Team" },
      { event: "Awaiting review", date: "2026-11-05", by: "System" },
    ],
  },
  {
    id: "RQ-1045",
    project: "Project Orion",
    department: "Finance",
    team: "Accounts",
    item: "Desktop computers",
    amount: 60000,
    manager: "Priya Sharma",
    status: "Approved",
    date: "2026-11-04",
    purpose: "Replacement of old computers",
    history: [
      { event: "Request submitted", date: "2026-11-02", by: "Accounts Team" },
      { event: "Reviewed by manager", date: "2026-11-03", by: "Priya Sharma" },
      { event: "Approved", date: "2026-11-04", by: "Finance" },
    ],
  },
  {
    id: "RQ-1044",
    project: "Project Horizon",
    department: "Operations",
    team: "Logistics",
    item: "Transport equipment",
    amount: 120000,
    manager: "Michael Brown",
    status: "Pending",
    date: "2026-11-03",
    purpose: "Transport and logistics operations",
    history: [
      { event: "Request submitted", date: "2026-11-03", by: "Logistics Team" },
      { event: "Awaiting review", date: "2026-11-03", by: "System" },
    ],
  },
  {
    id: "RQ-1043",
    project: "Project Apollo",
    department: "IT",
    team: "Development",
    item: "Networking equipment",
    amount: 48000,
    manager: "Sarah Chen",
    status: "Approved",
    date: "2026-11-02",
    purpose: "Network infrastructure improvement",
    history: [
      { event: "Request submitted", date: "2026-11-01", by: "IT Team" },
      { event: "Approved", date: "2026-11-02", by: "Finance" },
    ],
  },
  {
    id: "RQ-1042",
    project: "Project Zenith",
    department: "HR",
    team: "Recruitment",
    item: "Training materials",
    amount: 25000,
    manager: "David Kim",
    status: "Rejected",
    date: "2026-11-01",
    purpose: "Staff training programme",
    history: [
      { event: "Request submitted", date: "2026-10-30", by: "Recruitment Team" },
      { event: "Reviewed", date: "2026-10-31", by: "David Kim" },
      { event: "Rejected", date: "2026-11-01", by: "Finance" },
    ],
  },
];

const departments = ["IT", "Finance", "HR", "Operations"];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    maximumFractionDigits: 0,
  }).format(amount);

function ManagingDirectorDashboard({ userRole = "Managing Director", onNavigate }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [managerFilter, setManagerFilter] = useState("All Managers");
  const [search, setSearch] = useState("");

  // Protect the dashboard from other roles.
  if (userRole !== "Managing Director") {
    return (
      <div className="access-denied">
        <ShieldCheck size={45} />
        <h2>Access Denied</h2>
        <p>You are not authorised to access the Managing Director dashboard.</p>
      </div>
    );
  }

  // Calculate dashboard totals from the requests.
  const totalRequests = requests.length;

  const totalAmount = requests.reduce(
    (total, request) => total + request.amount,
    0
  );

  const approvedRequests = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  // Calculate request information for each department.
  const departmentData = departments.map((department) => {
    const departmentRequests = requests.filter(
      (request) => request.department === department
    );

    const amount = departmentRequests.reduce(
      (total, request) => total + request.amount,
      0
    );

    return {
      name: department,
      count: departmentRequests.length,
      amount,
    };
  });

  // Calculate requests per project.
  const projectData = Object.values(
    requests.reduce((result, request) => {
      if (!result[request.project]) {
        result[request.project] = {
          name: request.project,
          count: 0,
        };
      }

      result[request.project].count++;
      return result;
    }, {})
  );

  const maxProjectCount = Math.max(
    ...projectData.map((project) => project.count),
    1
  );

  // Filter requests.
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesTeam =
        teamFilter === "All Teams" || request.team === teamFilter;

      const matchesProject =
        projectFilter === "All Projects" ||
        request.project === projectFilter;

      const matchesManager =
        managerFilter === "All Managers" ||
        request.manager === managerFilter;

      const matchesSearch =
        request.id.toLowerCase().includes(search.toLowerCase()) ||
        request.item.toLowerCase().includes(search.toLowerCase());

      return (
        matchesTeam &&
        matchesProject &&
        matchesManager &&
        matchesSearch
      );
    });
  }, [teamFilter, projectFilter, managerFilter, search]);

  const handleNavigation = (page) => {
    setActivePage(page);

    // Reports and Audit are existing pages developed by teammates.
    if (page === "Reports" || page === "Audit") {
      onNavigate?.(page);
    }
  };

  const renderSidebar = () => (
    <aside className="md-sidebar">
      <div className="md-logo">
        <BarChart3 size={35} />
        <h2>Resource Tracker</h2>
      </div>

      <div className="md-user">
        <UserCircle size={23} />
        <span>Managing Director</span>
      </div>

      <nav className="md-navigation">
        <button
          className={activePage === "Dashboard" ? "active" : ""}
          onClick={() => handleNavigation("Dashboard")}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <button
          className={activePage === "Requests" ? "active" : ""}
          onClick={() => handleNavigation("Requests")}
        >
          <FileText size={20} />
          Requests
        </button>

        <button onClick={() => handleNavigation("Reports")}>
          <BarChart3 size={20} />
          Reports (James)
        </button>

        <button onClick={() => handleNavigation("Audit")}>
          <ShieldCheck size={20} />
          Audit (Luka)
        </button>
      </nav>

      <button className="md-logout" onClick={() => onNavigate?.("Logout")}>
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );

  const renderDashboard = () => (
    <>
      <div className="md-page-heading">
        <div>
          <h1>Managing Director Dashboard</h1>
          <p>Organisation-wide overview and request oversight</p>
        </div>

        <span className="md-date">
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Summary cards */}
      <section className="md-stats-grid">
        <div className="md-stat-card">
          <div className="stat-icon blue">
            <Users />
          </div>
          <div>
            <p>Total Requests</p>
            <h2>{totalRequests}</h2>
            <small>Across all departments</small>
          </div>
        </div>

        <div className="md-stat-card">
          <div className="stat-icon green">
            <DollarSign />
          </div>
          <div>
            <p>Total Request Amount</p>
            <h2>{formatMoney(totalAmount)}</h2>
            <small>Combined request value</small>
          </div>
        </div>

        <div className="md-stat-card">
          <div className="stat-icon purple">
            <CheckCircle />
          </div>
          <div>
            <p>Approved Requests</p>
            <h2>{approvedRequests}</h2>
            <small>
              {totalRequests
                ? Math.round((approvedRequests / totalRequests) * 100)
                : 0}
              % of requests
            </small>
          </div>
        </div>

        <div className="md-stat-card">
          <div className="stat-icon orange">
            <Clock />
          </div>
          <div>
            <p>Pending Requests</p>
            <h2>{pendingRequests}</h2>
            <small>Awaiting processing</small>
          </div>
        </div>
      </section>

      {/* Department status */}
      <section className="md-panel">
        <div className="md-section-heading">
          <Building2 />
          <h2>Department Status</h2>
        </div>

        <div className="md-department-grid">
          {departmentData.map((department) => (
            <div className="md-department-card" key={department.name}>
              <h3>{department.name}</h3>
              <h2>{department.count}</h2>
              <p>Requests</p>
              <strong>{formatMoney(department.amount)}</strong>
              <span className="department-label">
                Request value
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="md-charts-grid">
        <div className="md-panel">
          <div className="md-section-heading">
            <BarChart3 />
            <h2>Requests by Department</h2>
          </div>

          <div className="md-department-chart">
            {departmentData.map((department, index) => (
              <div className="department-bar-row" key={department.name}>
                <span>{department.name}</span>
                <div className="department-bar-background">
                  <div
                    className={`department-bar bar-${index}`}
                    style={{
                      width: `${
                        (department.count / totalRequests) * 100
                      }%`,
                    }}
                  />
                </div>
                <strong>{department.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="md-panel">
          <div className="md-section-heading">
            <FolderKanban />
            <h2>Requests by Project</h2>
          </div>

          <div className="md-project-chart">
            {projectData.map((project) => (
              <div className="project-bar-item" key={project.name}>
                <strong>{project.count}</strong>
                <div
                  className="project-bar"
                  style={{
                    height: `${
                      (project.count / maxProjectCount) * 150
                    }px`,
                  }}
                />
                <span>{project.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent requests */}
      <section className="md-panel">
        <div className="md-section-heading md-between">
          <div className="heading-title">
            <FileText />
            <h2>Recent Requests</h2>
            <span className="readonly-label">Read only</span>
          </div>

          <button
            className="md-text-link"
            onClick={() => handleNavigation("Requests")}
          >
            View all <ChevronRight size={17} />
          </button>
        </div>

        <RequestTable
          data={requests.slice(0, 5)}
          onSelect={setSelectedRequest}
        />
      </section>
    </>
  );

  const renderRequests = () => (
    <>
      <div className="md-page-heading">
        <div>
          <h1>Request Oversight</h1>
          <p>View requests and their history across the organisation.</p>
        </div>
        <span className="readonly-label">Read only access</span>
      </div>

      {/* Filters */}
      <section className="md-panel">
        <div className="md-filter-heading">
          <Search size={20} />
          <h2>Filter Requests</h2>
        </div>

        <div className="md-filters">
          <input
            type="text"
            placeholder="Search request ID or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option>All Teams</option>
            {[...new Set(requests.map((r) => r.team))].map((team) => (
              <option key={team}>{team}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option>All Projects</option>
            {[...new Set(requests.map((r) => r.project))].map((project) => (
              <option key={project}>{project}</option>
            ))}
          </select>

          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
          >
            <option>All Managers</option>
            {[...new Set(requests.map((r) => r.manager))].map((manager) => (
              <option key={manager}>{manager}</option>
            ))}
          </select>

          <button
            className="md-reset"
            onClick={() => {
              setTeamFilter("All Teams");
              setProjectFilter("All Projects");
              setManagerFilter("All Managers");
              setSearch("");
            }}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section className="md-panel">
        <div className="md-section-heading md-between">
          <h2>All Requests ({filteredRequests.length})</h2>
          <span className="readonly-label">Read only</span>
        </div>

        <RequestTable
          data={filteredRequests}
          onSelect={setSelectedRequest}
        />
      </section>
    </>
  );

  return (
    <div className="md-layout">
      {renderSidebar()}

      <main className="md-main">
        {activePage === "Dashboard" && renderDashboard()}
        {activePage === "Requests" && renderRequests()}
      </main>

      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

// Reusable read-only requests table
function RequestTable({ data, onSelect }) {
  return (
    <div className="md-table-wrapper">
      <table className="md-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Project</th>
            <th>Department</th>
            <th>Amount</th>
            <th>Assigned Manager</th>
            <th>Status</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          {data.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.project}</td>
              <td>{request.department}</td>
              <td>{formatMoney(request.amount)}</td>
              <td>{request.manager}</td>
              <td>
                <span
                  className={`status-badge ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>
              </td>
              <td>{request.date}</td>
              <td>
                <button
                  className="md-view-button"
                  onClick={() => onSelect(request)}
                  title="View request details"
                >
                  <Eye size={17} />
                </button>
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td colSpan="8" className="md-empty">
                No matching requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Read-only request detail and history modal
function RequestDetails({ request, onClose }) {
  return (
    <div className="md-modal-overlay" onClick={onClose}>
      <div
        className="md-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md-modal-header">
          <div>
            <h2>Request Details</h2>
            <p>{request.id}</p>
          </div>

          <button className="md-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="md-detail-grid">
          <div>
            <span>Item</span>
            <strong>{request.item}</strong>
          </div>

          <div>
            <span>Amount</span>
            <strong>{formatMoney(request.amount)}</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{request.department}</strong>
          </div>

          <div>
            <span>Team</span>
            <strong>{request.team}</strong>
          </div>

          <div>
            <span>Project</span>
            <strong>{request.project}</strong>
          </div>

          <div>
            <span>Assigned Manager</span>
            <strong>{request.manager}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{request.status}</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>{request.date}</strong>
          </div>
        </div>

        <div className="md-purpose">
          <span>Purpose / Justification</span>
          <p>{request.purpose}</p>
        </div>

        <div className="md-history">
          <h3>Request History</h3>

          {request.history.map((item, index) => (
            <div className="history-item" key={index}>
              <div className="history-dot" />
              <div>
                <strong>{item.event}</strong>
                <p>{item.date} · {item.by}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="md-readonly-note">
          <ShieldCheck size={16} />
          This request is displayed in read-only mode.
        </p>
      </div>
    </div>
  );
}

export default ManagingDirectorDashboard;
