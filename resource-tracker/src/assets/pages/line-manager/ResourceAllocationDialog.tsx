import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { projectsApi, resourceRequestsApi, resourcesApi, teamsApi, type CreateResourceAllocationInput } from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import styles from "./ResourceAllocationDialog.module.css";

type RecordValue = Record<string, unknown>;

interface ResourceAllocationDialogProps {
  open: boolean;
  resourceId: string;
  resourceName: string;
  onClose: () => void;
  onAllocated: () => void;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function positiveInteger(value: string, label: string) {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return Number(value);
}

function optionId(record: RecordValue): string | undefined {
  const id = record.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function optionLabel(record: RecordValue): string {
  const name = record.name ?? record.fullName ?? record.email;
  return typeof name === "string" ? name : optionId(record) ?? "Unnamed";
}

export default function ResourceAllocationDialog({
  open,
  resourceId,
  resourceName,
  onClose,
  onAllocated,
}: ResourceAllocationDialogProps) {
  const [teams, setTeams] = useState<RecordValue[]>([]);
  const [projects, setProjects] = useState<RecordValue[]>([]);
  const [leads, setLeads] = useState<RecordValue[]>([]);
  const [requests, setRequests] = useState<RecordValue[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setQuantity("");
    setTeamId("");
    setProjectId("");
    setAssignedToUserId("");
    setExpectedReturnAt("");
    setRequestId("");
    setError("");
    setOptionsLoading(true);
    setOptionsError("");
    Promise.all([
      teamsApi.list(),
      projectsApi.list(),
      teamsApi.unassignedUsers(),
      resourceRequestsApi.list(),
    ])
      .then(([teamResponse, projectResponse, leadResponse, requestResponse]) => {
        if (!active) return;
        setTeams(getApiRecords(teamResponse));
        setProjects(getApiRecords(projectResponse));
        setLeads(getApiRecords(leadResponse).filter((record) => record.role === "TEAM_LEAD"));
        setRequests(getApiRecords(requestResponse));
      })
      .catch((requestError: unknown) => {
        if (active) {
          setOptionsError(
            requestError instanceof Error
              ? requestError.message
              : "Allocation options could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!resourceId.trim()) throw new Error("The resource ID is missing.");
      if (!isUuid(assignedToUserId)) {
        throw new Error("Select a valid Team Lead.");
      }
      const input: CreateResourceAllocationInput = {
        quantity: positiveInteger(quantity, "Quantity"),
        teamId: positiveInteger(teamId, "Team"),
        projectId: positiveInteger(projectId, "Project"),
        assignedToUserId,
        ...(expectedReturnAt
          ? { expectedReturnAt: new Date(expectedReturnAt).toISOString() }
          : {}),
        ...(requestId ? { requestId } : {}),
      };
      await resourcesApi.allocate(resourceId, input);
      onAllocated();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The resource allocation could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="allocation-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) onClose();
        }}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Resource allocation</p>
            <h2 id="allocation-dialog-title">Allocate {resourceName}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Close allocation form">
            ×
          </button>
        </header>
        {optionsError && <ErrorMessage title="Allocation options could not be loaded" message={optionsError} />}
        {error && <ErrorMessage title="Allocation failed" message={error} />}
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <label>
            Quantity
            <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </label>
          <label>
            Team
            <select value={teamId} onChange={(event) => setTeamId(event.target.value)} required disabled={optionsLoading || Boolean(optionsError)}>
              <option value="">{optionsLoading ? "Loading teams…" : "Select team"}</option>
              {teams.map((record, index) => {
                const id = optionId(record);
                return id ? <option value={id} key={`${id}-${index}`}>{optionLabel(record)}</option> : null;
              })}
            </select>
          </label>
          <label>
            Project
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} required disabled={optionsLoading || Boolean(optionsError)}>
              <option value="">{optionsLoading ? "Loading projects…" : "Select project"}</option>
              {projects.map((record, index) => {
                const id = optionId(record);
                return id ? <option value={id} key={`${id}-${index}`}>{optionLabel(record)}</option> : null;
              })}
            </select>
          </label>
          <label>
            Team Lead
            <select value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)} required disabled={optionsLoading || Boolean(optionsError)}>
              <option value="">{optionsLoading ? "Loading Team Leads…" : "Select Team Lead"}</option>
              {leads.map((record, index) => {
                const id = optionId(record);
                return id ? <option value={id} key={`${id}-${index}`}>{optionLabel(record)}</option> : null;
              })}
            </select>
          </label>
          <label>
            Expected return
            <input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} />
          </label>
          <label>
            Related request <span className={styles.optional}>(optional)</span>
            <select value={requestId} onChange={(event) => setRequestId(event.target.value)} disabled={optionsLoading || Boolean(optionsError)}>
              <option value="">No linked request</option>
              {requests.map((record, index) => {
                const id = optionId(record);
                return id ? <option value={id} key={`${id}-${index}`}>{`${String(record.itemDescription ?? "Request")} (${id})`}</option> : null;
              })}
            </select>
          </label>
          <div className={styles.actions}>
            <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={busy || optionsLoading || Boolean(optionsError)}>
              {busy ? "Allocating…" : "Allocate resource"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
