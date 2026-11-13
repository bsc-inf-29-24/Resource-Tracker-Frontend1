import { departmentsApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

const departmentFields: ApiField[] = [
  { name: "name", label: "Department name", required: true },
  { name: "code", label: "Department code" },
  { name: "description", label: "Description", kind: "textarea" },
];

export default function DepartmentsPage() {
  return (
    <ApiManagementPage
      title="Departments"
      description=""
      list={departmentsApi.list}
      get={departmentsApi.get}
      create={departmentsApi.create}
      update={departmentsApi.update}
      remove={departmentsApi.remove}
      fields={departmentFields}
      related={[
        { label: "users", load: departmentsApi.users },
        { label: "teams", load: departmentsApi.teams },
        { label: "projects", load: departmentsApi.projects },
        { label: "resource requests", load: departmentsApi.requests },
      ]}
      assignments={[
        {
          label: "Assign department head",
          field: "headUserId",
          run: (id, userId) => {
            if (
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                userId,
              )
            ) {
              return Promise.reject(
                new Error("The department head ID must be a UUID."),
              );
            }
            return departmentsApi.assignHead(id, userId);
          },
        },
      ]}
    />
  );
}
