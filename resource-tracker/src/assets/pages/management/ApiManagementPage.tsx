import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "../../data/api-response";
import ApiDataView from "./ApiDataView";
import styles from "./ApiManagementPage.module.css";

type ApiRecord = Record<string, unknown>;
type InputKind =
  | "text"
  | "number"
  | "number-list"
  | "date"
  | "textarea"
  | "select"
  | "list";

export interface ApiField {
  name: string;
  label: string;
  kind?: InputKind;
  required?: boolean;
  options?: { value: string; label: string }[];
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
}

function textValue(value: unknown): string {
  return value === null || value === undefined ? "" : formatApiValue(value);
}

function formatValue(value: unknown): string {
  return formatApiValue(value);
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
}: ApiManagementPageProps) {
  const [data, setData] = useState<unknown>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [relatedData, setRelatedData] = useState<unknown>(null);
  const [selectedId, setSelectedId] = useState(initialId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [assignmentValues, setAssignmentValues] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingAssignment, setPendingAssignment] =
    useState<AssignmentOperation | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await list());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const records = useMemo(() => getApiRecords(data), [data]);
  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const keys = Array.from(
      new Set(
        records.flatMap((record) => Object.keys(flattenApiRecord(record))),
      ),
    );
    const result: DataTableColumn<ApiRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record: ApiRecord) =>
        formatValue(flattenApiRecord(record)[key]),
    }));
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
              onClick={() => selectRecord(record)}
            >
              Select
            </button>
          );
        },
      });
    }
    return result;
  }, [assignments.length, get, records, remove, update]);

  function selectRecord(record: ApiRecord) {
    const id = record.id;
    if (typeof id === "string" || typeof id === "number") {
      setSelectedId(String(id));
    }
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, textValue(record[field.name])]),
      ),
    );
    setDetail(record);
    setRelatedData(null);
    setError("");
    setNotice("");
  }

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
      if (field.kind === "number") {
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
          />
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
          <small>Enter the documented IDs separated by commas.</small>
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
          <h2>Users records</h2>
          <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={() => void reload()}>
            Refresh
          </button>
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

      {(get || create || update || remove || related.length > 0 || assignments.length > 0) && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>Record actions</h2>
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
              <h3>{create ? "Create a record" : "Record fields"}</h3>
              <div className={styles.grid}>{fields.map(renderField)}</div>
              <div className={styles.actions}>
                {create && (
                  <button
                    type="submit"
                    className="rt-root rt-btn rt-btn--primary"
                    disabled={busy}
                  >
                    {busy ? "Saving..." : "Create"}
                  </button>
                )}
                {update && (
                  <button
                    type="button"
                    className="rt-root rt-btn rt-btn--primary"
                    disabled={busy || !selectedId.trim()}
                    onClick={() => void updateRecord()}
                  >
                    {busy ? "Saving..." : "Save changes"}
                  </button>
                )}
              </div>
            </form>
          )}

          {assignments.map((operation) => (
            <div className={styles.assignment} key={operation.field}>
              {operation.requiresValue !== false && (
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

      {(detail !== null || relatedData !== null) && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>
            {relatedData !== null ? "Related records" : "Record details"}
          </h2>
          <ApiDataView data={relatedData ?? detail} />
        </section>
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
