

import "./DashboardPage.css";

const statistics = [
  {
    title: "Total Registered Users",
    value: 6,
    icon: "users",
    color: "green",
  },
  {
    title: "Active Accounts",
    value: 4,
    icon: "active",
    color: "green",
  },
  {
    title: "Inactive Accounts",
    value: 2,
    icon: "inactive",
    color: "orange",
  },
  {
    title: "Departments",
    value: 3,
    icon: "department",
    color: "green",
  },
];

const departments = [
  {
    name: "Computer Science",
    manager: "Dr. Phiri",
    totalUsers: 12,
    resources: 45,
  },
  {
    name: "Information Systems",
    manager: "Prof. Banda",
    totalUsers: 8,
    resources: 32,
  },
  {
    name: "IT Support",
    manager: "Mr. Mwale",
    totalUsers: 15,
    resources: 67,
  },
];

function DashboardIcon({ type, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20v-2a7 7 0 0 1 14 0v2" />
        <path d="M16 5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6" />
      </>
    ),
    active: (
      <>
        <circle cx="9" cy="7" r="3.5" />
        <path d="M2 20v-2a7 7 0 0 1 14 0v2" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    inactive: (
      <>
        <circle cx="9" cy="7" r="3.5" />
        <path d="M2 20v-2a7 7 0 0 1 14 0v2" />
        <path d="M17 12h5" />
      </>
    ),
    department: (
      <>
        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
        <path d="M9 10v3m6-3v3M9 17v4m6-4v4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.9h-3l-.3-1.9a8 8 0 0 1-1.8-1l-1.7.7-1.5-2.6 1.5-1.1a8 8 0 0 1 0-2L5.3 12l1.5-2.6 1.7.7a8 8 0 0 1 1.8-1l.3-1.9h3l.3 1.9a8 8 0 0 1 1.8 1l1.7-.7 1.5 2.6-1.5 1.1a8 8 0 0 1 .2 1.9Z" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...common}>{icons[type] || icons.dashboard}</svg>;
}

export default function DashboardPage() {
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-logo">RT</div>
          <div className="brand-name">
            Resource
            <br />
            Tracker
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-navigation">
          <a className="sidebar-link active" href="/system-admin/dashboard">
            <DashboardIcon type="dashboard" />
            <span>Dashboard</span>
          </a>

          <a className="sidebar-link" href="/system-admin/users">
            <DashboardIcon type="users" />
            <span>User Management</span>
          </a>

          <a className="sidebar-link" href="/system-admin/departments">
            <DashboardIcon type="department" />
            <span>Departments</span>
          </a>

          <a className="sidebar-link" href="/system-admin/settings">
            <DashboardIcon type="settings" />
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="footer-dot" />
          Resource Tracker Admin
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <DashboardIcon type="home" />
            <span className="breadcrumb-chevron">›</span>
            <span>Dashboard</span>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">SA</div>
            <span>System Administrator</span>
          </div>
        </header>

        <section className="dashboard-heading">
          <h1>System Administrator</h1>
          <p>Manage users and department information</p>
        </section>

        <section className="statistics-grid">
          {statistics.map((stat) => (
            <article className="stat-card" key={stat.title}>
              <div className={`stat-icon ${stat.color}`}>
                <DashboardIcon type={stat.icon} size={28} />
              </div>

              <div className="stat-content">
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <DashboardIcon type="users" size={27} />
            <h2>Quick Access</h2>
          </div>

          <a className="quick-access-item" href="/system-admin/users">
            <div className="quick-access-icon">
              <DashboardIcon type="users" size={27} />
            </div>

            <div className="quick-access-text">
              <h3>User Management</h3>
              <p>View registered accounts and user details.</p>
            </div>

            <DashboardIcon type="arrow" />
          </a>
        </section>

        <section className="dashboard-panel department-panel">
          <div className="panel-heading">
            <DashboardIcon type="department" size={27} />
            <h2>Department Information</h2>
            <a
              className="panel-view-all"
              href="/system-admin/departments"
            >
              View all <DashboardIcon type="arrow" size={17} />
            </a>
          </div>

          <div className="department-table-wrapper">
            <table className="department-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Manager</th>
                  <th>Total Users</th>
                  <th>Resources</th>
                </tr>
              </thead>

              <tbody>
                {departments.map((department) => (
                  <tr key={department.name}>
                    <td className="department-name">
                      {department.name}
                    </td>
                    <td>{department.manager}</td>
                    <td>{department.totalUsers}</td>
                    <td>{department.resources}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
