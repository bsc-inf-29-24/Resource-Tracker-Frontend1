import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  projectsApi,
  resourceRequestsApi,
  resourcesApi,
  teamsApi,
  usersApi,
} from "../../data/api-services";
import type { CreateResourceRequestInput } from "../../data/api-services";
import {
  getApiRecords,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import styles from "../management/ApiManagementPage.module.css";
import formStyles from "./NewRequestPage.module.css";

type ApiRecord = Record<string, unknown>;
type RequestField =
  | "resourceId"
  | "itemDescription"
  | "batchNumber"
  | "quantity"
  | "expectedDurationDays"
  | "teamId"
  | "projectId"
  | "lineManagerName";
type RequestForm = Record<RequestField, string>;
type TeamOption = { id: number; name: string };
type ProjectOption = { id: number; name: string; teamIds: number[] };
type ResourceOption = { id: string; name: string; quantity: number };
type LineManagerOption = { id: string; fullName: string };

const initialForm: RequestForm = {
  resourceId: "",
  itemDescription: "",
  batchNumber: "",
  quantity: "",
  expectedDurationDays: "",
  projectId: "",
  lineManagerName: "",
  teamId: "",
};

const sourceLabels = {
  resources: "Available resources",
  teams: "Teams",
  projects: "Projects",
  lineManagers: "Line Managers",
} as const;

function recordsFrom(response: unknown, source: string): ApiRecord[] {
  const unwrapped = unwrapApiResponse(response);
  const records = getApiRecords(unwrapped);
  if (!Array.isArray(unwrapped) || records.length !== unwrapped.length) {
    throw new Error(`${source} returned an unexpected response. Please retry.`);
  }
  return records;
}

function numericId(record: ApiRecord, source: string): number {
  const id = record.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
    throw new Error(`${source} returned a record without a valid numeric ID.`);
  }
  return id;
}

function parseTeams(response: unknown): TeamOption[] {
  return recordsFrom(response, "The Teams endpoint").map((record) => {
    if (typeof record.name !== "string" || !record.name.trim()) {
      throw new Error("The Teams endpoint returned a team without a name.");
    }
    return { id: numericId(record, "The Teams endpoint"), name: record.name };
  });
}

function parseProjects(response: unknown): ProjectOption[] {
  return recordsFrom(response, "The Projects endpoint").map((record) => {
    if (typeof record.name !== "string" || !record.name.trim() || !Array.isArray(record.teams)) {
      throw new Error("The Projects endpoint must return project names and assigned teams.");
    }
    const teamIds = record.teams.map((team) => {
      if (!isApiRecord(team)) {
        throw new Error("The Projects endpoint returned an invalid team assignment.");
      }
      return numericId(team, "The Projects endpoint");
    });
    return {
      id: numericId(record, "The Projects endpoint"),
      name: record.name,
      teamIds,
    };
  });
}

function parseResources(response: unknown): ResourceOption[] {
  const resources = recordsFrom(response, "The Resources endpoint").map((record) => {
    if (
      typeof record.id !== "string" || !record.id.trim() ||
      typeof record.name !== "string" || !record.name.trim() ||
      (record.status !== "AVAILABLE" && record.status !== "ASSIGNED") ||
      typeof record.quantity !== "number" || !Number.isFinite(record.quantity)
    ) {
      throw new Error("The Resources endpoint returned an incomplete resource record.");
    }
    return {
      id: record.id,
      name: record.name,
      quantity: record.quantity,
      status: record.status,
    };
  });
  return resources
    .filter((resource) => resource.status === "AVAILABLE" && resource.quantity > 0)
    .map(({ id, name, quantity }) => ({ id, name, quantity }));
}

