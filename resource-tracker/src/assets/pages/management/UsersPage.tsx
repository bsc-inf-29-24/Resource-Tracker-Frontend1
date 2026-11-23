import { Link } from "react-router-dom";
import { assignableUserRoles, usersApi } from "../../data/api-services";
import type { AssignableUserRole } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";
import styles from "./ApiManagementPage.module.css";

function isAssignableUserRole(value: string): value is AssignableUserRole {
  return assignableUserRoles.some((role) => role.value === value);
}

export default function UsersPage({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <div className={`rt-root ${styles.page}`}>
      <ApiManagementPage
        // title=""
        // description=""
        list={usersApi.list}
        assignmentsInDialog
        recordsTitle="User accounts"
        headingAction={dashboard ? <Link className="rt-root rt-btn rt-btn--primary" to="/system-admin/users/new">Create User</Link> : undefined}
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
                "This account will be disabled. The user will not be able to log in or access the system.",
              confirmLabel: "Deactivate account",
            },
            run: (id) => usersApi.deactivate(id),
          },
          {
            label: "Reactivate account",
            field: "Reactivate",
            requiresValue: false,
            confirmation: {
              title: "Reactivate this user account?",
              message: "This account will be reenabled.",
              confirmLabel: "Reactivate account",
            },
            run: (id) => usersApi.reactivate(id),
          },
        ]}
      />
    </div>
  );
}
