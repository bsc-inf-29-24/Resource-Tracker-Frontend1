import EmptyState from "../../components/feedback/EmptyState";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import DataTable from "../../components/tables/DataTable";
import { availableDepartments, useUsers } from "../../data/user-store";
import styles from "./AdminDashboard.module.css";

export default function DashboardPage() {
  const { users } = useUsers();
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

      <section
        className={styles.departmentSection}
        aria-labelledby="department-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="department-title">Department overview</h2>
            {/* <p>Account totals are calculated from the current user records.</p> */}
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
