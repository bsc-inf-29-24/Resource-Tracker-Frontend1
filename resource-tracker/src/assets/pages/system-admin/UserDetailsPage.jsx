import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import { useUsers } from "../../data/user-store";
import styles from "./SystemAdminPage.module.css";

const roleLabels = {
  "team-lead": "Team Lead",
  "line-manager": "Line Manager",
  "department-manager": "Department Manager",
  "system-admin": "System Administrator",
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, persistenceWarning } = useUsers();
  const user = users.find((item) => item.id === id);

  if (!user) {
    return (
      <div className={`rt-root ${styles.page}`}>
        <PageHeader title="User account details" />
        {persistenceWarning && (
          <ErrorMessage title="Using demonstration accounts" message={persistenceWarning} />
        )}
        <ErrorMessage
          title="User not found"
          message="The selected account is not available in the current browser data."
        />
        <Link to="/system-admin/users">Return to user management</Link>
      </div>
    );
  }

  return (
    <div className={`rt-root ${styles.page}`}>
      <button
        type="button"
        onClick={() => navigate("/system-admin/users")}
        className="rt-root rt-btn rt-btn--outline"
      >
        Back to users
      </button>
      <section className={styles.details}>
        <PageHeader title={user.name} description="User account details." />
        {persistenceWarning && (
          <ErrorMessage title="Using demonstration accounts" message={persistenceWarning} />
        )}
        <dl className={styles.detailList}>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Role</dt><dd>{roleLabels[user.role] ?? user.role}</dd></div>
          <div><dt>Department</dt><dd>{user.department || "Not assigned"}</dd></div>
          <div><dt>Account status</dt><dd><StatusLabel status={user.status} /></dd></div>
          <div><dt>Created</dt><dd>{user.createdAt || "Not available"}</dd></div>
        </dl>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(`/system-admin/users/${user.id}/edit`)}
            className="rt-root rt-btn rt-btn--primary"
          >
            Edit user
          </button>
        </div>
      </section>
    </div>
  );
}
