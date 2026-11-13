import { apiRequest } from "./api-client";

export type AssignableUserRole =
  | "team_lead"
  | "line_manager"
  | "department_head"
  | "managing_director"
  | "team_member";

export const assignableUserRoles: {
  value: AssignableUserRole;
  label: string;
}[] = [
  { value: "team_lead", label: "Team Lead" },
  { value: "line_manager", label: "Line Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "managing_director", label: "Managing Director" },
  { value: "team_member", label: "Team Member" },
];

export interface CreateUserInput {
  fullName: string;
  email: string;
  role: AssignableUserRole;
  initialPassword: string;
}

export interface DepartmentInput {
  name?: string;
  code?: string;
  description?: string;
}

export interface TeamInput {
  name?: string;
  description?: string;
  departmentId?: number;
}

export interface ProjectInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  teamIds?: number[];
}

export interface ResourceInput {
  name?: string;
  type?: "insourced" | "outsourced";
  description?: string;
  departmentName?: number;
  price?: number;
  label?: string;
  vendor?: string;
  quantity?: number;
  batchNumber?: string;
}

export type ApiRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "QUERIED"
  | "APPROVED"
  | "REJECTED";

export interface CreateResourceRequestInput {
  itemDescription: string;
  manufacturerLabel: string;
  price: number;
  batchNumber: string;
  vendor: string;
  quantity: number;
  projectId: string;
  lineManagerId: string;
  teamId: string;
  departmentId: string;
}

export interface UpdateResourceRequestInput {
  itemDescription?: string;
  manufacturerLabel?: string;
  price?: number;
  batchNumber?: string;
  vendor?: string;
  quantity?: number;
  projectId?: string;
  lineManagerId?: string;
  teamId?: string;
  departmentId?: string;
  status?: Exclude<ApiRequestStatus, "DRAFT">;
  note?: string;
}

export interface CreateResourceAllocationInput {
  quantity: number;
  teamId: number;
  projectId: number;
  assignedToUserId: string;
  expectedReturnAt?: string;
  requestId?: string;
}

export interface TransferResourceAllocationInput {
  teamId: number;
  projectId: number;
  assignedToUserId: string;
  expectedReturnAt?: string;
  note?: string;
}

function withQuery(
  path: string,
  values: Record<string, string | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export const usersApi = {
  list: () => apiRequest<unknown>("/api/v1/users"),
  create: (input: CreateUserInput) =>
    apiRequest<void>(
      "/api/v1/users",
      { method: "POST", body: JSON.stringify(input) },
    ),
  setRole: (id: string, role: AssignableUserRole) =>
    apiRequest<unknown>(`/api/v1/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  deactivate: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/users/${encodeURIComponent(id)}/deactivate`,
      { method: "PATCH" },
    ),
  reactivate: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/users/${encodeURIComponent(id)}/reactivate`,
      { method: "PATCH" },
    ),
};

export const departmentsApi = {
  list: () => apiRequest<unknown>("/api/v1/departments"),
  get: (id: string) =>
    apiRequest<unknown>(`/api/v1/departments/${encodeURIComponent(id)}`),
  create: (input: DepartmentInput) =>
    apiRequest<unknown>("/api/v1/departments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: DepartmentInput) =>
    apiRequest<unknown>(`/api/v1/departments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<unknown>(`/api/v1/departments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  users: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/users`,
    ),
  teams: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/teams`,
    ),
  projects: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/projects`,
    ),
  requests: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/resource-requests`,
    ),
  assignHead: (id: string, userId: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/assign-head/${encodeURIComponent(userId)}`,
      { method: "PATCH" },
    ),
};

