import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import WarningMessage from "../../components/feedback/WarningMessage";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import { ApiError } from "../../data/api-client";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import ApiDataView from "./ApiDataView";
import { dashboardApi, departmentsApi, teamsApi, usersApi } from "../../data/api-services";
import styles from "./ApiManagementPage.module.css";

type ApiRecord = Record<string, unknown>;
type InputKind =
  | "text"
  | "number"
  | "number-list"
  | "date"
  | "textarea"
  | "select"
  | "select-number"
  | "multi-select-number"
  | "select-options"
  | "list";

export interface ApiField {
  name: string;
  label: string;
  kind?: InputKind;
  required?: boolean;
  options?: { value: string; label: string }[];
  optionSource?: "departments" | "teams";
  optionValue?: "id" | "name";
  when?: { field: string; value: string };  
}

export interface RelatedOperation {
  label: string;
  load: (id: string) => Promise<unknown>;
}

export interface AssignmentOperation {
  label: string;
  field: string;
  run: (id: string, value: string) => Promise<unknown>;
  kind?: "text" | "list" | "number-list";
  options?: { value: string; label: string }[];
  requiresValue?: boolean;
  optional?: boolean;
  successMessage?: string;
  confirmation?: { title: string; message: string; confirmLabel: string };
}

interface ApiManagementPageProps {
  title: string;
  description: string;
  list: () => Promise<unknown>;
  initialId?: string;
  get?: (id: string) => Promise<unknown>;
  create?: (body: ApiRecord) => Promise<unknown>;
  update?: (id: string, body: ApiRecord) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  fields?: ApiField[];
  updateFields?: ApiField[];
  related?: RelatedOperation[];
  assignments?: AssignmentOperation[];
  createAssignment?: AssignmentOperation;
  hideRecordActions?: boolean;
  hideRecordsTitle?: boolean;
  showEmptyTable?: boolean;
  assignmentsInDialog?: boolean;
  recordsTitle?: string;
  tableColumns?: DataTableColumn<ApiRecord>[];
  headingAction?: React.ReactNode;
  selectionLabel?: string;
  selectionDetailsInDialog?: boolean;
  createHeading?: string;
  createButtonLabel?: string;
  createInDialog?: boolean;
  updateInDialog?: boolean;
  updateHeading?: string;
  updateButtonLabel?: string;
}

function textValue(value: unknown): string {
  return value === null || value === undefined ? "" : formatApiValue(value);
}

function formatValue(value: unknown): string {
  return formatApiValue(value);
}

function formatCreatedAt(value: unknown): string {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return formatValue(value);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? formatValue(value)
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function getRecordDisplayName(record: ApiRecord): string {
  for (const value of [record.fullName, record.name, record.displayName]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const firstName =
    typeof record.firstName === "string" ? record.firstName.trim() : "";
  const middleName =
    typeof record.middleName === "string" ? record.middleName.trim() : "";
  const lastName =
    typeof record.lastName === "string" ? record.lastName.trim() : "";
  const surname =
    typeof record.surname === "string" ? record.surname.trim() : "";
  const fullName = [firstName, middleName, lastName || surname]
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;
  return typeof record.email === "string" && record.email.trim()
    ? record.email.trim()
    : "Unnamed user";
}

function getUserOptionLabel(record: ApiRecord): string {
  const name = getRecordDisplayName(record);
  const email = typeof record.email === "string" ? record.email.trim() : "";
  return email && name !== email ? `${name} (${email})` : name;
}

function getUserDepartmentLabel(record: ApiRecord): string {
  for (const value of [
    record.departmentName,
    record.department_name,
    record.department,
  ]) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (isApiRecord(value)) {
      for (const name of [value.name, value.departmentName, value.department_name]) {
        if (typeof name === "string" && name.trim()) return name.trim();
      }
    }
  }
  return "Not provided by the API";
}

function getUserOptions(records: ApiRecord[]) {
  return records
    .filter((record) => typeof record.id === "string")
    .map((record) => ({
      value: String(record.id),
      label: getUserOptionLabel(record),
    }));
}

function getTeamEligibilityErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiError && error.status === 403) {
    return "Only Department Heads can list unassigned users for team assignment. Sign in with an active Department Head account, then retry.";
  }
  return error instanceof Error ? error.message : fallback;
}

