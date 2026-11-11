import { projectsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorProjectsPage() {
  return (
    <ApiManagementPage
      title="Projects"
      description=""
      list={projectsApi.list}
    />
  );
}
