import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import {
  formatApiValue,
  getApiRecords,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import { resourcesApi } from "../../data/api-services";
import styles from "./ResourceAllocationsPage.module.css";

type ResourceRecord = Record<string, unknown>;

interface AllocationRow extends ResourceRecord {
  resourceId: string;
  resourceName: string;
  resourceDepartment: unknown;
}

function getResourceId(resource: ResourceRecord): string | undefined {
  const id = resource.id ?? resource.resourceId;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function getResourceName(resource: ResourceRecord): string {
  const name = resource.name ?? resource.resourceName ?? resource.itemDescription;
  return typeof name === "string" ? name : "Unnamed resource";
}

function recordsFromResponse(response: unknown, label: string): ResourceRecord[] {
  const value = unwrapApiResponse(response);
  if (!Array.isArray(value)) {
    throw new Error(`The ${label} endpoint did not return its documented list response.`);
  }
  const records = getApiRecords(value);
  if (records.length !== value.length) {
    throw new Error(`The ${label} endpoint returned an item with an unexpected response shape.`);
  }
  return records;
}

function relatedName(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isApiRecord(value)) return "—";
  const name = value.fullName ?? value.name ?? value.email ?? value.id;
  return name === undefined ? "—" : String(name);
}

function assignedToLabel(allocation: AllocationRow): string {
  const assignee = relatedName(
    allocation.assignedTo ?? allocation.assignedToUser ?? allocation.user,
  );
  const team = relatedName(allocation.team);
  if (assignee !== "—" && team !== "—") return `${assignee} (${team})`;
  return assignee !== "—" ? assignee : team;
}

function allocationTimestamp(allocation: AllocationRow): number {
  const value = allocation.allocatedAt ?? allocation.allocationDate ?? allocation.createdAt;
  if (typeof value !== "string" && typeof value !== "number") return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function allocationDateLabel(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  return formatApiValue(value);
}

function getAllocationId(allocation: AllocationRow): string | undefined {
  const id = allocation.id ?? allocation.allocationId;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

export default function ResourceAllocationsPage() {
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAllocations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resources = recordsFromResponse(
        await resourcesApi.available(),
        "resources",
      );
      setResources(resources);
      const results = await Promise.all(resources.map(async (resource) => {
        const resourceId = getResourceId(resource);
        if (!resourceId) {
          throw new Error(`The resource "${getResourceName(resource)}" has no ID.`);
        }
        const resourceAllocations = recordsFromResponse(
          await resourcesApi.allocations(resourceId),
          `allocations for ${getResourceName(resource)}`,
        );
        return resourceAllocations.map((allocation) => ({
          ...allocation,
          resourceId,
          resourceName: getResourceName(resource),
          resourceDepartment: resource.departmentName ?? resource.department,
        }));
      }));
      setAllocations(results.flat().sort(
        (left, right) => allocationTimestamp(right) - allocationTimestamp(left),
      ));
    } catch (requestError) {
      setAllocations([]);
      setResources([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Recent allocations could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAllocations();
  }, [loadAllocations]);

  const columns = useMemo<DataTableColumn<AllocationRow>[]>(() => [
    {
      key: "resourceName",
      header: "Resource",
      render: (allocation) => (
        <span className={styles.resourceName}>
          <strong>{allocation.resourceName}</strong>
          <small>{getAllocationId(allocation) ? `Allocation ${getAllocationId(allocation)}` : "Allocation ID unavailable"}</small>
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: assignedToLabel,
    },
    {
      key: "department",
      header: "Department",
      render: (allocation) => {
        const team = isApiRecord(allocation.team) ? allocation.team : {};
        return formatApiValue(
          allocation.resourceDepartment ??
          allocation.departmentName ??
          allocation.department ??
          team.departmentName ??
          team.department,
        );
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (allocation) => formatApiValue(allocation.quantity),
    },
    {
      key: "allocatedAt",
      header: "Allocation Date",
      render: (allocation) => allocationDateLabel(
        allocation.allocatedAt ?? allocation.allocationDate ?? allocation.createdAt,
      ),
    },
    {
      key: "expectedReturnAt",
      header: "Expected Return",
      render: (allocation) => allocationDateLabel(allocation.expectedReturnAt),
    },
    {
      key: "status",
      header: "Status",
      render: (allocation) => (
        <StatusLabel
          status={typeof allocation.status === "string" ? allocation.status : undefined}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (allocation) => {
        const allocationId = getAllocationId(allocation);
        return allocationId ? (
          <Link
            className={`rt-root rt-btn rt-btn--outline ${styles.viewAction}`}
            to={`/line-manager/allocations/${encodeURIComponent(allocation.resourceId)}?allocationId=${encodeURIComponent(allocationId)}`}
          >
            View
          </Link>
        ) : (
          <span>View unavailable</span>
        );
      },
    },
  ], []);

  const resourceColumns = useMemo<DataTableColumn<ResourceRecord>[]>(() => [
    {
      key: "resourceName",
      header: "Resource",
      render: (resource) => (
        <span className={styles.resourceName}>
          <strong>{getResourceName(resource)}</strong>
          <small>{formatApiValue(resource.type)}</small>
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (resource) => formatApiValue(
        resource.departmentName ?? resource.department,
      ),
    },
    {
      key: "quantity",
      header: "Available / Total",
      render: (resource) => formatApiValue(
        resource.availableQuantity ?? resource.available ?? resource.quantity,
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (resource) => {
        const resourceId = getResourceId(resource);
        return resourceId ? (
          <Link
            className={`rt-root rt-btn rt-btn--outline ${styles.viewAction}`}
            to={`/line-manager/allocations/${encodeURIComponent(resourceId)}`}
          >
            View
          </Link>
        ) : (
          <span>View unavailable</span>
        );
      },
    },
  ], []);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Recent Allocations"
        description="Review recent resource allocations, assigned recipients, and current status."
        supplementary={
          <button
            type="button"
            className="rt-root rt-btn rt-btn--primary"
            disabled={loading}
            onClick={() => void loadAllocations()}
          >
            Refresh
          </button>
        }
      />
      {error ? (
        <ErrorMessage title="Recent allocations could not be loaded" message={error} onRetry={() => void loadAllocations()} />
      ) : loading ? (
        <LoadingState message="Loading recent allocations…" />
      ) : (
        <DataTable
          title={`Recent Allocations (${allocations.length})`}
          columns={columns}
          rows={allocations}
          rowKey={(allocation) => getAllocationId(allocation) ?? `${allocation.resourceId}-${allocation.resourceName}`}
          itemLabel="allocation"
          pageSize={10}
          showEmptyTable
          emptyTitle="No recent allocations"
          emptyDescription="There are no active allocations yet. Choose a resource below to review it and allocate inventory."
        />
      )}
      {!error && (
        <DataTable
          title={`Available Resources (${resources.length})`}
          columns={resourceColumns}
          rows={resources}
          rowKey={(resource, index) => getResourceId(resource) ?? index}
          itemLabel="resource"
          pageSize={10}
          showEmptyTable
          emptyTitle="No resources available"
          emptyDescription="The resources endpoint returned no inventory for this account."
        />
      )}
    </section>
  );
}
