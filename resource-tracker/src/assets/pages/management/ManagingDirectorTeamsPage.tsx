import { teamsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorTeamsPage() {
  return (
    <ApiManagementPage
      title="Teams"
      description="Assign active Team Leads and Team Members to a team. Users inherit the department assigned to that team."
      recordsTitle="Team records"
      list={teamsApi.list}
      assignments={[
        {
          label: "Assign user to team",
          field: "teamUserId",
          run: (teamId, userId) => teamsApi.assignUser(teamId, userId),
        },
      ]}
    />
  );
}
