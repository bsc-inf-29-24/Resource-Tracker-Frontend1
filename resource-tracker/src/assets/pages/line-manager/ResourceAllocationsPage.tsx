import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { resourcesApi, teamsApi, projectsApi, resourceRequestsApi } from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import type {
  CreateResourceAllocationInput,
  TransferResourceAllocationInput,
} from "../../data/api-services";
import ApiDataView from "../management/ApiDataView";
import styles from "../management/ApiManagementPage.module.css";

type ResourceData = {
  available?: unknown;
  allocations?: unknown;
  movements?: unknown;
};
type ResourceErrors = Partial<Record<keyof ResourceData, string>>;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function positiveInteger(value: string, label: string): number {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return Number(value);
}

function optionalDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export default function ResourceAllocationsPage() {
  const [data, setData] = useState<ResourceData>({});
  const [errors, setErrors] = useState<ResourceErrors>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [allocationId, setAllocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [requestId, setRequestId] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [resources, setResources] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const loadAvailable = useCallback(async () => {
    setLoading(true);
    setErrors((current) => ({ ...current, available: undefined }));
    try {
      const available = await resourcesApi.available();
      setData((current) => ({ ...current, available }));
    } catch (requestError) {
      setErrors((current) => ({
        ...current,
        available:
          requestError instanceof Error
            ? requestError.message
            : "Available resources could not be loaded.",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResourceHistory = useCallback(async () => {
    const id = resourceId.trim();
    if (!id) return;
    setErrors((current) => ({
      ...current,
      allocations: undefined,
      movements: undefined,
    }));
    const [allocationsResult, movementsResult] = await Promise.allSettled([
      resourcesApi.allocations(id),
      resourcesApi.movements(id),
    ]);
    setData((current) => ({
      ...current,
      ...(allocationsResult.status === "fulfilled"
        ? { allocations: allocationsResult.value }
        : {}),
      ...(movementsResult.status === "fulfilled"
        ? { movements: movementsResult.value }
        : {}),
    }));
    setErrors((current) => ({
      ...current,
      ...(allocationsResult.status === "rejected"
        ? {
            allocations:
              allocationsResult.reason instanceof Error
                ? allocationsResult.reason.message
                : "Allocations could not be loaded.",
          }
        : {}),
      ...(movementsResult.status === "rejected"
        ? {
            movements:
              movementsResult.reason instanceof Error
                ? movementsResult.reason.message
                : "Resource movements could not be loaded.",
          }
        : {}),
    }));
  }, [resourceId]);

  useEffect(() => {
    void loadAvailable();
  }, [loadAvailable]);

  useEffect(() => {
    let active = true;
    Promise.all([resourcesApi.available(), teamsApi.list(), projectsApi.list(), teamsApi.unassignedUsers(), resourceRequestsApi.list()])
      .then(([r, t, p, u, q]) => {
        if (!active) return;
        setResources(getApiRecords(r)); setTeams(getApiRecords(t)); setProjects(getApiRecords(p));
        setLeads(getApiRecords(u).filter((entry) => entry.role === "TEAM_LEAD")); setRequests(getApiRecords(q));
      })
      .catch((error) => { if (active) setOptionsError(error instanceof Error ? error.message : "Allocation options could not be loaded."); })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, []);

  const allocationOptions = getApiRecords(data.allocations);
  const select = (label: string, value: string, onChange: (value: string) => void, options: Record<string, unknown>[], required = true) => (
    <label className={styles.field}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={optionsLoading || Boolean(optionsError)}>
      <option value="">{optionsLoading ? "Loading options…" : `Select ${label.toLowerCase()}`}</option>
      {options.map((item, i) => { const id = item.id; const name = item.name ?? item.fullName; if (typeof id !== "string" && typeof id !== "number") return null; return <option key={`${id}-${i}`} value={String(id)}>{typeof name === "string" ? `${name} (${id})` : String(id)}</option>; })}
    </select></label>
  );

  async function allocate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors((current) => ({ ...current, allocations: undefined }));
    setNotice("");
    try {
      if (!resourceId.trim()) throw new Error("Enter a resource ID.");
      if (!isUuid(assignedToUserId.trim())) {
        throw new Error("Enter the assigned user's UUID.");
      }
      const input: CreateResourceAllocationInput = {
        quantity: positiveInteger(quantity, "Quantity"),
        teamId: positiveInteger(teamId, "Team ID"),
        projectId: positiveInteger(projectId, "Project ID"),
        assignedToUserId: assignedToUserId.trim(),
        ...(expectedReturnAt
          ? { expectedReturnAt: optionalDate(expectedReturnAt) }
          : {}),
        ...(requestId.trim() ? { requestId: requestId.trim() } : {}),
      };
      if (requestId.trim() && !isUuid(requestId.trim())) {
        throw new Error("Resource request ID must be a UUID.");
      }
      await resourcesApi.allocate(resourceId.trim(), input);
      setNotice("Resource allocation created.");
      await Promise.all([loadAvailable(), loadResourceHistory()]);
    } catch (operationError) {
      setErrors((current) => ({
        ...current,
        allocations:
          operationError instanceof Error
            ? operationError.message
            : "The resource allocation could not be created.",
      }));
    } finally {
      setBusy(false);
    }
  }

  async function returnAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors((current) => ({ ...current, allocations: undefined }));
    setNotice("");
    try {
      if (!allocationId.trim()) throw new Error("Enter an allocation ID.");
      await resourcesApi.returnAllocation(allocationId.trim(), returnNote.trim());
      setNotice("Resource return recorded.");
      await Promise.all([loadAvailable(), loadResourceHistory()]);
    } catch (operationError) {
      setErrors((current) => ({
        ...current,
        allocations:
          operationError instanceof Error
            ? operationError.message
            : "The resource return could not be recorded.",
      }));
    } finally {
      setBusy(false);
    }
  }

  async function transferAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors((current) => ({ ...current, allocations: undefined }));
    setNotice("");
    try {
      if (!allocationId.trim()) throw new Error("Enter an allocation ID.");
      if (!isUuid(assignedToUserId.trim())) {
        throw new Error("Enter the receiving user's UUID.");
      }
      const input: TransferResourceAllocationInput = {
        teamId: positiveInteger(teamId, "Team ID"),
        projectId: positiveInteger(projectId, "Project ID"),
        assignedToUserId: assignedToUserId.trim(),
        ...(expectedReturnAt
          ? { expectedReturnAt: optionalDate(expectedReturnAt) }
          : {}),
        ...(transferNote.trim() ? { note: transferNote.trim() } : {}),
      };
      await resourcesApi.transferAllocation(allocationId.trim(), input);
      setNotice("Resource allocation transferred.");
      await Promise.all([loadAvailable(), loadResourceHistory()]);
    } catch (operationError) {
      setErrors((current) => ({
        ...current,
        allocations:
          operationError instanceof Error
            ? operationError.message
            : "The resource allocation could not be transferred.",
      }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Resource Allocations"
        description="Manage available inventory and allocations using the documented Line Manager endpoints."
      />
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {optionsError && <ErrorMessage title="Dropdown options could not be loaded" message={optionsError} />}
      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.panelHeading}>
          <h2>Available resources</h2>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={loading}
            onClick={() => void loadAvailable()}
          >
            Refresh
          </button>
        </div>
        {errors.available ? (
          <ErrorMessage
            title="Available resources could not be loaded"
            message={errors.available}
            onRetry={() => void loadAvailable()}
          />
        ) : loading ? (
          <LoadingState message="Loading available resources..." />
        ) : (
          <ApiDataView
            data={data.available}
            emptyTitle="No available resources"
            emptyDescription="The backend returned no available resources."
          />
        )}
      </section>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Allocate a resource</h2>
        {errors.allocations && (
          <ErrorMessage title="Allocation operation failed" message={errors.allocations} />
        )}
        <form className={styles.form} onSubmit={(event) => void allocate(event)}>
          <div className={styles.grid}>
            <label className={styles.field}>
              {select("Resource", resourceId, setResourceId, resources)}
            </label>
            <label className={styles.field}>
              Quantity
              <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            <label className={styles.field}>
              {select("Team", teamId, setTeamId, teams)}
            </label>
            <label className={styles.field}>
              {select("Project", projectId, setProjectId, projects)}
            </label>
            <label className={styles.field}>
              {select("Team Lead", assignedToUserId, setAssignedToUserId, leads)}
            </label>
            <label className={styles.field}>
              Expected return
              <input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              {select("Resource request (optional)", requestId, setRequestId, requests, false)}
            </label>
          </div>
          <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={busy}>
            {busy ? "Allocating..." : "Allocate resource"}
          </button>
        </form>
      </section>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Active allocations and movement history</h2>
        <label className={styles.field}>
          {select("Resource", resourceId, setResourceId, resources)}
        </label>
        <button
          type="button"
          className="rt-root rt-btn rt-btn--outline"
          disabled={busy || !resourceId.trim()}
          onClick={() => void loadResourceHistory()}
        >
          Load resource history
        </button>
        {data.allocations !== undefined && (
          <>
            <h3>Active allocations</h3>
            {errors.allocations ? (
              <ErrorMessage title="Allocations unavailable" message={errors.allocations} />
            ) : (
              <ApiDataView data={data.allocations} emptyTitle="No active allocations" />
            )}
          </>
        )}
        {data.movements !== undefined && (
          <>
            <h3>Movement history</h3>
            {errors.movements ? (
              <ErrorMessage title="Movement history unavailable" message={errors.movements} />
            ) : (
              <ApiDataView data={data.movements} emptyTitle="No movement history" />
            )}
          </>
        )}
      </section>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Return or transfer an allocation</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <label className={styles.field}>Allocation ID<select value={allocationId} onChange={(event) => setAllocationId(event.target.value)} required><option value="">Select allocation</option>{allocationOptions.map((item, i) => <option key={String(item.id ?? i)} value={String(item.id ?? "")}>{String(item.resourceName ?? item.name ?? "Allocation")} — {String(item.id ?? "")}</option>)}</select></label>
          </label>
          <label className={styles.field}>
            Return note
            <input value={returnNote} onChange={(event) => setReturnNote(event.target.value)} />
          </label>
        </div>
        <form className={styles.actions} onSubmit={(event) => void returnAllocation(event)}>
          <button type="submit" className="rt-root rt-btn rt-btn--outline" disabled={busy || !allocationId.trim()}>
            Return allocation
          </button>
        </form>
        <form className={styles.form} onSubmit={(event) => void transferAllocation(event)}>
          <div className={styles.grid}>
            <label className={styles.field}>
              {select("Receiving team", teamId, setTeamId, teams)}
            </label>
            <label className={styles.field}>
              {select("Receiving project", projectId, setProjectId, projects)}
            </label>
            <label className={styles.field}>
              {select("Receiving Team Lead", assignedToUserId, setAssignedToUserId, leads)}
            </label>
            <label className={styles.field}>
              Expected return
              <input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              Transfer note
              <input value={transferNote} onChange={(event) => setTransferNote(event.target.value)} />
            </label>
          </div>
          <button type="submit" className="rt-root rt-btn rt-btn--outline" disabled={busy || !allocationId.trim()}>
            Transfer allocation
          </button>
        </form>
      </section>
    </section>
  );
}
