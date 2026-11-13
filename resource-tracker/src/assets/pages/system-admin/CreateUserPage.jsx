import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import { usersApi } from "../../data/api-services";
import CreateUserForm from "./CreateUserForm";
import styles from "./SystemAdminPage.module.css";

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div className={`rt-root ${styles.page}`}>
      { <PageHeader
        title="Create user account"
        //description="Create an account using the fields and role values supported by the backend API."
      /> }
      <CreateUserForm
        onSave={(input) => usersApi.create(input)}
        onCancel={() => navigate("/system-admin/users")}
      />
    </div>
  );
}
