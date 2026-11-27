import { useParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import WarningMessage from "../../components/feedback/WarningMessage";
import PageHeader from "../../components/layout/PageHeader";
import { updateUser, useUsers } from "../../data/user-store";
import AdminUserForm from "./AdminUserForm";
import styles from "./SystemAdminPage.module.css";

export default function EditUserPage() {
  const { id } = useParams();
  const { users, persistenceWarning } = useUsers();
  const user = users.find((item) => item.id === id);

  if (!user) {
    return (
      <div className={`rt-root ${styles.page}`}>
        <PageHeader title="Edit user account" />
        {persistenceWarning && (
          <WarningMessage title="Using demonstration accounts" message={persistenceWarning} />
        )}
        <ErrorMessage
          title="User not found"
          message="The selected account is not available."
        />
      </div>
    );
  }

  return (
    <div className={`rt-root ${styles.page}`}>
      <PageHeader
        title={`Edit ${user.name}`}
        description="Update this account record. Account status is managed separately."
      />
      {persistenceWarning && (
        <WarningMessage title="Using demonstration accounts" message={persistenceWarning} />
      )}
      <AdminUserForm
        user={user}
        submitLabel="Save changes"
        onSave={(draft) => updateUser(user.id, draft)}
      />
    </div>
  );
}
