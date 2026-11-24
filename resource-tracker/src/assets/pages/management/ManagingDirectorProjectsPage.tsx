import { projectsApi } from "../../data/api-services";
import ApiManagementPage from "./ApiManagementPage";

export default function ManagingDirectorProjectsPage() {
  return (
    <ApiManagementPage
      title="Projects"
      description="Projects returned by the projects endpoint for your account."
      recordsTitle="Project records"
      list={projectsApi.list}
    />
  );
}
