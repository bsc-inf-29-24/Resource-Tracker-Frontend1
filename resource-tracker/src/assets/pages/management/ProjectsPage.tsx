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

export default function ProjectsPage() {
  return (
    <ApiManagementPage
      title="Projects"
      description=""
      list={projectsApi.list}
      create={projectsApi.create}
      fields={projectFields}
      recordsTitle="Projects"
      createHeading="Create project"
      createButtonLabel="Create project"
      createInDialog
      hideRecordActions
      hideRecordsTitle
    />
  );
}
