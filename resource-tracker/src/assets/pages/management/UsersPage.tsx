import { Link } from "react-router-dom";
import { assignableUserRoles, usersApi } from "../../data/api-services";
import type { AssignableUserRole } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";
import styles from "./ApiManagementPage.module.css";

function isAssignableUserRole(value: string): value is AssignableUserRole {
  return assignableUserRoles.some((role) => role.value === value);
}

export default function UsersPage() {
  return (
    <div className={`rt-root ${styles.page}`}>
      <div className={styles.actions}>
        <Link
          to="/system-admin/users/new"
          className="rt-root rt-btn rt-btn--primary"
        >
          Create user
        </Link>
      </div>
      <ApiManagementPage
        title="User management"
        description=""
        list={usersApi.list}
        assignments={[
          {
            label: "Assign role",
            field: "role",
            options: assignableUserRoles,
            run: (id, value) => {
              if (!isAssignableUserRole(value)) {
                return Promise.reject(
                  new Error("Select a supported API role."),
                );
              }
              return usersApi.setRole(id, value);
            },
          },
          {
            label: "Deactivate account",
            field: "deactivate",
            requiresValue: false,
            confirmation: {
              title: "Deactivate this user account?",
              message:
                "this account will be disabled. The selected user record will remain stored.",
              confirmLabel: "Deactivate account",
            },
            run: (id) => usersApi.deactivate(id),
          },
          {
            label: "Reactivate account",
            field: "reactivate",
            requiresValue: false,
            confirmation: {
              title: "Reactivate this user account?",
              message: "This account will be reanabled.",
              confirmLabel: "Reactivate account",
            },
            run: (id) => usersApi.reactivate(id),
          },
        ]}
      />
    </div>
  );
}
