import { mockUsers } from "../data/mock-data";
import type { RequestStatus, ResourceRequest } from "../types/resource-request";

export type DepartmentFilters = {
  project?: string;
  team?: string;
  status?: RequestStatus | "All";
  startDate?: string;
  endDate?: string;
};

export function getCurrentDepartmentManager() {
  return (
    mockUsers.find(
      (user) => user.role === "department-manager" && (user.isActive ?? true)
    ) ?? mockUsers.find((user) => user.role === "department-manager")
  );
}

export function getDepartmentRequests(
  requests: ResourceRequest[],
  department = getCurrentDepartmentManager()?.department ?? "Data Science"
): ResourceRequest[] {
  return requests.filter((request) => request.department === department);
}

export function getStatusCounts(requests: ResourceRequest[]) {
  const counts: Record<RequestStatus, number> = {
    Submitted: 0,
    Pending: 0,
    Queried: 0,
    Approved: 0,
    Rejected: 0,
  };

  for (const request of requests) {
    counts[request.status] += 1;
  }

  return counts;
}

export function getRequestedAmount(requests: ResourceRequest[]) {
  return requests.reduce((total, request) => {
    const amount = Number(request.estimatedPrice);
    return total + (Number.isFinite(amount) && amount >= 0 ? amount : 0);
  }, 0);
}

export function getApprovedAmount(requests: ResourceRequest[]) {
  return requests
    .filter((request) => request.status === "Approved")
    .reduce((total, request) => {
      const amount = Number(request.estimatedPrice);
      return total + (Number.isFinite(amount) && amount >= 0 ? amount : 0);
    }, 0);
}

export function getSpentDifference(requests: ResourceRequest[]) {
  return getRequestedAmount(requests) - getApprovedAmount(requests);
}

export function getProjectTotals(requests: ResourceRequest[]) {
  return Array.from(
    requests.reduce((map, request) => {
      const existing = map.get(request.project) ?? 0;
      map.set(request.project, existing + getSafeAmount(request.estimatedPrice));
      return map;
    }, new Map<string, number>())
  )
    .map(([project, amount]) => ({ project, amount }))
    .sort((left, right) => right.amount - left.amount);
}

export function applyDepartmentFilters(
  requests: ResourceRequest[],
  filters: DepartmentFilters = {}
): ResourceRequest[] {
  const { project = "All", team = "All", status = "All", startDate, endDate } = filters;

  return requests.filter((request) => {
    const submitted = request.submittedAt ? new Date(request.submittedAt) : null;
    const inDateRange =
      (!startDate || !submitted || submitted >= new Date(startDate)) &&
      (!endDate || !submitted || submitted <= new Date(`${endDate}T23:59:59`));

    return (
      (project === "All" || request.project === project) &&
      (team === "All" || request.team === team) &&
      (status === "All" || request.status === status) &&
      inDateRange
    );
  });
}

function getSafeAmount(value: number | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function getRecentRequests(
  requests: ResourceRequest[],
  limit = 5
): ResourceRequest[] {
  return [...requests]
    .filter((request) => !!request.submittedAt)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    )
    .slice(0, limit);
}
