import { teamsApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";
import styles from "./TeamsPage.module.css";

const teamFields: ApiField[] = [
  { name: "name", label: "Team name", required: true, minLength: 3, maxLength: 100 },
  { name: "description", label: "Team description", kind: "textarea", maxLength: 500 },
  { name: "departmentId", label: "Department", kind: "select-number", optionSource: "departments", required: true },
];

const teamUpdateFields: ApiField[] = [
  { name: "name", label: "Team name", minLength: 3, maxLength: 50 },
  { name: "description", label: "Description", kind: "textarea", maxLength: 50 },
  { name: "departmentId", label: "Department ID", kind: "number" },
];

export default function TeamsPage() {
  return (
    <div className={styles.formLabels}>
      <ApiManagementPage
        title="Teams"
        description=""
        recordsTitle="Teams"
        list={teamsApi.list}
        get={teamsApi.get}
        create={teamsApi.create}
        update={teamsApi.update}
        remove={teamsApi.remove}
        fields={teamFields}
        updateFields={teamUpdateFields}
        createInPageHeader
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
    </div>
  );
}
