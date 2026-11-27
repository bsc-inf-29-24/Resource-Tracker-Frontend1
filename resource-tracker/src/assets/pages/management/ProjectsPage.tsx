import { projectsApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

const projectFields: ApiField[] = [
  { name: "name", label: "Project name", required: true },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "startDate", label: "Start date", kind: "date", required: true },
  { name: "endDate", label: "End date", kind: "date", required: true },
  { name: "teamIds", label: "Teams", kind: "multi-select-number", optionSource: "teams" },
];

const projectUpdateFields: ApiField[] = projectFields.filter(
  (field) => field.name !== "teamIds",
).map((field) => ({ ...field, required: false }));

export default function ProjectsPage() {
  return (
    <ApiManagementPage
      title="Projects"
      description=""
      list={projectsApi.list}
      get={projectsApi.get}
      create={projectsApi.create}
      update={projectsApi.update}
      remove={projectsApi.remove}
      fields={projectFields}
      updateFields={projectUpdateFields}
      related={[{ label: "team members", load: projectsApi.teamMembers }]}
      assignments={[
        {
          label: "Assign teams",
          field: "projectTeamIds",
          kind: "number-list",
          run: (id, value) => {
            const ids = value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .map(Number);
            if (ids.some((item) => !Number.isInteger(item) || item < 1)) {
              return Promise.reject(
                new Error("Team IDs must be positive integers."),
              );
            }
            return projectsApi.assignTeams(id, ids);
          },
        },
      ]}
    />
  );
}
