import { teamsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorTeamsPage() {
  return (
    <ApiManagementPage
      title="Teams"
      description="Teams available to your account."
      recordsTitle="Team records"
      list={teamsApi.list}
      validateResponseShape={false}
    />
  );
}
