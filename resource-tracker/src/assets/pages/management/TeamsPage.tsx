import { teamsApi } from "../../data/api-services";
import type { DataTableColumn } from "../../components/tables/type";
import { isApiRecord } from "../../data/api-response";
import ApiManagementPage, {
  type AssignmentOperation,
  type ApiField,
} from "./ApiManagementPage";
import styles from "./TeamsPage.module.css";

const teamFields: ApiField[] = [
  { name: "name", label: "Team name", required: true, minLength: 3, maxLength: 100 },
  { name: "description", label: "Team description", kind: "textarea", maxLength: 500 },
  { name: "departmentId", label: "Department", kind: "select-number", optionSource: "departments", required: true },
];

const teamUpdateFields: ApiField[] = [
  { name: "name", label: "Team name", required: true },
];

type TeamRecord = Record<string, unknown>;

function getDisplayText(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const text = value.trim();
  return /^\d+$/.test(text) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? ""
    : text;
}

function getRelatedName(value: unknown): string {
  if (!isApiRecord(value)) {
    return getDisplayText(value);
  }
  for (const field of [
    "fullName",
    "name",
    "displayName",
    "departmentName",
    "teamLeadName",
  ]) {
    const text = getDisplayText(value[field]);
    if (text) return text;
  }
  const structuredName = [
    value.firstName,
    value.middleName,
    value.surname ?? value.lastName,
  ]
    .map(getDisplayText)
    .filter(Boolean)
    .join(" ");
  return structuredName || getDisplayText(value.email);
}

const teamColumns: DataTableColumn<TeamRecord>[] = [
  {
    key: "name",
    header: "Team name",
    render: (team) =>
      getDisplayText(team.teamName) || getDisplayText(team.name) || "—",
  },
  {
    key: "description",
    header: "Description",
    render: (team) =>
      getDisplayText(team.description) ||
      getDisplayText(team.teamDescription) ||
      "—",
  },
  {
    key: "department",
    header: "Department",
    render: (team) =>
      getDisplayText(team.departmentName) ||
      getRelatedName(team.department) ||
      getRelatedName(team.departmentDetails) ||
      "—",
  },
  {
    key: "teamLead",
    header: "Team lead",
    render: (team) =>
      getDisplayText(team.teamLeadName) ||
      getDisplayText(team.teamLeadFullName) ||
      getDisplayText(team.leadName) ||
      getRelatedName(team.teamLead) ||
      getRelatedName(team.teamLeadUser) ||
      getRelatedName(team.lead) ||
      "—",
  },
];

const teamLeadAssignment: AssignmentOperation = {
  label: "Assign team lead",
  field: "teamLeadId",
  run: (id, userId) => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      return Promise.reject(new Error("The team lead ID must be a UUID."));
    }
    return teamsApi.assignLead(id, userId);
  },
};

export default function TeamsPage() {
  return (
    <div className={styles.formLabels}>
      <ApiManagementPage
        title="Teams"
        description=""
        recordsTitle="Teams"
        list={teamsApi.list}
        create={teamsApi.create}
        update={teamsApi.update}
        fields={teamFields}
        updateFields={teamUpdateFields}
        tableColumns={teamColumns}
        createInDialog
        createAssignment={teamLeadAssignment}
        hideRecordActions
        hideRecordsTitle
        createButtonLabel="Create Team"
        createHeading="Create a team"
        updateInDialog
        updateHeading="Edit team name"
        updateButtonLabel="Save team name"
        selectionLabel="Edit team"
      />
    </div>
  );
}
