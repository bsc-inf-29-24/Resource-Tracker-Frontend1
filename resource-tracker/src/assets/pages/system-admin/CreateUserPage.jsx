import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import { createUser } from "../../data/user-store";
import AdminUserForm from "./AdminUserForm";
import styles from "./SystemAdminPage.module.css";

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Create user account"
        description="Add an account record using the available department and role data."
      />
      <AdminUserForm
        submitLabel="Create user"
        onSave={(draft) => createUser(draft)}
        onCancel={() => navigate("/system-admin/users")}
      />
    </div>
  );
}
