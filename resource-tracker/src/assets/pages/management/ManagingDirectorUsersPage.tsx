import { assignableUserRoles, usersApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorUsersPage() {
  return (
    <ApiManagementPage
      title="Users"
      description=""
      list={usersApi.list}
      assignments={[
        {
          label: "Assign role",
          field: "role",
          options: assignableUserRoles,
          run: (id, value) => {
            const role = assignableUserRoles.find(
              (option) => option.value === value,
            );
            if (!role) {
              return Promise.reject(new Error("Select a supported API role."));
            }
            return usersApi.setRole(id, role.value);
          },
        },
      ]}
    />
  );
}
