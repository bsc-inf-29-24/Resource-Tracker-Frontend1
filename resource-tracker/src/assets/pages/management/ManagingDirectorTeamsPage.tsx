import { teamsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorTeamsPage() {
  return (
    <ApiManagementPage
      title="Teams"
      description="Teams returned by the teams endpoint for your account."
      recordsTitle="Team records"
      list={teamsApi.list}
    />
  );
}