export default function ApiManagementPage({
  title,
  description,
  list,
  initialId = "",
  get,
  create,
  update,
  remove,
  fields = [],
  updateFields = fields,
  related = [],
  assignments = [],
  createAssignment,
  hideRecordActions = false,
  hideRecordsTitle = false,
  showEmptyTable = false,
  assignmentsInDialog = false,
  recordsTitle = "Users records",
  tableColumns,
  headingAction,
  selectionLabel = "Select",
  selectionDetailsInDialog = false,
  createHeading,
  createButtonLabel,
  createInDialog = false,
  updateInDialog = false,
  updateHeading,
  updateButtonLabel,
}: ApiManagementPageProps) {
  const [data, setData] = useState<unknown>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [relatedData, setRelatedData] = useState<unknown>(null);
  const [selectedId, setSelectedId] = useState(initialId);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [assignmentValues, setAssignmentValues] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorTitle, setErrorTitle] = useState("Unable to load records");
  const [warning, setWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [createdRecordId, setCreatedRecordId] = useState("");
  const [creationBlocked, setCreationBlocked] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const updateDialogRef = useRef<HTMLDialogElement>(null);
  const assignmentDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingAssignment, setPendingAssignment] =
    useState<AssignmentOperation | null>(null);
  const [optionRecords, setOptionRecords] = useState<Record<string, ApiRecord[]>>({});
  const [optionLoading, setOptionLoading] = useState<Record<string, boolean>>({});
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});
  const createAssignmentOptionSource =
    createAssignment?.field === "headUserId" ? "departmentHeads" : "teamLeads";
  const createAssignmentOptionsKey =
    createAssignmentOptionSource === "departmentHeads"
      ? "departmentHeadOptions"
      : "teamLeadOptions";
  const createAssignmentLabel =
    createAssignment?.label.replace(/^Assign\s+/i, "").toLowerCase() ?? "assignee";
  const createRecordLabel =
    title === "Departments" ? "department" : title === "Teams" ? "team" : "record";
  const dialogEntityLabel =
    title === "Departments" ? "department" : title === "Teams" ? "team" : "user";

  useEffect(() => {
    const sources = Array.from(new Set(fields.map((field) => field.optionSource).filter((source): source is "departments" | "teams" => Boolean(source))));
    if (title === "Teams" && !sources.includes("departments")) sources.push("departments");
    if (title === "Projects" && !sources.includes("teams")) sources.push("teams");
    let active = true;
    for (const source of sources) {
      setOptionLoading((current) => ({ ...current, [source]: true }));
      setOptionErrors((current) => ({ ...current, [source]: "" }));
      const request = source === "departments"
        ? departmentsApi.list().catch(() => dashboardApi.departments())
        : teamsApi.list();
      void request.then((response) => {
        if (active) {
          const records = getApiRecords(response).map((record) => ({
            ...record,
            id: record.id ?? record.departmentId,
            name: record.name ?? record.departmentName,
          }));
          setOptionRecords((current) => ({ ...current, [source]: records }));
          if (source === "departments") {
            const validOptions = records.filter(
              (record) =>
                (typeof record.id === "number" ||
                  (typeof record.id === "string" && record.id.trim() !== "")) &&
                typeof record.name === "string" &&
                record.name.trim() !== "",
            );
            if (validOptions.length === 1) {
              const onlyId = String(validOptions[0].id);
              setForm((current) => {
                const updates: Record<string, string> = {};
                for (const field of fields) {
                  if (field.optionSource === "departments" && !current[field.name]) {
                    updates[field.name] = onlyId;
                  }
                }
                return Object.keys(updates).length ? { ...current, ...updates } : current;
              });
            }
          }
        }
      }).catch((loadError) => {
        if (active) setOptionErrors((current) => ({ ...current, [source]: loadError instanceof Error ? loadError.message : "Options could not be loaded." }));
      }).finally(() => {
        if (active) setOptionLoading((current) => ({ ...current, [source]: false }));
      });
    }
    const needsTeamLeadOptions =
      title === "Teams" &&
      (assignments.some((operation) => operation.field === "teamLeadId") ||
        createAssignment?.field === "teamLeadId");
    const needsTeamUserOptions =
      title === "Teams" &&
      assignments.some((operation) => operation.field === "teamUserId");
    if (needsTeamLeadOptions || needsTeamUserOptions) {
      setOptionLoading((current) => ({
        ...current,
        ...(needsTeamLeadOptions ? { teamLeads: true } : {}),
        ...(needsTeamUserOptions ? { teamUsers: true } : {}),
      }));
      setOptionErrors((current) => ({
        ...current,
        ...(needsTeamLeadOptions ? { teamLeads: "" } : {}),
        ...(needsTeamUserOptions ? { teamUsers: "" } : {}),
      }));
      void teamsApi.unassignedUsers().then((response) => {
        const eligible = getApiRecords(response).filter(
          (user) => user.isActive !== false,
        );
        if (active) {
          setAssignmentValues((current) => ({
            ...current,
            ...(needsTeamLeadOptions
              ? {
                  teamLeadOptions: JSON.stringify(
                    getUserOptions(
                      eligible.filter((user) => user.role === "TEAM_LEAD"),
                    ),
                  ),
                }
              : {}),
            ...(needsTeamUserOptions
              ? {
                  teamUserOptions: JSON.stringify(
                    getUserOptions(
                      eligible.filter(
                        (user) =>
                          user.role === "TEAM_LEAD" ||
                          user.role === "TEAM_MEMBER",
                      ),
                    ),
                  ),
                }
              : {}),
          }));
        }
      }).catch((loadError) => {
        if (active) {
          const message = getTeamEligibilityErrorMessage(
            loadError,
            "Eligible users could not be loaded.",
          );
          setOptionErrors((current) => ({
            ...current,
            ...(needsTeamLeadOptions ? { teamLeads: message } : {}),
            ...(needsTeamUserOptions ? { teamUsers: message } : {}),
          }));
        }
      }).finally(() => {
        if (active) {
          setOptionLoading((current) => ({
            ...current,
            ...(needsTeamLeadOptions ? { teamLeads: false } : {}),
            ...(needsTeamUserOptions ? { teamUsers: false } : {}),
          }));
        }
      });
    }
    if (
      title === "Departments" &&
      (assignments.length > 0 || createAssignment?.field === "headUserId")
    ) {
      setOptionLoading((current) => ({ ...current, departmentHeads: true }));
      void usersApi.list().then((response) => {
        const eligible = getApiRecords(response).filter((user) => user.role === "DEPARTMENT_HEAD" && user.isActive !== false);
        const options = eligible
          .filter((user) => typeof user.id === "string")
          .map((user) => ({
            value: String(user.id),
            label: getUserOptionLabel(user),
          }));
        if (active) setAssignmentValues((current) => ({ ...current, departmentHeadOptions: JSON.stringify(options) }));
      }).catch((loadError) => {
        if (active) setOptionErrors((current) => ({ ...current, departmentHeads: loadError instanceof Error ? loadError.message : "Department heads could not be loaded." }));
      }).finally(() => { if (active) setOptionLoading((current) => ({ ...current, departmentHeads: false })); });
    }
    return () => { active = false; };
  }, [assignments.length, createAssignment, fields, title]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarning("");
    try {
      const response = await list();
      const responseRecords = getApiRecords(response);
      const requiredFields: Record<string, string[]> = {
        Departments: ["name"], Teams: ["name"], Projects: ["name"], Resources: ["name", "type"],
      };
      const required = requiredFields[title];
      if (required && responseRecords.some((record) => !required.some((field) => field in record))) {
        throw new Error(`${title} endpoint returned records that do not match the documented ${title.toLowerCase()} shape.`);
      }
      setData(response);
    } catch (loadError) {
      setErrorTitle("Unable to load records");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [list, title]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const dialog = createDialogRef.current;
    if (!dialog) return;
    if (createDialogOpen && !dialog.open) dialog.showModal();
    else if (!createDialogOpen && dialog.open) dialog.close();
  }, [createDialogOpen]);

  useEffect(() => {
    const dialog = updateDialogRef.current;
    if (!dialog) return;
    if (updateDialogOpen && !dialog.open) dialog.showModal();
    else if (!updateDialogOpen && dialog.open) dialog.close();
  }, [updateDialogOpen]);

  useEffect(() => {
    const dialog = assignmentDialogRef.current;
    if (!dialog) return;
    if (assignmentDialogOpen && !dialog.open) dialog.showModal();
    else if (!assignmentDialogOpen && dialog.open) dialog.close();
  }, [assignmentDialogOpen]);

  const selectRecord = useCallback((record: ApiRecord) => {
    const id = record.id;
    if (typeof id === "string" || typeof id === "number") {
      setSelectedId(String(id));
    }
    if (assignmentsInDialog) {
      setSelectedUserName(getRecordDisplayName(record));
      setAssignmentValues((current) => ({
        ...current,
        ...Object.fromEntries(
          assignments.map((operation) => [operation.field, ""]),
        ),
      }));
    }
    const selectedFields = updateInDialog ? updateFields : fields;
    setForm(
      Object.fromEntries(
        selectedFields.map((field) => [field.name, textValue(record[field.name])]),
      ),
    );
    setDetail(
      selectionDetailsInDialog
        ? record
        : assignmentsInDialog || updateInDialog
          ? null
          : record,
    );
    setRelatedData(null);
    setError("");
    setWarning("");
    setNotice("");
    if (updateInDialog && !assignmentsInDialog) setUpdateDialogOpen(true);
    if (assignmentsInDialog) setAssignmentDialogOpen(true);
  }, [
    assignmentsInDialog,
    assignments,
    fields,
    selectionDetailsInDialog,
    updateFields,
    updateInDialog,
  ]);

  const records = useMemo(() => getApiRecords(data), [data]);
  const recordsForTable = useMemo(() => {
    if (title !== "Teams") return records;
    const departments = optionRecords.departments ?? [];
    return records.map((record) => {
      if (typeof record.departmentName === "string" && record.departmentName.trim()) {
        return record;
      }
      const nestedDepartment = isApiRecord(record.department)
        ? record.department
        : null;
      const departmentId =
        record.departmentId ??
        (nestedDepartment ? nestedDepartment.id : undefined);
      if (departmentId === undefined || departmentId === null) return record;
      const department = departments.find(
        (item) => String(item.id) === String(departmentId),
      );
      return typeof department?.name === "string"
        ? { ...record, departmentName: department.name }
        : record;
    });
  }, [optionRecords.departments, records, title]);
  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const isUserAccounts =
      recordsTitle === "User accounts" || title === "Users";
    const keys = Array.from(
      new Set(
        records.flatMap((record) => Object.keys(flattenApiRecord(record))),
      ),
    ).filter((key) => {
      if (!isUserAccounts) return true;
      const normalizedKey = key.toLowerCase().replace(/[_.\s-]/g, "");
      return normalizedKey !== "id" && !normalizedKey.startsWith("department");
    });
    const result: DataTableColumn<ApiRecord>[] = tableColumns
      ? [...tableColumns]
      : keys.map((key) => {
      const normalizedKey = key.toLowerCase().replace(/[_.\s-]/g, "");
      return {
        key,
        header: humanizeApiKey(key.replaceAll(".", " ")),
        render: (record: ApiRecord) => {
          const value = flattenApiRecord(record)[key];
          return isUserAccounts && normalizedKey === "createdat"
            ? formatCreatedAt(value)
            : formatValue(value);
        },
      };
    });
    if (
      isUserAccounts &&
      !result.some((column) => column.key.toLowerCase() === "department")
    ) {
      const emailIndex = result.findIndex(
        (column) => column.key.toLowerCase() === "email",
      );
      result.splice(emailIndex >= 0 ? emailIndex + 1 : result.length, 0, {
        key: "department",
        header: "Department",
        render: (record: ApiRecord) => getUserDepartmentLabel(record),
      });
    }
    if (get || update || remove || assignments.length > 0) {
      result.push({
        key: "actions",
        header: "Actions",
        render: (record: ApiRecord) => {
          const id = record.id;
          if (typeof id !== "string" && typeof id !== "number") {
            return "Record ID not provided";
          }
          return (
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              aria-label={`${selectionLabel} ${getRecordDisplayName(record)}`}
              onClick={() => selectRecord(record)}
            >
              {selectionLabel}
            </button>
          );
        },
      });
    }
    return result;
  }, [
    assignments.length,
    assignmentsInDialog,
    createAssignment,
    get,
    records,
    remove,
    recordsTitle,
    selectRecord,
    tableColumns,
    title,
    update,
  ]);

  function visibleFields(fieldList: ApiField[]) {
    return fieldList.filter(
      (field) =>
        !field.when || form[field.when.field] === field.when.value,
    );
  }

  function buildBody(fieldList: ApiField[]): ApiRecord {
    const body: ApiRecord = {};
    for (const field of visibleFields(fieldList)) {
      const value = form[field.name]?.trim() ?? "";
      if (!value) continue;
      if (field.kind === "select-number") {
        const id = Number(value);
        if (!Number.isInteger(id) || id < 1) throw new Error(`Select a valid ${field.label.toLowerCase()}.`);
        body[field.name] = id;
      } else if (field.kind === "multi-select-number") {
        const ids = value.split(",").filter(Boolean).map(Number);
        if (ids.some((id) => !Number.isInteger(id) || id < 1)) throw new Error(`${field.label} must contain valid selections.`);
        if (ids.length) body[field.name] = ids;
      } else if (field.kind === "number") {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
          throw new Error(`${field.label} must be a valid number.`);
        }
        if (
          /(id|quantity)$/i.test(field.name) &&
          (!Number.isInteger(numericValue) || numericValue < 1)
        ) {
          throw new Error(`${field.label} must be a positive whole number.`);
        }
        body[field.name] = numericValue;
      }
      else if (field.kind === "list" || field.kind === "number-list") {
        body[field.name] = value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) =>
            field.kind === "number-list" ? Number(item) : item,
          );
        if (
          field.kind === "number-list" &&
          (body[field.name] as number[]).some(
            (item) => !Number.isInteger(item) || item < 1,
          )
        ) {
          throw new Error(`${field.label} must contain positive whole-number IDs.`);
        }
      } else body[field.name] = value;
    }
    return body;
  }

  function validateFields(fieldList: ApiField[]): string | null {
    const visible = visibleFields(fieldList);
    const unavailableSources = visible.filter(
      (field) =>
        field.required &&
        field.optionSource &&
        optionErrors[field.optionSource] &&
        !form[field.name]?.trim(),
    );
    if (unavailableSources.length) {
      const labels = unavailableSources.map((field) => field.label.toLowerCase()).join(", ");
      return `The available ${labels} options could not be retrieved right now. Please refresh the page or contact your administrator before submitting.`;
    }
    const missing = visible
      .filter((field) => field.required && !form[field.name]?.trim())
      .map((field) => field.label);
    if (missing.length) {
      return `Please complete the required fields before submitting: ${missing.join(", ")}.`;
    }
    if (
      visible.some((field) => field.name === "startDate") &&
      visible.some((field) => field.name === "endDate") &&
      form.startDate &&
      form.endDate &&
      form.startDate > form.endDate
    ) {
      return "Please ensure the end date is on or after the start date.";
    }
    return null;
  }

  async function runOperation(
    operation: () => Promise<unknown>,
    successMessage: string,
    refreshList = true,
  ): Promise<boolean> {
    setBusy(true);
    setError("");
    setWarning("");
    setNotice("");
    try {
      const response = await operation();
      setDetail(response);
      setRelatedData(null);
      setNotice(successMessage);
      if (refreshList) await reload();
      return true;
    } catch (operationError) {
      const message =
        operationError instanceof Error
          ? operationError.message
          : "The request could not be completed.";
      setErrorTitle("Unable to complete request");
      setError(
        /^a managing director is already assigned\.?$/i.test(message.trim())
          ? "A Managing Director account is already assigned. Only one account may be assigned at a time."
          : message,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function loadDetail() {
    if (!get || !selectedId.trim()) return;
    await runOperation(
      () => get(selectedId.trim()),
      "The requested record was loaded.",
      false,
    );
  }

  async function createRecord() {
    if (!create) return;
    const assigneeId = createAssignment
      ? assignmentValues[createAssignment.field]?.trim() ?? ""
      : "";
    if (
      createAssignment &&
      !createAssignment.optional &&
      createAssignment.requiresValue !== false &&
      !assigneeId
    ) {
      setError("");
      setNotice("");
      setWarning(
        `Select the ${createAssignmentLabel} before creating the ${createRecordLabel}.`,
      );
      return;
    }
    if (createdRecordId && createAssignment) {
      if (!assigneeId) {
        setWarning(
          `Select the ${createAssignmentLabel} to retry the assignment.`,
        );
        return;
      }
      const succeeded = await runOperation(
        () => createAssignment.run(createdRecordId, assigneeId),
        title === "Departments"
          ? "The department head was assigned."
          : "The team lead was assigned.",
      );
      if (succeeded) {
        setCreateDialogOpen(false);
        setDetail(null);
        setRelatedData(null);
        setForm(Object.fromEntries(fields.map((field) => [field.name, ""])));
        setCreatedRecordId("");
        setCreationBlocked(false);
        setAssignmentValues((current) => ({
          ...current,
          [createAssignment.field]: "",
        }));
      }
      return;
    }
    const validationError = validateFields(fields);
    if (validationError) {
      setError("");
      setNotice("");
      setWarning(validationError);
      return;
    }
    let body: ApiRecord;
    try {
      body = buildBody(fields);
    } catch (validationException) {
      setError("");
      setNotice("");
      setWarning(
        validationException instanceof Error
          ? validationException.message
          : "Please review the entered fields before submitting.",
      );
      return;
    }
    const succeeded = await runOperation(async () => {
      const response = await create(body);
      if (!createAssignment || !assigneeId) return response;

      const unwrapped = unwrapApiResponse(response);
      const createdRecord =
        isApiRecord(unwrapped) && isApiRecord(unwrapped.team)
          ? unwrapped.team
          : unwrapped;
      const recordId = isApiRecord(createdRecord)
        ? createdRecord.id ?? createdRecord.teamId
        : undefined;
      if (
        (typeof recordId !== "string" || !recordId.trim()) &&
        (typeof recordId !== "number" || !Number.isFinite(recordId))
      ) {
        setCreationBlocked(true);
        await reload();
        throw new Error(
          `The ${createRecordLabel} was created, but its ID was missing from the response, so the ${createAssignmentLabel} could not be assigned. Refresh the list and contact an administrator; do not submit the form again.`,
        );
      }

      const newRecordId = String(recordId);
      setCreatedRecordId(newRecordId);
      setSelectedId(newRecordId);
      try {
        await createAssignment.run(newRecordId, assigneeId);
      } catch (assignmentError) {
        await reload();
        const message =
          assignmentError instanceof Error
            ? assignmentError.message
            : "The assignment request failed.";
        throw new Error(
          `The ${createRecordLabel} was created, but assigning its ${createAssignmentLabel} failed. Retry the assignment here without creating the ${createRecordLabel} again. ${message}`,
        );
      }
      return response;
    },
    createAssignment && assigneeId
      ? title === "Departments"
        ? "The department was created and its department head was assigned."
        : "The team and team lead are assigned."
      : `The ${createRecordLabel} was created.`);
    if (succeeded && createInDialog) {
      setCreateDialogOpen(false);
      setDetail(null);
      setRelatedData(null);
      setForm(Object.fromEntries(fields.map((field) => [field.name, ""])));
      setCreatedRecordId("");
      setCreationBlocked(false);
      if (createAssignment) {
        setAssignmentValues((current) => ({
          ...current,
          [createAssignment.field]: "",
        }));
      }
    }
  }

  async function updateRecord() {
    if (!update || !selectedId.trim()) return;
    const validationError = validateFields(updateFields);
    if (validationError) {
      setError("");
      setNotice("");
      setWarning(validationError);
      return;
    }
    let body: ApiRecord;
    try {
      body = buildBody(updateFields);
    } catch (validationException) {
      setError("");
      setNotice("");
      setWarning(
        validationException instanceof Error
          ? validationException.message
          : "Please review the entered fields before submitting.",
      );
      return;
    }
    const succeeded = await runOperation(
      () => update(selectedId.trim(), body),
      "The record was updated.",
    );
    if (succeeded && updateInDialog) {
      setUpdateDialogOpen(false);
      setDetail(null);
      setRelatedData(null);
    }
  }

  async function deleteRecord() {
    if (!remove || !selectedId.trim()) return;
    setConfirmDelete(false);
    await runOperation(
      () => remove(selectedId.trim()),
      "The record was deleted.",
    );
  }

  async function loadRelated(operation: RelatedOperation) {
    if (!selectedId.trim()) return;
    setBusy(true);
    setError("");
    setWarning("");
    try {
      setRelatedData(await operation.load(selectedId.trim()));
    } catch (relatedError) {
      setErrorTitle("Unable to load related records");
      setError(
        relatedError instanceof Error
          ? relatedError.message
          : "Related records could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runAssignment(operation: AssignmentOperation) {
    if (!selectedId.trim()) return;
    const value = assignmentValues[operation.field]?.trim() ?? "";
    if (operation.requiresValue !== false && !value) {
      setError("");
      setNotice("");
      setWarning(`Please provide ${operation.label.toLowerCase()} before continuing.`);
      return;
    }
    const succeeded = await runOperation(
      () => operation.run(selectedId.trim(), value),
      operation.successMessage ?? `${operation.label} completed.`,
    );
    if (operation.field === "teamUserId") {
      const refreshTeamLeads = "teamLeadOptions" in assignmentValues;
      setOptionLoading((current) => ({
        ...current,
        teamUsers: true,
        ...(refreshTeamLeads ? { teamLeads: true } : {}),
      }));
      setOptionErrors((current) => ({
        ...current,
        teamUsers: "",
        ...(refreshTeamLeads ? { teamLeads: "" } : {}),
      }));
      try {
        const response = await teamsApi.unassignedUsers();
        const eligible = getApiRecords(response).filter(
          (user) => user.isActive !== false,
        );
        setAssignmentValues((current) => ({
          ...current,
          teamUserOptions: JSON.stringify(
            getUserOptions(
              eligible.filter(
                (user) =>
                  user.role === "TEAM_LEAD" || user.role === "TEAM_MEMBER",
              ),
            ),
          ),
          ...(refreshTeamLeads
            ? {
                teamLeadOptions: JSON.stringify(
                  getUserOptions(
                    eligible.filter((user) => user.role === "TEAM_LEAD"),
                  ),
                ),
              }
            : {}),
          ...(succeeded ? { teamUserId: "" } : {}),
        }));
      } catch (loadError) {
        const message = getTeamEligibilityErrorMessage(
          loadError,
          "Eligible users could not be refreshed.",
        );
        setOptionErrors((current) => ({
          ...current,
          teamUsers: message,
          ...(refreshTeamLeads ? { teamLeads: message } : {}),
        }));
      } finally {
        setOptionLoading((current) => ({
          ...current,
          teamUsers: false,
          ...(refreshTeamLeads ? { teamLeads: false } : {}),
        }));
      }
    }
  }

  function updateFormField(name: string, nextValue: string) {
    setWarning("");
    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
  }

  function renderField(field: ApiField) {
    if (field.when && form[field.when.field] !== field.when.value) return null;
    const value = form[field.name] ?? "";
    const id = `${title.toLowerCase().replaceAll(" ", "-")}-${field.name}`;
    return (
      <label className={styles.field} key={field.name} htmlFor={id}>
        <span>
          {field.label}
          {field.required ? " *" : ""}
        </span>
        {field.kind === "textarea" ? (
          <textarea
            id={id}
            rows={3}
            value={value}
            required={field.required}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            onChange={(event) => updateFormField(field.name, event.target.value)}
          />
        ) : field.kind === "select-options" ? (
          <>
            <select id={id} value={value} required={field.required} disabled={optionLoading[field.optionSource ?? ""] || Boolean(optionErrors[field.optionSource ?? ""])} onChange={(event) => updateFormField(field.name, event.target.value)}>
              <option value="">{optionLoading[field.optionSource ?? ""] ? "Loading departments…" : "Choose a department"}</option>
              {(optionRecords[field.optionSource ?? ""] ?? []).filter((record) => (typeof record.id === "number" || (typeof record.id === "string" && record.id.trim() !== "")) && typeof record.name === "string" && record.name.trim() !== "").map((record) => <option key={String(record.id)} value={field.optionValue === "name" ? String(record.name) : String(record.id)}>{String(record.name)}</option>)}
            </select>
            {optionErrors[field.optionSource ?? ""] && <small role="alert">Departments could not be loaded: {optionErrors[field.optionSource ?? ""]}</small>}
            {!optionLoading[field.optionSource ?? ""] && !optionErrors[field.optionSource ?? ""] && (optionRecords[field.optionSource ?? ""] ?? []).length === 0 && <small>No departments are available.</small>}
          </>
        ) : field.kind === "select-number" || field.kind === "multi-select-number" ? (
          <>
            <select id={id} multiple={field.kind === "multi-select-number"} value={field.kind === "multi-select-number" ? undefined : value} required={field.required} disabled={optionLoading[field.optionSource ?? ""] || Boolean(optionErrors[field.optionSource ?? ""])} onChange={(event) => {
              const selected = field.kind === "multi-select-number" ? Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(",") : event.target.value;
              updateFormField(field.name, selected);
            }}>
              {field.kind !== "multi-select-number" && <option value="">{optionLoading[field.optionSource ?? ""] ? "Loading departments..." : optionErrors[field.optionSource ?? ""] ? "Departments unavailable" : (optionRecords[field.optionSource ?? ""] ?? []).length === 0 ? "No departments available" : "Select a department"}</option>}
              {(optionRecords[field.optionSource ?? ""] ?? []).filter((record) => (typeof record.id === "number" || (typeof record.id === "string" && record.id.trim() !== "")) && typeof record.name === "string" && record.name.trim() !== "").map((record) => <option key={String(record.id)} value={String(record.id)}>{String(record.name)}</option>)}
            </select>
            {optionLoading[field.optionSource ?? ""] && <small>Loading departments...</small>}
            {!optionLoading[field.optionSource ?? ""] && !optionErrors[field.optionSource ?? ""] && (optionRecords[field.optionSource ?? ""] ?? []).length === 0 && <small>No departments are available. Create a department first.</small>}
            {optionErrors[field.optionSource ?? ""] && <small role="alert">Departments could not be loaded: {optionErrors[field.optionSource ?? ""]}</small>}
            {field.kind === "multi-select-number" && <small>Hold Ctrl or Command to select multiple teams.</small>}
          </>
        ) : field.kind === "select" ? (
          <select
            id={id}
            value={value}
            required={field.required}
            onChange={(event) => updateFormField(field.name, event.target.value)}
          >
            <option value="">Select</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={
              field.kind === "number" || field.kind === "date"
                ? field.kind
                : "text"
            }
            value={value}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            onChange={(event) => updateFormField(field.name, event.target.value)}
          />
        )}
        {(field.kind === "list" || field.kind === "number-list") && (
          <small>Select related records using their available IDs.</small>
        )}
      </label>
    );
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title={title} description={description} />
      {error && (
        <ErrorMessage title={errorTitle} message={error} onRetry={reload} />
      )}
      {warning && (
        <WarningMessage title="Action required" message={warning} />
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={`${styles.panelHeading} ${hideRecordsTitle ? styles.panelHeadingActionsOnly : ""}`}>
          {!hideRecordsTitle && <h2>{recordsTitle}</h2>}
          <div className={styles.actions}>
            {headingAction}
            <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={loading || busy} onClick={() => void reload()}>{loading ? "Refreshing…" : "Refresh"}</button>
            {create && createInDialog && (
              <button
                type="button"
                className="rt-root rt-btn rt-btn--primary"
                disabled={busy || Boolean(createdRecordId) || creationBlocked}
                onClick={() => {
                  setForm(Object.fromEntries(fields.map((field) => [field.name, ""])));
                  setCreatedRecordId("");
                  setCreationBlocked(false);
                  if (createAssignment) {
                    setAssignmentValues((current) => ({
                      ...current,
                      [createAssignment.field]: "",
                    }));
                  }
                  setWarning("");
                  setError("");
                  setCreateDialogOpen(true);
                }}
              >
                {createButtonLabel ?? `Create ${title === "Teams" ? "Team" : "Record"}`}
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <LoadingState message="Loading backend records..." />
        ) : (records.length > 0 || (showEmptyTable && data !== null)) &&
          columns.length > 0 ? (
          <DataTable
            columns={columns}
            rows={recordsForTable}
            showEmptyTable={showEmptyTable}
            itemLabel="record"
            emptyTitle="No records"
            emptyDescription="The backend response did not contain any records."
          />
        ) : (
          <ApiDataView
            data={data}
            emptyTitle={data === null ? "No response data" : "No records are currently available"}
            emptyDescription={
              data === null
                ? "No response data was received."
                : "The backend response did not contain any records."
            }
          />
        )}
      </section>

      {!hideRecordActions && (get ||
        create ||
        update ||
        remove ||
        related.length > 0 ||
        (assignments.length > 0 && !assignmentsInDialog)) && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>{title === "Teams" ? "Team actions" : title === "Projects" ? "Project actions" : "Record actions"}</h2>
          <label className={styles.field} htmlFor="api-record-id">
            <span>Record ID</span>
            <input
              id="api-record-id"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              placeholder="Select a record or enter its ID"
            />
          </label>
          <div className={styles.actions}>
            {get && (
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                disabled={busy || !selectedId.trim()}
                onClick={() => void loadDetail()}
              >
                Load details
              </button>
            )}
            {remove && (
              <button
                type="button"
                className="rt-root rt-btn rt-btn--danger"
                disabled={busy || !selectedId.trim()}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </div>

          {(create || update) && !createInDialog && (
            <form
              className={styles.form}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (create) void createRecord();
              }}
            >
              <h3>{create ? createHeading ?? `Create a ${title === "Teams" ? "team" : title === "Projects" ? "project" : "record"}` : "Record fields"}</h3>
              <div className={styles.grid}>{fields.map(renderField)}</div>
              <div className={styles.actions}>
                {create && (
                  <button
                    type="submit"
                    className="rt-root rt-btn rt-btn--primary"
                    disabled={busy}
                  >
                    {busy ? "Saving..." : createButtonLabel ?? `Create ${title === "Teams" ? "Team" : title === "Projects" ? "Project" : "Record"}`}
                  </button>
                )}
                {update && (
                  <button
                    type="button"
                    className="rt-root rt-btn rt-btn--primary"
                    disabled={busy}
                    onClick={() => setForm(Object.fromEntries(fields.map((field) => [field.name, ""])))}
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          )}

          {!assignmentsInDialog && assignments.map((operation) => (
            <div className={styles.assignment} key={operation.field}>
              {operation.requiresValue !== false && (
                <label
                  className={styles.field}
                  htmlFor={`assignment-${operation.field}`}
                >
                  <span>{operation.label}</span>
                  {operation.field === "teamLeadId" || operation.field === "headUserId" ? (
                    <>
                      <select id={`assignment-${operation.field}`} value={assignmentValues[operation.field] ?? ""} onChange={(event) => setAssignmentValues((current) => ({ ...current, [operation.field]: event.target.value }))} disabled={optionLoading[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"] || Boolean(optionErrors[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"])}>
                        <option value="">{optionLoading[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"] ? "Loading eligible users…" : operation.field === "teamLeadId" ? "Select a team lead" : "Select a department head"}</option>
                        {(JSON.parse(assignmentValues[operation.field === "teamLeadId" ? "teamLeadOptions" : "departmentHeadOptions"] ?? "[]") as { value: string; label: string }[]).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      {optionErrors[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"] && <small role="alert">{optionErrors[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"]}</small>}
                      {!optionLoading[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"] && !optionErrors[operation.field === "teamLeadId" ? "teamLeads" : "departmentHeads"] && JSON.parse(assignmentValues[operation.field === "teamLeadId" ? "teamLeadOptions" : "departmentHeadOptions"] ?? "[]").length === 0 && <small>No eligible users are available.</small>}
                    </>
                  ) : operation.field === "teamUserId" ? (
                    <>
                      <select
                        id={`assignment-${operation.field}`}
                        value={assignmentValues[operation.field] ?? ""}
                        onChange={(event) =>
                          setAssignmentValues((current) => ({
                            ...current,
                            [operation.field]: event.target.value,
                          }))
                        }
                        disabled={
                          optionLoading.teamUsers ||
                          Boolean(optionErrors.teamUsers)
                        }
                      >
                        <option value="">
                          {optionLoading.teamUsers
                            ? "Loading eligible users…"
                            : optionErrors.teamUsers
                              ? "Eligible users unavailable"
                              : "Select a Team Lead or Team Member"}
                        </option>
                        {(
                          JSON.parse(
                            assignmentValues.teamUserOptions ?? "[]",
                          ) as { value: string; label: string }[]
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {optionErrors.teamUsers && (
                        <small role="alert">
                          Eligible users could not be loaded:{" "}
                          {optionErrors.teamUsers}
                        </small>
                      )}
                      {!optionLoading.teamUsers &&
                        !optionErrors.teamUsers &&
                        JSON.parse(
                          assignmentValues.teamUserOptions ?? "[]",
                        ).length === 0 && (
                          <small>
                            No unassigned Team Leads or Team Members are
                            available.
                          </small>
                        )}
                    </>
                  ) : operation.options ? (
                    <select
                      id={`assignment-${operation.field}`}
                      value={assignmentValues[operation.field] ?? ""}
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [operation.field]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select</option>
                      {operation.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`assignment-${operation.field}`}
                      value={assignmentValues[operation.field] ?? ""}
                      placeholder={
                        operation.kind === "list" ||
                        operation.kind === "number-list"
                          ? "Enter IDs separated by commas"
                          : "Enter ID"
                      }
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [operation.field]: event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              )}
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                disabled={
                  busy ||
                  !selectedId.trim() ||
                  (operation.requiresValue !== false &&
                    !assignmentValues[operation.field]?.trim())
                }
                onClick={() => {
                  if (operation.confirmation) {
                    setPendingAssignment(operation);
                  } else {
                    void runAssignment(operation);
                  }
                }}
              >
                {operation.label}
              </button>
            </div>
          ))}

          {related.length > 0 && (
            <div className={styles.actions}>
              {related.map((operation) => (
                <button
                  type="button"
                  className="rt-root rt-btn rt-btn--outline"
                  key={operation.label}
                  disabled={busy || !selectedId.trim()}
                  onClick={() => void loadRelated(operation)}
                >
                  Load {operation.label}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {create && createInDialog && (
        <dialog
          ref={createDialogRef}
          className={styles.assignmentDialog}
          aria-labelledby="create-record-title"
          onCancel={(event) => {
            if (busy || createdRecordId) event.preventDefault();
          }}
          onClose={() => {
            if (!busy && !createdRecordId) setCreateDialogOpen(false);
          }}
        >
          <div className={styles.dialogHeading}>
            <h2 id="create-record-title">
              {createHeading ?? `Create ${title === "Teams" ? "Team" : "Record"}`}
            </h2>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={busy || Boolean(createdRecordId)}
              onClick={() => setCreateDialogOpen(false)}
            >
              Close
            </button>
          </div>
          {error && <ErrorMessage title={errorTitle} message={error} onRetry={reload} />}
          {warning && <WarningMessage title="Action required" message={warning} />}
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void createRecord();
            }}
          >
            <fieldset
              className={styles.createFields}
              disabled={busy || Boolean(createdRecordId) || creationBlocked}
            >
              <div className={styles.grid}>{fields.map(renderField)}</div>
            </fieldset>
            {createAssignment &&
              (createAssignment.requiresValue !== false ||
                createAssignment.optional) && (
              <label className={styles.field} htmlFor={`create-${createAssignment.field}`}>
                <span>
                  {createAssignment.label}
                  {createAssignment.optional ? "" : " *"}
                </span>
                <select
                  id={`create-${createAssignment.field}`}
                  required={!createAssignment.optional}
                  value={assignmentValues[createAssignment.field] ?? ""}
                  disabled={
                    busy ||
                    creationBlocked ||
                    optionLoading[createAssignmentOptionSource] ||
                    (!createAssignment.optional &&
                      Boolean(optionErrors[createAssignmentOptionSource]))
                  }
                  onChange={(event) =>
                    setAssignmentValues((current) => ({
                      ...current,
                      [createAssignment.field]: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    {optionLoading[createAssignmentOptionSource]
                      ? `Loading eligible ${createAssignmentLabel}s…`
                      : optionErrors[createAssignmentOptionSource]
                        ? `${createAssignmentLabel} options unavailable`
                        : `Select a ${createAssignmentLabel}`}
                  </option>
                  {(
                    JSON.parse(
                      assignmentValues[createAssignmentOptionsKey] ?? "[]",
                    ) as { value: string; label: string }[]
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {optionErrors[createAssignmentOptionSource] && (
                  <small role="alert">
                    {optionErrors[createAssignmentOptionSource]}
                  </small>
                )}
                {!optionLoading[createAssignmentOptionSource] &&
                  !optionErrors[createAssignmentOptionSource] &&
                  JSON.parse(
                    assignmentValues[createAssignmentOptionsKey] ?? "[]",
                  ).length === 0 && (
                    <small>No eligible {createAssignmentLabel}s are available.</small>
                  )}
              </label>
            )}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                disabled={busy || Boolean(createdRecordId)}
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rt-root rt-btn rt-btn--primary"
                disabled={
                  busy ||
                  creationBlocked ||
                  Boolean(
                    createAssignment &&
                      !createAssignment.optional &&
                      optionErrors[createAssignmentOptionSource],
                  ) ||
                  Boolean(
                    createAssignment &&
                      !createAssignment.optional &&
                      createAssignment.requiresValue !== false &&
                      !assignmentValues[createAssignment.field]?.trim(),
                  )
                }
              >
                {busy
                  ? createdRecordId
                    ? "Assigning…"
                    : "Saving…"
                  : createdRecordId
                    ? "Retry assignment"
                    : createButtonLabel ?? "Create"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {update && updateInDialog && (
        <dialog
          ref={updateDialogRef}
          className={styles.assignmentDialog}
          aria-labelledby="update-record-title"
          onClose={() => setUpdateDialogOpen(false)}
        >
          <div className={styles.dialogHeading}>
            <h2 id="update-record-title">
              {updateHeading ?? `Edit ${title === "Teams" ? "team" : "record"}`}
            </h2>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={busy}
              onClick={() => setUpdateDialogOpen(false)}
            >
              Close
            </button>
          </div>
          {error && <ErrorMessage title={errorTitle} message={error} onRetry={reload} />}
          {warning && <WarningMessage title="Action required" message={warning} />}
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void updateRecord();
            }}
          >
            <fieldset className={styles.createFields} disabled={busy}>
              <div className={styles.grid}>{updateFields.map(renderField)}</div>
            </fieldset>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                disabled={busy}
                onClick={() => setUpdateDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rt-root rt-btn rt-btn--primary"
                disabled={busy || !selectedId.trim()}
              >
                {busy ? "Saving…" : updateButtonLabel ?? "Save changes"}
              </button>
            </div>
          </form>
        </dialog>
      )}

        {(detail !== null || relatedData !== null) && !selectionDetailsInDialog && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>
            {relatedData !== null ? "Related records" : "Record details"}
          </h2>
          <ApiDataView data={relatedData ?? detail} />
        </section>
      )}

      {assignmentsInDialog && (
        <dialog
          ref={assignmentDialogRef}
          className={styles.assignmentDialog}
          aria-labelledby="record-actions-title"
          onClose={() => setAssignmentDialogOpen(false)}
        >
          <div className={styles.dialogHeading}>
            <h2 id="record-actions-title">
              {selectionDetailsInDialog
                ? `${dialogEntityLabel[0].toUpperCase()}${dialogEntityLabel.slice(1)} details`
                : `${dialogEntityLabel[0].toUpperCase()}${dialogEntityLabel.slice(1)} actions`}
            </h2>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              onClick={() => setAssignmentDialogOpen(false)}
              aria-label={`Close ${dialogEntityLabel} actions`}
            >
              Close
            </button>
          </div>
          <p className={styles.assignmentIntro}>
            {selectionDetailsInDialog
              ? `${dialogEntityLabel[0].toUpperCase()}${dialogEntityLabel.slice(1)} information and available actions for ${selectedUserName}.`
              : `Choose an action for ${selectedUserName}.`}
          </p>
          {selectionDetailsInDialog && isApiRecord(detail) && (
            <div className={styles.dialogDetails}>
              <ApiDataView
                fieldIcons={selectionDetailsInDialog}
                data={Object.fromEntries(
                  Object.entries(detail)
                    .filter(([key]) => !["id", "userid"].includes(key.toLowerCase().replace(/[_-]/g, "")))
                    .map(([key, value]) => [
                      key,
                      key.toLowerCase().replace(/[_-]/g, "") === "createdat"
                        ? formatCreatedAt(value)
                        : value,
                    ]),
                )}
              />
            </div>
          )}
          <div className={selectionDetailsInDialog ? styles.userActionRow : undefined}>
          {assignments
            .filter((operation) => operation.requiresValue !== false)
            .map((operation) => (
              <div className={styles.assignment} key={operation.field}>
                <label
                  className={styles.field}
                  htmlFor={`assignment-${operation.field}`}
                >
                  <span>{operation.label}</span>
                  {operation.field === "headUserId" ? (
                    <>
                      <select
                        id={`assignment-${operation.field}`}
                        value={assignmentValues[operation.field] ?? ""}
                        disabled={
                          optionLoading.departmentHeads ||
                          Boolean(optionErrors.departmentHeads)
                        }
                        onChange={(event) =>
                          setAssignmentValues((current) => ({
                            ...current,
                            [operation.field]: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {optionLoading.departmentHeads
                            ? "Loading eligible department heads…"
                            : optionErrors.departmentHeads
                              ? "Department heads unavailable"
                              : "Select a department head"}
                        </option>
                        {(
                          JSON.parse(
                            assignmentValues.departmentHeadOptions ?? "[]",
                          ) as { value: string; label: string }[]
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {optionErrors.departmentHeads && (
                        <small role="alert">
                          Department heads could not be loaded:{" "}
                          {optionErrors.departmentHeads}
                        </small>
                      )}
                      {!optionLoading.departmentHeads &&
                        !optionErrors.departmentHeads &&
                        JSON.parse(
                          assignmentValues.departmentHeadOptions ?? "[]",
                        ).length === 0 && (
                          <small>No active department heads are available.</small>
                        )}
                    </>
                  ) : operation.field === "teamUserId" ? (
                    <>
                      <select
                        id={`assignment-${operation.field}`}
                        value={assignmentValues[operation.field] ?? ""}
                        disabled={
                          optionLoading.teamUsers ||
                          Boolean(optionErrors.teamUsers)
                        }
                        onChange={(event) =>
                          setAssignmentValues((current) => ({
                            ...current,
                            [operation.field]: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {optionLoading.teamUsers
                            ? "Loading eligible users…"
                            : optionErrors.teamUsers
                              ? "Eligible users unavailable"
                              : "Select a Team Lead or Team Member"}
                        </option>
                        {(
                          JSON.parse(
                            assignmentValues.teamUserOptions ?? "[]",
                          ) as { value: string; label: string }[]
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {optionErrors.teamUsers && (
                        <small role="alert">
                          Eligible users could not be loaded:{" "}
                          {optionErrors.teamUsers}
                        </small>
                      )}
                      {!optionLoading.teamUsers &&
                        !optionErrors.teamUsers &&
                        JSON.parse(
                          assignmentValues.teamUserOptions ?? "[]",
                        ).length === 0 && (
                          <small>
                            No unassigned Team Leads or Team Members are
                            available.
                          </small>
                        )}
                    </>
                  ) : operation.options ? (
                    <select
                      id={`assignment-${operation.field}`}
                      value={assignmentValues[operation.field] ?? ""}
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [operation.field]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select</option>
                      {operation.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`assignment-${operation.field}`}
                      value={assignmentValues[operation.field] ?? ""}
                      placeholder={
                        operation.kind === "list" ||
                        operation.kind === "number-list"
                          ? "Enter IDs separated by commas"
                          : "Enter ID"
                      }
                      onChange={(event) =>
                        setAssignmentValues((current) => ({
                          ...current,
                          [operation.field]: event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
                <button
                  type="button"
                  className={`rt-root rt-btn ${selectionDetailsInDialog ? "rt-btn--primary" : "rt-btn--outline"}`}
                  disabled={
                    busy ||
                    !selectedId.trim() ||
                    !assignmentValues[operation.field]?.trim()
                  }
                  onClick={() => {
                    setAssignmentDialogOpen(false);
                    if (operation.confirmation) {
                      setPendingAssignment(operation);
                    } else {
                      void runAssignment(operation);
                    }
                  }}
                >
                  {operation.label}
                </button>
              </div>
            ))}
          <div className={styles.dialogActions}>
            {selectionDetailsInDialog && updateInDialog && (
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                disabled={busy}
                onClick={() => {
                  setAssignmentDialogOpen(false);
                  setUpdateDialogOpen(true);
                }}
              >
                Edit {dialogEntityLabel}
              </button>
            )}
            {assignments
              .filter((operation) => operation.requiresValue === false)
              .filter((operation) => {
                if (!selectionDetailsInDialog || !isApiRecord(detail)) {
                  return true;
                }
                const action = operation.field.toLowerCase();
                if (action === "deactivate") return detail.isActive !== false;
                if (action === "reactivate") return detail.isActive === false;
                return true;
              })
              .map((operation) => (
                <button
                  type="button"
                  className={`rt-root rt-btn ${selectionDetailsInDialog ? operation.confirmation ? "rt-btn--danger" : "rt-btn--primary" : "rt-btn--outline"}`}
                  key={operation.field}
                  disabled={busy || !selectedId.trim()}
                  onClick={() => {
                    setAssignmentDialogOpen(false);
                    if (operation.confirmation) {
                      setPendingAssignment(operation);
                    } else {
                      void runAssignment(operation);
                    }
                  }}
                >
                  {operation.label}
                </button>
              ))}
          </div>
          </div>
        </dialog>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this record?"
        message="This action is not reversible."
        confirmLabel="Delete record"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void deleteRecord()}
      />
      {pendingAssignment?.confirmation && (
        <ConfirmDialog
          open
          title={pendingAssignment.confirmation.title}
          message={pendingAssignment.confirmation.message}
          confirmLabel={pendingAssignment.confirmation.confirmLabel}
          cancelLabel="Cancel"
          destructive
          onCancel={() => setPendingAssignment(null)}
          onConfirm={() => {
            const operation = pendingAssignment;
            setPendingAssignment(null);
            void runAssignment(operation);
          }}
        />
      )}
    </section>
  );
}


