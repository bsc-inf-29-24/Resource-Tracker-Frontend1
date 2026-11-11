import { teamsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorTeamsPage() {
  return (
    <ApiManagementPage
      title="Teams"
      description=""
      list={teamsApi.list}
    />
  );
}
