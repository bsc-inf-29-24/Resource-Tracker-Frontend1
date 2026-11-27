import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { DataTableColumn } from "../../components/tables/type";
import DataTable from "../../components/tables/DataTable";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  formatApiValue,
  getApiRecords,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import {
  projectsApi,
  resourcesApi,
  teamsApi,
  type TransferResourceAllocationInput,
} from "../../data/api-services";
import ApiDataView from "../management/ApiDataView";
import ResourceAllocationDialog from "./ResourceAllocationDialog";
import styles from "./ResourceAllocationDetailsPage.module.css";

type RecordValue = Record<string, unknown>;
type MovementAction = "return" | "transfer" | "edit";

function recordId(record: RecordValue): string | undefined {
  const id = record.id ?? record.allocationId;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function recordLabel(record: RecordValue): string {
  const value = record.name ?? record.fullName ?? record.email;
  return typeof value === "string" ? value : recordId(record) ?? "Unnamed";
}

function relatedId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isApiRecord(value)) return "";
  const id = value.id ?? value.userId ?? value.teamId ?? value.projectId;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

function toDateTimeLocal(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function positiveInteger(value: string, label: string) {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return Number(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function ResourceAllocationDetailsPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const requestedAllocationId = searchParams.get("allocationId") ?? "";
  const [resource, setResource] = useState<unknown>();
  const [allocations, setAllocations] = useState<RecordValue[]>([]);
  const [movements, setMovements] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [resourceError, setResourceError] = useState("");
  const [allocationsError, setAllocationsError] = useState("");
  const [movementsError, setMovementsError] = useState("");
  const [selectedAllocationId, setSelectedAllocationId] = useState("");
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [movementAction, setMovementAction] = useState<MovementAction | null>(null);
  const [movementError, setMovementError] = useState("");
  const [movementBusy, setMovementBusy] = useState(false);
  const [note, setNote] = useState("");
  const [teams, setTeams] = useState<RecordValue[]>([]);
  const [projects, setProjects] = useState<RecordValue[]>([]);
  const [leads, setLeads] = useState<RecordValue[]>([]);
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!id) {
      setResourceError("A resource ID was not provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setResourceError("");
    setAllocationsError("");
    setMovementsError("");
    const [resourceResult, allocationsResult, movementsResult] = await Promise.allSettled([
      resourcesApi.get(id),
      resourcesApi.allocations(id),
      resourcesApi.movements(id),
    ]);

    if (resourceResult.status === "fulfilled") {
      const value = unwrapApiResponse(resourceResult.value);
      if (!isApiRecord(value)) {
        setResource(undefined);
        setResourceError("The resource endpoint returned an unexpected response shape.");
      } else {
        setResource(value);
      }
    } else {
      setResource(undefined);
      setResourceError(
        resourceResult.reason instanceof Error
          ? resourceResult.reason.message
          : "Resource details could not be loaded.",
      );
    }

    if (allocationsResult.status === "fulfilled") {
      const value = unwrapApiResponse(allocationsResult.value);
      if (!Array.isArray(value) || getApiRecords(value).length !== value.length) {
        setAllocations([]);
        setAllocationsError("The allocations endpoint returned an unexpected list response.");
      } else {
        const records = getApiRecords(value);
        setAllocations(records);
        setSelectedAllocationId((current) => {
          if (requestedAllocationId) {
            return records.some((record) => recordId(record) === requestedAllocationId)
              ? requestedAllocationId
              : "";
          }
          return records.some((record) => recordId(record) === current)
            ? current
            : recordId(records[0] ?? {}) ?? "";
        });
      }
    } else {
      setAllocations([]);
      setAllocationsError(
        allocationsResult.reason instanceof Error
          ? allocationsResult.reason.message
          : "Allocations could not be loaded.",
      );
    }

    if (movementsResult.status === "fulfilled") {
      setMovements(movementsResult.value);
    } else {
      setMovements(undefined);
      setMovementsError(
        movementsResult.reason instanceof Error
          ? movementsResult.reason.message
          : "Resource movement history could not be loaded.",
      );
    }
    setLoading(false);
  }, [id, requestedAllocationId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const selectedAllocation = allocations.find(
    (record) => recordId(record) === selectedAllocationId,
  );
  const resourceName = isApiRecord(resource)
    ? String(resource.name ?? resource.resourceName ?? resource.itemDescription ?? "Resource")
    : "Resource";

  const allocationColumns = useMemo<DataTableColumn<RecordValue>[]>(() => [
    { key: "id", header: "Allocation ID", render: (record) => recordId(record) ?? "Unavailable" },
    {
      key: "assignedTo",
      header: "Assigned to",
      render: (record) => formatApiValue(record.assignedTo ?? record.assignedToUser ?? record.user),
    },
    { key: "quantity", header: "Quantity", render: (record) => formatApiValue(record.quantity) },
    { key: "team", header: "Team", render: (record) => formatApiValue(record.team) },
    { key: "project", header: "Project", render: (record) => formatApiValue(record.project) },
    {
      key: "expectedReturnAt",
      header: "Expected return",
      render: (record) => formatApiValue(record.expectedReturnAt),
    },
    {
      key: "select",
      header: "Action",
      render: (record) => {
        const allocationId = recordId(record);
        return allocationId ? (
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            aria-pressed={selectedAllocationId === allocationId}
            onClick={() => setSelectedAllocationId(allocationId)}
          >
            {selectedAllocationId === allocationId ? "Selected" : "Select"}
          </button>
        ) : "Unavailable";
      },
    },
  ], [selectedAllocationId]);

  async function openMovement(action: MovementAction) {
    setMovementError("");
    setNote("");
    const editing = action === "edit";
    setTeamId(editing ? relatedId(selectedAllocation?.teamId ?? selectedAllocation?.team) : "");
    setProjectId(editing ? relatedId(selectedAllocation?.projectId ?? selectedAllocation?.project) : "");
    const currentAssignee =
      selectedAllocation?.assignedTo ??
      selectedAllocation?.assignedToUser ??
      selectedAllocation?.user;
    setAssignedToUserId(editing
      ? relatedId(selectedAllocation?.assignedToUserId ?? currentAssignee)
      : "");
    setExpectedReturnAt(editing ? toDateTimeLocal(selectedAllocation?.expectedReturnAt) : "");
    setMovementAction(action);
    if (action === "return") return;
    setOptionsLoading(true);
    try {
      const [teamResponse, projectResponse, leadResponse] = await Promise.all([
        teamsApi.list(),
        projectsApi.list(),
        teamsApi.unassignedUsers(),
      ]);
      const availableTeams = getApiRecords(teamResponse);
      const availableProjects = getApiRecords(projectResponse);
      const availableLeads = getApiRecords(leadResponse)
        .filter((record) => record.role === "TEAM_LEAD");
      if (editing) {
        const selectedTeam = selectedAllocation?.team;
        const currentTeamId = relatedId(selectedAllocation?.teamId ?? selectedTeam);
        if (currentTeamId && !availableTeams.some((record) => recordId(record) === currentTeamId)) {
          availableTeams.push(isApiRecord(selectedTeam)
            ? selectedTeam
            : { id: currentTeamId, name: currentTeamId });
        }
        const selectedProject = selectedAllocation?.project;
        const currentProjectId = relatedId(selectedAllocation?.projectId ?? selectedProject);
        if (currentProjectId && !availableProjects.some((record) => recordId(record) === currentProjectId)) {
          availableProjects.push(isApiRecord(selectedProject)
            ? selectedProject
            : { id: currentProjectId, name: currentProjectId });
        }
        const currentAssigneeId = relatedId(
          selectedAllocation?.assignedToUserId ?? currentAssignee,
        );
        if (currentAssigneeId && !availableLeads.some((record) => recordId(record) === currentAssigneeId)) {
          availableLeads.push(isApiRecord(currentAssignee)
            ? currentAssignee
            : { id: currentAssigneeId, fullName: currentAssigneeId });
        }
      }
      setTeams(availableTeams);
      setProjects(availableProjects);
      setLeads(availableLeads);
    } catch (requestError) {
      setMovementError(
        requestError instanceof Error
          ? requestError.message
          : "Allocation options could not be loaded.",
      );
    } finally {
      setOptionsLoading(false);
    }
  }

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAllocationId || !movementAction) return;
    setMovementBusy(true);
    setMovementError("");
    try {
      if (movementAction === "return") {
        await resourcesApi.returnAllocation(selectedAllocationId, note.trim());
      } else {
        if (!isUuid(assignedToUserId)) throw new Error("Select a valid Team Lead.");
        const input: TransferResourceAllocationInput = {
          teamId: positiveInteger(teamId, "Team"),
          projectId: positiveInteger(projectId, "Project"),
          assignedToUserId,
          ...(expectedReturnAt
            ? { expectedReturnAt: new Date(expectedReturnAt).toISOString() }
            : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        };
        await resourcesApi.transferAllocation(selectedAllocationId, input);
      }
      setMovementAction(null);
      await loadDetails();
    } catch (requestError) {
      setMovementError(
        requestError instanceof Error
          ? requestError.message
          : `The allocation could not be ${movementAction === "return" ? "returned" : movementAction === "edit" ? "updated" : "transferred"}.`,
      );
    } finally {
      setMovementBusy(false);
    }
  }

  const optionSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: RecordValue[],
  ) => (
    <label className={styles.field}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required disabled={optionsLoading || Boolean(movementError)}>
        <option value="">{optionsLoading ? "Loading…" : `Select ${label.toLowerCase()}`}</option>
        {options.map((record, index) => {
          const optionValue = recordId(record);
          return optionValue ? <option value={optionValue} key={`${optionValue}-${index}`}>{recordLabel(record)}</option> : null;
        })}
      </select>
    </label>
  );

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title={resourceName} description="Resource details, current allocations, and movement history." />
      {loading ? (
        <LoadingState message="Loading resource details…" />
      ) : resourceError ? (
        <ErrorMessage title="Resource details could not be loaded" message={resourceError} onRetry={() => void loadDetails()} />
      ) : (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>Resource details</h2>
          <ApiDataView data={resource} fieldIcons />
        </section>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.sectionHeading}>
          <h2>Current allocations</h2>
          <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={loading} onClick={() => void loadDetails()}>Refresh</button>
        </div>
        {allocationsError ? (
          <ErrorMessage title="Allocations could not be loaded" message={allocationsError} onRetry={() => void loadDetails()} />
        ) : loading ? (
          <LoadingState message="Loading allocations…" />
        ) : (
          <DataTable
            columns={allocationColumns}
            rows={allocations}
            rowKey={(record, index) => recordId(record) ?? index}
            itemLabel="allocation"
            emptyTitle="No current allocations"
            emptyDescription="No allocations were returned for this resource."
          />
        )}
      </section>

      {selectedAllocation && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <div className={styles.sectionHeading}>
            <h2>Allocation details</h2>
            <span>Allocation {selectedAllocationId}</span>
          </div>
          <ApiDataView data={selectedAllocation} fieldIcons />
          <div className={styles.allocationActions}>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--primary"
              disabled={movementBusy}
              onClick={() => void openMovement("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--primary"
              disabled={movementBusy}
              onClick={() => void openMovement("transfer")}
            >
              Transfer
            </button>
          </div>
        </section>
      )}

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Movement history</h2>
        {movementsError ? (
          <ErrorMessage title="Movement history could not be loaded" message={movementsError} onRetry={() => void loadDetails()} />
        ) : movements === undefined ? (
          <LoadingState message="Loading movement history…" />
        ) : (
          <ApiDataView data={movements} emptyTitle="No movement history" />
        )}
      </section>

      <footer className={styles.footerActions}>
        <button
          type="button"
          className="rt-root rt-btn rt-btn--primary"
          disabled={loading || Boolean(resourceError)}
          onClick={() => setAllocationDialogOpen(true)}
        >
          Allocate resource
        </button>
        <div className={styles.secondaryActions}>
          <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={!selectedAllocation || movementBusy} onClick={() => void openMovement("return")}>Return allocation</button>
        </div>
      </footer>

      <ResourceAllocationDialog
        open={allocationDialogOpen}
        resourceId={id}
        resourceName={resourceName}
        onClose={() => setAllocationDialogOpen(false)}
        onAllocated={() => void loadDetails()}
      />

      {movementAction && (
        <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !movementBusy) setMovementAction(null);
        }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="allocation-movement-title">
            <h2 id="allocation-movement-title">
              {movementAction === "return"
                ? "Return allocation"
                : movementAction === "edit"
                  ? "Edit allocation"
                  : "Transfer allocation"}
            </h2>
            <p>Allocation {selectedAllocationId}</p>
            {movementError && <ErrorMessage title="Allocation action failed" message={movementError} />}
            <form className={styles.form} onSubmit={(event) => void submitMovement(event)}>
              {movementAction !== "return" && (
                <>
                  {optionSelect(movementAction === "edit" ? "Team" : "Receiving team", teamId, setTeamId, teams)}
                  {optionSelect(movementAction === "edit" ? "Project" : "Receiving project", projectId, setProjectId, projects)}
                  {optionSelect(movementAction === "edit" ? "Assigned Team Lead" : "Receiving Team Lead", assignedToUserId, setAssignedToUserId, leads)}
                  <label className={styles.field}>Expected return<input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} /></label>
                </>
              )}
              <label className={styles.field}>
                {movementAction === "return" ? "Return note" : movementAction === "edit" ? "Update note" : "Transfer note"}
                <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <div className={styles.dialogActions}>
                <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={movementBusy} onClick={() => setMovementAction(null)}>Cancel</button>
                <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={movementBusy || optionsLoading || (movementAction !== "return" && Boolean(movementError))}>
                  {movementBusy
                    ? "Saving…"
                    : movementAction === "return"
                      ? "Confirm return"
                      : movementAction === "edit"
                        ? "Save changes"
                        : "Confirm transfer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