function parseLineManagers(response: unknown): LineManagerOption[] {
  return recordsFrom(response, "The Line Manager endpoint").map((record) => {
    if (
      typeof record.id !== "string" || !record.id.trim() ||
      typeof record.fullName !== "string" || !record.fullName.trim()
    ) {
      throw new Error("The Line Manager endpoint returned an incomplete account record.");
    }
    return { id: record.id, fullName: record.fullName };
  });
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function NewApiRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [lineManagers, setLineManagers] = useState<LineManagerOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourceErrors, setSourceErrors] = useState<Partial<Record<keyof typeof sourceLabels, string>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequestField, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    setSourceErrors({});
    const results = await Promise.allSettled([
      resourcesApi.available(),
      teamsApi.list(),
      projectsApi.list(),
      usersApi.lineManagers(),
    ]);
    const nextErrors: typeof sourceErrors = {};
    const setResult = <T,>(
      result: PromiseSettledResult<unknown>,
      key: keyof typeof sourceLabels,
      parse: (value: unknown) => T,
      setValue: (value: T) => void,
    ) => {
      if (result.status === "rejected") {
        setValue([] as T);
        nextErrors[key] = errorText(result.reason, `${sourceLabels[key]} could not be loaded.`);
        return;
      }
      try {
        setValue(parse(result.value));
      } catch (parseError) {
        setValue([] as T);
        nextErrors[key] = errorText(parseError, `${sourceLabels[key]} could not be loaded.`);
      }
    };
    setResult(results[0], "resources", parseResources, setResources);
    setResult(results[1], "teams", parseTeams, setTeams);
    setResult(results[2], "projects", parseProjects, setProjects);
    setResult(results[3], "lineManagers", parseLineManagers, setLineManagers);
    setSourceErrors(nextErrors);
    setLoadingSources(false);
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const selectedTeamId = Number(form.teamId);
  const compatibleProjects = useMemo(
    () => projects.filter((project) => project.teamIds.includes(selectedTeamId)),
    [projects, selectedTeamId],
  );

  function updateField(field: RequestField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccess("");
  }

  function updateTeam(value: string) {
    setForm((current) => ({ ...current, teamId: value, projectId: "" }));
    setFieldErrors((current) => ({ ...current, teamId: undefined, projectId: undefined }));
    setSubmitError("");
    setSuccess("");
  }

  function validate(): Partial<Record<RequestField, string>> {
    const errors: Partial<Record<RequestField, string>> = {};
    for (const field of ["itemDescription", "batchNumber"] as const) {
      if (!form[field].trim()) errors[field] = "This field is required.";
    }
    for (const field of ["quantity", "expectedDurationDays"] as const) {
      const value = form[field].trim();
      if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
        errors[field] = "Enter a positive whole number.";
      }
    }
    if (!resources.some((resource) => resource.id === form.resourceId)) {
      errors.resourceId = resources.length ? "Select an available resource." : "No available resources were returned by the backend.";
    }
    if (!teams.some((team) => String(team.id) === form.teamId)) {
      errors.teamId = teams.length ? "Select a team returned by the backend." : "No teams were returned by the backend.";
    }
    if (!compatibleProjects.some((project) => String(project.id) === form.projectId)) {
      errors.projectId = compatibleProjects.length
        ? "Select a project assigned to the selected team."
        : "No backend projects are assigned to the selected team.";
    }
    if (!lineManagers.some((manager) => manager.fullName === form.lineManagerName)) {
      errors.lineManagerName = lineManagers.length
        ? "Select an active Line Manager returned by the backend."
        : "No active Line Managers were returned by the backend.";
    }
    return errors;
  }

  function requestInput(): CreateResourceRequestInput {
    return {
      resourceId: form.resourceId,
      itemDescription: form.itemDescription.trim(),
      batchNumber: form.batchNumber.trim(),
      quantity: Number(form.quantity),
      expectedDurationDays: Number(form.expectedDurationDays),
      projectId: Number(form.projectId),
      lineManagerName: form.lineManagerName,
      teamId: Number(form.teamId),
    };
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || Object.keys(sourceErrors).length > 0) return;
    setSubmitError("");
    setSuccess("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setReviewing(false);
      return;
    }

    setBusy(true);
    try {
      const result = unwrapApiResponse(await resourceRequestsApi.create(requestInput()));
      const record = isApiRecord(result) ? result : null;
      const id = record && (typeof record.id === "string" || typeof record.id === "number")
        ? String(record.id)
        : "";
      setSuccess(id ? `Request ${id} was submitted.` : "Your request was submitted. Refresh request history to view it.");
      setForm(initialForm);
      setReviewing(false);
      if (id) navigate(`/team-lead/requests?requestId=${encodeURIComponent(id)}`, { replace: true });
    } catch (error) {
      setSubmitError(errorText(error, "The request could not be submitted."));
    } finally {
      setBusy(false);
    }
  }

  const reviewFields: { label: string; value: string }[] = [
    { label: "Resource", value: resources.find((item) => item.id === form.resourceId)?.name ?? "" },
    { label: "Item description", value: form.itemDescription },
    { label: "Batch number", value: form.batchNumber },
    { label: "Quantity", value: form.quantity },
    { label: "Expected duration (days)", value: form.expectedDurationDays },
    { label: "Team", value: teams.find((team) => String(team.id) === form.teamId)?.name ?? "" },
    { label: "Project", value: compatibleProjects.find((project) => String(project.id) === form.projectId)?.name ?? "" },
    { label: "Line Manager", value: form.lineManagerName },
  ];

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Submit a resource request"
        description="Choose a resource, team, and project from backend records. Projects are limited to those assigned to the selected team."
        supplementary={<Link to="/team-lead/requests">Request history</Link>}
      />
      {submitError && <ErrorMessage title="Request not submitted" message={submitError} />}
      {success && <p className={styles.notice} role="status">{success}</p>}
      {Object.entries(sourceErrors).map(([key, message]) => (
        <ErrorMessage
          key={key}
          title={`${sourceLabels[key as keyof typeof sourceLabels]} could not be loaded`}
          message={message ?? "The backend list could not be loaded."}
          onRetry={() => void loadSources()}
        />
      ))}
      {loadingSources ? (
        <LoadingState message="Loading resources, teams, projects, and active Line Managers..." />
      ) : (
        <form
          className={`rt-root ${formStyles.form}`}
          onSubmit={(event) => {
            if (!reviewing) {
              event.preventDefault();
              const errors = validate();
              setFieldErrors(errors);
              if (Object.keys(errors).length === 0) setReviewing(true);
            } else {
              void submitRequest(event);
            }
          }}
          noValidate
        >
          <section className={formStyles.card}>
            <div className={formStyles.sectionHeading}>
              <h2>{reviewing ? "Review request" : "Request details"}</h2>
            </div>
            {reviewing ? (
              <dl className={formStyles.reviewGrid}>
                {reviewFields.map(({ label, value }) => (
                  <div className={formStyles.reviewField} key={label}>
                    <dt className={formStyles.reviewLabel}>{label}</dt>
                    <dd className={formStyles.reviewValue}>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="request-resource">Available resource *</label>
                  <select id="request-resource" value={form.resourceId} onChange={(event) => updateField("resourceId", event.target.value)} aria-invalid={Boolean(fieldErrors.resourceId)} required>
                    <option value="">{resources.length ? "Select a resource" : "No available resources"}</option>
                    {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name} (available quantity: {resource.quantity})</option>)}
                  </select>
                  {fieldErrors.resourceId && <p className={formStyles.fieldError} role="alert">{fieldErrors.resourceId}</p>}
                </div>
                {([ ["itemDescription", "Item description"], ["batchNumber", "Batch number"] ] as const).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input id={`request-${field}`} value={form[field]} onChange={(event) => updateField(field, event.target.value)} aria-invalid={Boolean(fieldErrors[field])} required />
                    {fieldErrors[field] && <p className={formStyles.fieldError} role="alert">{fieldErrors[field]}</p>}
                  </div>
                ))}
                {([ ["quantity", "Quantity"], ["expectedDurationDays", "Expected duration (days)"] ] as const).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input id={`request-${field}`} type="number" min="1" step="1" value={form[field]} onChange={(event) => updateField(field, event.target.value)} aria-invalid={Boolean(fieldErrors[field])} required />
                    {fieldErrors[field] && <p className={formStyles.fieldError} role="alert">{fieldErrors[field]}</p>}
                  </div>
                ))}
                <div className={formStyles.field}>
                  <label htmlFor="request-team">Team *</label>
                  <select id="request-team" value={form.teamId} onChange={(event) => updateTeam(event.target.value)} aria-invalid={Boolean(fieldErrors.teamId)} required>
                    <option value="">{teams.length ? "Select a team" : "No teams available"}</option>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  {fieldErrors.teamId && <p className={formStyles.fieldError} role="alert">{fieldErrors.teamId}</p>}
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="request-project">Project *</label>
                  <select id="request-project" value={form.projectId} onChange={(event) => updateField("projectId", event.target.value)} aria-invalid={Boolean(fieldErrors.projectId)} disabled={!form.teamId} required>
                    <option value="">{!form.teamId ? "Select a team first" : compatibleProjects.length ? "Select a project" : "No projects assigned to this team"}</option>
                    {compatibleProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                  {fieldErrors.projectId && <p className={formStyles.fieldError} role="alert">{fieldErrors.projectId}</p>}
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="request-line-manager">Line Manager *</label>
                  <select id="request-line-manager" value={form.lineManagerName} onChange={(event) => updateField("lineManagerName", event.target.value)} aria-invalid={Boolean(fieldErrors.lineManagerName)} required>
                    <option value="">{lineManagers.length ? "Select a Line Manager" : "No active Line Managers"}</option>
                    {lineManagers.map((manager) => <option key={manager.id} value={manager.fullName}>{manager.fullName}</option>)}
                  </select>
                  {fieldErrors.lineManagerName && <p className={formStyles.fieldError} role="alert">{fieldErrors.lineManagerName}</p>}
                </div>
              </div>
            )}
            <div className={formStyles.actions}>
              <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={() => reviewing ? setReviewing(false) : navigate("/team-lead/dashboard")} disabled={busy}>
                {reviewing ? "Back to edit" : "Cancel"}
              </button>
              <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={busy || Object.keys(sourceErrors).length > 0 || resources.length === 0 || teams.length === 0 || lineManagers.length === 0}>
                {busy ? "Submitting..." : reviewing ? "Submit request" : "Review request"}
              </button>
            </div>
          </section>
        </form>
      )}
    </section>
  );
}
