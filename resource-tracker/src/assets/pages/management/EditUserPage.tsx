import { useParams } from "react-router-dom";
import { assignableUserRoles, usersApi } from "../../data/api-services";
import type { AssignableUserRole } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

function isAssignableUserRole(value: string): value is AssignableUserRole {
  return assignableUserRoles.some((role) => role.value === value);
}

export default function EditUserPage() {
  const { id = "" } = useParams();
  return (
    <ApiManagementPage
      title="Edit user assignment"
      description=""
      list={usersApi.list}
      initialId={id}
      assignments={[
        {
          label: "Assign role",
          field: "role",
          options: assignableUserRoles,
          run: (userId, value) => {
            if (!isAssignableUserRole(value)) {
              return Promise.reject(new Error("Select a supported API role."));
            }
            return usersApi.setRole(userId, value);
          },
        },
      ]}
    />
  );
}
