import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { resourcesApi } from "../../data/api-services";
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
              Resource ID
              <input value={resourceId} onChange={(event) => setResourceId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Quantity
              <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Team ID
              <input type="number" min="1" step="1" value={teamId} onChange={(event) => setTeamId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Project ID
              <input type="number" min="1" step="1" value={projectId} onChange={(event) => setProjectId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Assigned user UUID
              <input value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Expected return
              <input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              Resource request UUID (optional)
              <input value={requestId} onChange={(event) => setRequestId(event.target.value)} />
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
          Resource ID
          <input value={resourceId} onChange={(event) => setResourceId(event.target.value)} />
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
            Allocation ID
            <input value={allocationId} onChange={(event) => setAllocationId(event.target.value)} required />
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
              Receiving team ID
              <input type="number" min="1" step="1" value={teamId} onChange={(event) => setTeamId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Receiving project ID
              <input type="number" min="1" step="1" value={projectId} onChange={(event) => setProjectId(event.target.value)} required />
            </label>
            <label className={styles.field}>
              Receiving user UUID
              <input value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)} required />
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
