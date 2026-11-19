import { Link } from "react-router-dom";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import EmptyState from "../../components/feedback/EmptyState";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import { availableDepartments, useUsers } from "../../data/user-store";
import styles from "./AdminDashboard.module.css";

export default function DashboardPage() {
  const { users, persistenceWarning } = useUsers();
  const activeUsers = users.filter((user) => user.status === "Active");
  const inactiveUsers = users.filter((user) => user.status === "Inactive");
  const departments = availableDepartments.map((department) => ({
    ...department,
    userCount: users.filter((user) => user.department === department.name)
      .length,
  }));
  const departmentColumns = [
    { key: "name", header: "Department" },
    {
      key: "code",
      header: "Code",
      render: (department) => department.code || "—",
    },
    {
      key: "manager",
      header: "Manager",
      render: (department) => department.manager || "Not assigned",
    },
    { key: "userCount", header: "User accounts" },
  ];

  return (
    <div className={`rt-root ${styles.page}`}>
      <PageHeader
        title="System Administrator"
        description="Manage account records and review department membership."
      />

      {persistenceWarning && (
      )}

      <StatusCardGrid>
        <StatusCard
          label="Total users"
          value={users.length}
          note="Registered account records"
        />
        <StatusCard
          label="Active users"
          value={activeUsers.length}
          note="Status marked active"
        />
        <StatusCard
          label="Inactive users"
          value={inactiveUsers.length}
          note="Status marked inactive"
        />
      </StatusCardGrid>


      <section
        className={styles.departmentSection}
        aria-labelledby="department-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="department-title">Department overview</h2>
            <p>Account totals are calculated from the current user records.</p>
          </div>
        </div>
        {departments.length === 0 ? (
          <div className="rt-root rt-card">
            <EmptyState
              title="No departments available"
              description="Department records have not been configured."
            />
          </div>
        ) : (
          <DataTable
            // title="Departments"
            columns={departmentColumns}
            rows={departments}
            rowKey="id"
            itemLabel="department"
            emptyTitle="No departments available"
            emptyDescription="Department records have not been configured."
          />
        )}
      </section>

      <section className={styles.statusKey} aria-label="Account status key">
        <span>Account status:</span>
        <StatusLabel status="Active" />
        <StatusLabel status="Inactive" />
      </section>
    </div>
  );
}
