import { Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import StatusCard, { StatusCardGrid } from "../../components/cards/StatusCard";
import { useResourceRequests } from "../../data/request-store";
import { getCurrentDepartmentManager, getDepartmentRequests, getProjectTotals } from "../../utils/department-manager";
import { formatCurrency } from "../../utils/format";
import styles from "./ResourceAllocationPage.module.css";

export default function ResourceAllocationPage() {
  const { requests, persistenceWarning } = useResourceRequests();
  const manager = getCurrentDepartmentManager();
  const departmentName = manager?.department ?? "Data Science";
  const departmentRequests = getDepartmentRequests(requests, departmentName);
  const projectTotals = getProjectTotals(departmentRequests);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Resource Allocation"
        description={`${departmentName} operational allocation summary`}
        supplementary={
          <Link className={styles.linkButton} to="/department-manager/dashboard">
            Return to dashboard
          </Link>
        }
      />

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}

      <StatusCardGrid>
        <StatusCard label="Department requests" value={departmentRequests.length} />
        <StatusCard label="Active projects" value={projectTotals.length} />
        <StatusCard label="Allocated value" value={formatCurrency(projectTotals.reduce((total, item) => total + item.amount, 0))} />
      </StatusCardGrid>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2 className="rt-card__title">Projects</h2>
        {projectTotals.length === 0 ? (
          <p className={styles.empty}>No project allocation data is available.</p>
        ) : (
          <ul className={styles.list}>
            {projectTotals.map(({ project, amount }) => (
              <li key={project} className={styles.item}>
                <span>{project}</span>
                <strong>{formatCurrency(amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