export const teamsApi = {
  list: () => apiRequest<unknown>("/api/v1/teams"),
  get: (id: string) =>
    apiRequest<unknown>(`/api/v1/teams/${encodeURIComponent(id)}`),
  create: (input: TeamInput) =>
    apiRequest<unknown>("/api/v1/teams", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: TeamInput) =>
    apiRequest<unknown>(`/api/v1/teams/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<unknown>(`/api/v1/teams/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  users: (id: string) =>
    apiRequest<unknown>(`/api/v1/teams/${encodeURIComponent(id)}/users`),
  projects: (id: string) =>
    apiRequest<unknown>(`/api/v1/teams/${encodeURIComponent(id)}/projects`),
  requests: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/teams/${encodeURIComponent(id)}/resource-requests`,
    ),
  assignLead: (id: string, userId: string) =>
    apiRequest<unknown>(
      `/api/v1/teams/${encodeURIComponent(id)}/team-lead`,
      { method: "PATCH", body: JSON.stringify({ userId }) },
    ),
};

export const projectsApi = {
  list: () => apiRequest<unknown>("/api/v1/projects"),
  get: (id: string) =>
    apiRequest<unknown>(`/api/v1/projects/${encodeURIComponent(id)}`),
  byDepartment: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/projects/department/${encodeURIComponent(id)}`,
    ),
  create: (input: ProjectInput) =>
    apiRequest<unknown>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: ProjectInput) =>
    apiRequest<unknown>(`/api/v1/projects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<unknown>(`/api/v1/projects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  assignTeams: (id: string, teamIds: number[]) =>
    apiRequest<unknown>(
      `/api/v1/projects/${encodeURIComponent(id)}/teams`,
      { method: "PATCH", body: JSON.stringify({ teamIds }) },
    ),
  teamMembers: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/projects/${encodeURIComponent(id)}/team-members`,
    ),
};

export const resourcesApi = {
  list: (name?: string, type?: string) =>
    apiRequest<unknown>(
      withQuery("/api/v1/resources", { name, type }),
    ),
  get: (id: string) =>
    apiRequest<unknown>(`/api/v1/resources/${encodeURIComponent(id)}`),
  create: (input: ResourceInput) =>
    apiRequest<unknown>("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: ResourceInput) =>
    apiRequest<unknown>(`/api/v1/resources/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  available: () => apiRequest<unknown>("/api/v1/resources/available"),
  allocate: (id: string, input: CreateResourceAllocationInput) =>
    apiRequest<unknown>(
      `/api/v1/resources/${encodeURIComponent(id)}/allocations`,
      { method: "POST", body: JSON.stringify(input) },
    ),
  allocations: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/resources/${encodeURIComponent(id)}/allocations`,
    ),
  movements: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/resources/${encodeURIComponent(id)}/movements`,
    ),
  returnAllocation: (id: string, note?: string) =>
    apiRequest<unknown>(
      `/api/v1/resources/allocations/${encodeURIComponent(id)}/return`,
      { method: "PATCH", body: JSON.stringify(note ? { note } : {}) },
    ),
  transferAllocation: (
    id: string,
    input: TransferResourceAllocationInput,
  ) =>
    apiRequest<unknown>(
      `/api/v1/resources/allocations/${encodeURIComponent(id)}/transfer`,
      { method: "PATCH", body: JSON.stringify(input) },
    ),
};

export const resourceRequestsApi = {
  list: (teamId?: string, status?: ApiRequestStatus) =>
    apiRequest<unknown>(
      withQuery("/resource-requests/api/v1/resource-request", {
        teamId,
        status,
      }),
    ),
  get: (id: string, include?: string) =>
    apiRequest<unknown>(
      withQuery(
        `/resource-requests/api/v1/resource-request/${encodeURIComponent(id)}`,
        { include },
      ),
    ),
  create: (input: CreateResourceRequestInput) =>
    apiRequest<unknown>("/resource-requests/api/v1/resource-request", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateResourceRequestInput) =>
    apiRequest<unknown>(
      `/resource-requests/api/v1/resource-request/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    ),
};

export const dashboardApi = {
  overview: (departmentId?: string) =>
    apiRequest<unknown>(
      withQuery("/api/v1/dashboard", { departmentId }),
    ),
  departments: () =>
    apiRequest<unknown>("/api/v1/dashboard/departments"),
  department: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/dashboard/departments/${encodeURIComponent(id)}`,
    ),
};

export const notificationsApi = {
  mine: () => apiRequest<unknown>("/api/v1/notifications/me"),
  byUser: (id: string) =>
    apiRequest<unknown>(
      `/api/v1/notifications/users/${encodeURIComponent(id)}`,
    ),
  markRead: (id: string, userId: string) =>
    apiRequest<unknown>(
      `/api/v1/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH", body: JSON.stringify({ userId }) },
    ),
  create: (userId: string, message: string) =>
    apiRequest<unknown>("/api/v1/notifications", {
      method: "POST",
      body: JSON.stringify({ userId, message }),
    }),
  remove: (userId: string, notificationId: string) =>
    apiRequest<unknown>(
      `/api/v1/notifications/users/${encodeURIComponent(userId)}/notifications/${encodeURIComponent(notificationId)}`,
      { method: "DELETE" },
    ),
};

export const reportsApi = {
  approvalHistory: (departmentId?: string, startDate?: string, endDate?: string) =>
    apiRequest<unknown>(
      withQuery("/api/v1/reports/approval-history", {
        departmentId,
        startDate,
        endDate,
      }),
    ),
  departmentalSpending: (
    departmentId?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    apiRequest<unknown>(
      withQuery("/api/v1/reports/departmental-spending", {
        departmentId,
        startDate,
        endDate,
      }),
    ),
  allocationHistory: (
    departmentId?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    apiRequest<unknown>(
      withQuery("/api/v1/reports/allocation-history", {
        departmentId,
        startDate,
        endDate,
      }),
    ),
  department: (id: string, startDate?: string, endDate?: string) =>
    apiRequest<unknown>(
      withQuery(
        `/api/v1/reports/department/${encodeURIComponent(id)}`,
        { startDate, endDate },
      ),
    ),
  organization: (startDate?: string, endDate?: string) =>
    apiRequest<unknown>(
      withQuery("/api/v1/reports/organization", { startDate, endDate }),
    ),
};

export const auditLogsApi = {
  list: () => apiRequest<unknown>("/api/v1/audit-logs"),
  record: (entityType: string, entityId: string) =>
    apiRequest<unknown>(
      `/api/v1/audit-logs/record/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    ),
};
