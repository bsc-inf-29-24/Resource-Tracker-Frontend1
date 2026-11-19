import { teamsApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

const teamFields: ApiField[] = [
  { name: "name", label: "Team name", required: true },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "departmentId", label: "Department ID", kind: "number", required: true },
];

const teamUpdateFields: ApiField[] = [
  { name: "name", label: "Team name" },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "departmentId", label: "Department ID", kind: "number" },
];

export default function TeamsPage() {
  return (
    <ApiManagementPage
      title="Teams"
      description=""
      list={teamsApi.list}
      get={teamsApi.get}
      create={teamsApi.create}
      update={teamsApi.update}
      remove={teamsApi.remove}
      fields={teamFields}
      updateFields={teamUpdateFields}
      related={[
        { label: "users", load: teamsApi.users },
        { label: "projects", load: teamsApi.projects },
        { label: "resource requests", load: teamsApi.requests },
      ]}
      assignments={[
        {
          label: "Assign team lead",
          field: "teamLeadId",
          run: (id, userId) => {
            if (
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                userId,
              )
            ) {
              return Promise.reject(
                new Error("The team lead ID must be a UUID."),
              );
            }
            return teamsApi.assignLead(id, userId);
          },
        },
      ]}
    />
  );
}
