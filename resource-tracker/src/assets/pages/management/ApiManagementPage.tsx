import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
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
  assignmentsInDialog?: boolean;
  recordsTitle?: string;
  headingAction?: React.ReactNode;
  selectionLabel?: string;
  selectionDetailsInDialog?: boolean;
  createHeading?: string;
  createButtonLabel?: string;
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
  const lastName =
    typeof record.lastName === "string" ? record.lastName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (fullName) return fullName;
  return typeof record.email === "string" && record.email.trim()
    ? record.email.trim()
    : "the selected user";
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
  assignmentsInDialog = false,
  recordsTitle = "Users records",
  headingAction,
  selectionLabel = "Select",
  selectionDetailsInDialog = false,
  createHeading,
  createButtonLabel,
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
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const assignmentDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingAssignment, setPendingAssignment] =
    useState<AssignmentOperation | null>(null);
  const [optionRecords, setOptionRecords] = useState<Record<string, ApiRecord[]>>({});
  const [optionLoading, setOptionLoading] = useState<Record<string, boolean>>({});
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});

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
        }
      }).catch((loadError) => {
        if (active) setOptionErrors((current) => ({ ...current, [source]: loadError instanceof Error ? loadError.message : "Options could not be loaded." }));
      }).finally(() => {
        if (active) setOptionLoading((current) => ({ ...current, [source]: false }));
      });
    }
    if (title === "Teams" && assignments.length) {
      setOptionLoading((current) => ({ ...current, teamLeads: true }));
      void teamsApi.unassignedUsers().then((response) => {
        const eligible = getApiRecords(response).filter((user) => user.role === "TEAM_LEAD");
        const options = eligible.filter((user) => typeof user.id === "string").map((user) => ({ value: String(user.id), label: `${typeof user.fullName === "string" ? user.fullName : user.id}${typeof user.email === "string" ? ` (${user.email})` : ""}` }));
        if (active) setAssignmentValues((current) => ({ ...current, teamLeadOptions: JSON.stringify(options) }));
      }).catch((loadError) => {
        if (active) setOptionErrors((current) => ({ ...current, teamLeads: loadError instanceof Error ? loadError.message : "Team leads could not be loaded." }));
      }).finally(() => { if (active) setOptionLoading((current) => ({ ...current, teamLeads: false })); });
    }
    if (title === "Departments" && assignments.length) {
      setOptionLoading((current) => ({ ...current, departmentHeads: true }));
      void usersApi.list().then((response) => {
        const eligible = getApiRecords(response).filter((user) => user.role === "DEPARTMENT_HEAD" && user.isActive !== false);
        const options = eligible.filter((user) => typeof user.id === "string").map((user) => ({ value: String(user.id), label: `${typeof user.fullName === "string" ? user.fullName : user.id}${typeof user.email === "string" ? ` (${user.email})` : ""}` }));
        if (active) setAssignmentValues((current) => ({ ...current, departmentHeadOptions: JSON.stringify(options) }));
      }).catch((loadError) => {
        if (active) setOptionErrors((current) => ({ ...current, departmentHeads: loadError instanceof Error ? loadError.message : "Department heads could not be loaded." }));
      }).finally(() => { if (active) setOptionLoading((current) => ({ ...current, departmentHeads: false })); });
    }
    return () => { active = false; };
  }, [assignments.length, fields, title]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
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
    }
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, textValue(record[field.name])]),
      ),
    );
    setDetail(
      assignmentsInDialog && !selectionDetailsInDialog ? null : record,
    );
    setRelatedData(null);
    setError("");
    setNotice("");
    if (assignmentsInDialog) setAssignmentDialogOpen(true);
  }, [assignmentsInDialog, fields]);

  const records = useMemo(() => getApiRecords(data), [data]);
  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const isUserAccounts = recordsTitle === "User accounts";
    const keys = Array.from(
      new Set(
        records.flatMap((record) => Object.keys(flattenApiRecord(record))),
      ),
    ).filter((key) => !(isUserAccounts && key.toLowerCase() === "id"));
    const result: DataTableColumn<ApiRecord>[] = keys.map((key) => {
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
    get,
    records,
    remove,
    selectRecord,
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
    const missing = visibleFields(fieldList)
      .filter((field) => field.required && !form[field.name]?.trim())
      .map((field) => field.label);
    if (missing.length) {
      return `Complete the required fields: ${missing.join(", ")}.`;
    }
    if (
      visibleFields(fieldList).some((field) => field.name === "startDate") &&
      visibleFields(fieldList).some((field) => field.name === "endDate") &&
      form.startDate &&
      form.endDate &&
      form.startDate > form.endDate
    ) {
      return "End date must be on or after start date.";
    }
    return null;
  }

  async function runOperation(
    operation: () => Promise<unknown>,
    successMessage: string,
    refreshList = true,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await operation();
      setDetail(response);
      setRelatedData(null);
      setNotice(successMessage);
      if (refreshList) await reload();
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "The operation could not be completed.",
      );
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
    const validationError = validateFields(fields);
    if (validationError) {
      setError(validationError);
      return;
    }
    await runOperation(
      () => create(buildBody(fields)),
      "The record was created.",
    );
  }

  async function updateRecord() {
    if (!update || !selectedId.trim()) return;
    const validationError = validateFields(updateFields);
    if (validationError) {
      setError(validationError);
      return;
    }
    await runOperation(
      () => update(selectedId.trim(), buildBody(updateFields)),
      "The record was updated.",
    );
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
    try {
      setRelatedData(await operation.load(selectedId.trim()));
    } catch (relatedError) {
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
      setError(`Enter ${operation.label.toLowerCase()} first.`);
      return;
    }
    await runOperation(
      () => operation.run(selectedId.trim(), value),
      `${operation.label} completed.`,
    );
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
          />
        ) : field.kind === "select-options" ? (
          <>
            <select id={id} value={value} required={field.required} disabled={optionLoading[field.optionSource ?? ""] || Boolean(optionErrors[field.optionSource ?? ""])} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
              <option value="">{optionLoading[field.optionSource ?? ""] ? "Loading departments…" : "Choose a department"}</option>
              {(optionRecords[field.optionSource ?? ""] ?? []).filter((record) => (typeof record.id === "number" || (typeof record.id === "string" && record.id.trim() !== "")) && typeof record.name === "string" && record.name.trim() !== "").map((record) => <option key={String(record.id)} value={String(record.id)}>{String(record.name)}</option>)}
            </select>
            {optionErrors[field.optionSource ?? ""] && <small role="alert">Departments could not be loaded: {optionErrors[field.optionSource ?? ""]}</small>}
            {!optionLoading[field.optionSource ?? ""] && !optionErrors[field.optionSource ?? ""] && (optionRecords[field.optionSource ?? ""] ?? []).length === 0 && <small>No departments are available.</small>}
          </>
        ) : field.kind === "select-number" || field.kind === "multi-select-number" ? (
          <>
            <select id={id} multiple={field.kind === "multi-select-number"} value={field.kind === "multi-select-number" ? undefined : value} required={field.required} disabled={optionLoading[field.optionSource ?? ""] || Boolean(optionErrors[field.optionSource ?? ""])} onChange={(event) => {
              const selected = field.kind === "multi-select-number" ? Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(",") : event.target.value;
              setForm((current) => ({ ...current, [field.name]: selected }));
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
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
        <ErrorMessage title="API operation failed" message={error} onRetry={reload} />
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.panelHeading}>
          <h2>{recordsTitle}</h2>
          <div className={styles.actions}>
            {headingAction}
            <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={loading || busy} onClick={() => void reload()}>{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
        </div>
        {loading ? (
          <LoadingState message="Loading backend records..." />
        ) : records.length > 0 && columns.length > 0 ? (
          <DataTable
            columns={columns}
            rows={records}
            itemLabel="record"
            emptyTitle="No records"
            emptyDescription="The backend returned no records."
          />
        ) : (
          <ApiDataView
            data={data}
            emptyTitle={data === null ? "No response data" : "No records found"}
            emptyDescription={
              data === null
                ? "Refresh to request the current records from the backend."
                : "The backend returned no object records."
            }
          />
        )}
      </section>

      {(get ||
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

          {(create || update) && (
            <form
              className={styles.form}
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
          aria-labelledby="user-actions-title"
          onClose={() => setAssignmentDialogOpen(false)}
        >
          <div className={styles.dialogHeading}>
            <h2 id="user-actions-title">
              {selectionDetailsInDialog ? "User details" : "User actions"}
            </h2>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              onClick={() => setAssignmentDialogOpen(false)}
              aria-label="Close user actions"
            >
              Close
            </button>
          </div>
          <p className={styles.assignmentIntro}>
            {selectionDetailsInDialog
              ? `User information and available account actions for ${selectedUserName}.`
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
                  {operation.options ? (
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
                  className={`rt-root rt-btn ${selectionDetailsInDialog ? operation.field.toLowerCase() === "deactivate" ? "rt-btn--danger" : "rt-btn--primary" : "rt-btn--outline"}`}
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


