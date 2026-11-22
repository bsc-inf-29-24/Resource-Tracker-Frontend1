import { apiRequest } from "./api-client";

export type AssignableUserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_HEAD"
  | "MANAGING_DIRECTOR"
  | "TEAM_MEMBER";

export const assignableUserRoles: {
  value: AssignableUserRole;
  label: string;
}[] = [
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "LINE_MANAGER", label: "Line Manager" },
  { value: "DEPARTMENT_HEAD", label: "Department Head" },
  { value: "MANAGING_DIRECTOR", label: "Managing Director" },
  { value: "TEAM_MEMBER", label: "Team Member" },
];

export interface CreateUserInput {
  firstName: string;
  middleName?: string;
  surname: string;
  email: string;
  role: AssignableUserRole;
}

export interface CreatedUser {
  id: string;
  fullName: string;
  email: string;
  role: AssignableUserRole | "SYSTEM_ADMIN";
  isActive: boolean;
}

export interface CreateUserResponse {
  user: CreatedUser;
}

export type PreferredPronoun = "Mr." | "Mrs." | "Miss";

export interface UpdateMyProfileInput {
  action: "update_profile";
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  preferredPronoun?: PreferredPronoun;
}

export interface ChangeMyPasswordInput {
  action: "change_password";
  currentPassword: string;
  newPassword: string;
}

export type ManageMyAccountInput = UpdateMyProfileInput | ChangeMyPasswordInput;

export interface AuditLogFilters {
  userId?: string;
  actionType?: string;
  entityType?: string;
  date?: string;
  time?: string;
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
  departmentName?: string;
  price?: number;
  label?: string;
  vendor?: string;
  quantity?: number;
  batchNumber?: string;
}

export type ResourceType = "insourced" | "outsourced";

export type ApiRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "QUERIED"
  | "APPROVED"
  | "REJECTED";

export interface CreateResourceRequestInput {
  resourceId: string;
  itemDescription: string;
  batchNumber: string;
  quantity: number;
  expectedDurationDays: number;
  projectId: number;
  lineManagerName: string;
  teamId: number;
}

export interface UpdateResourceRequestInput {
  resourceId?: string;
  itemDescription?: string;
  batchNumber?: string;
  quantity?: number;
  expectedDurationDays?: number;
  projectId?: number;
  lineManagerName?: string;
  teamId?: number;
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
  lineManagers: () => apiRequest<unknown>("/api/v1/users/line-managers"),
  myProfile: () => apiRequest<unknown>("/api/v1/users/me"),
  updateMyAccount: (input: ManageMyAccountInput) =>
    apiRequest<unknown>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteMyAccount: () =>
    apiRequest<{ message: string }>("/api/v1/users/me/delete", {
      method: "DELETE",
    }),
  create: (input: CreateUserInput) =>
    apiRequest<CreateUserResponse>(
      "/api/v1/users",
      { method: "POST", body: JSON.stringify(input) },
    ),
  setRole: (id: string, role: AssignableUserRole) =>
    apiRequest<unknown>(`/api/v1/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "assign_role", role }),
    }),
  deactivate: (id: string) =>
    apiRequest<unknown>(`/api/v1/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "deactivate" }),
    }),
  reactivate: (id: string) =>
    apiRequest<unknown>(`/api/v1/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "reactivate" }),
    }),
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
  teamProjects: (id: string, teamId: string) =>
    apiRequest<unknown>(
      `/api/v1/departments/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/projects`,
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
  create: (input: Record<string, unknown>) => {
    const type = input.type;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const quantity = Number(input.quantity);
    if (type !== "insourced" && type !== "outsourced") {
      throw new Error("Select a supported resource type.");
    }
    if (!name || !Number.isFinite(quantity) || quantity < 1) {
      throw new Error("Enter a resource name and a quantity of at least one.");
    }

    const body: Record<string, unknown> = { type, name, quantity };
    if (type === "insourced") {
      const description = typeof input.description === "string" ? input.description.trim() : "";
      const departmentName = typeof input.departmentName === "string" ? input.departmentName.trim() : "";
      if (!description || !departmentName) {
        throw new Error("Insourced resources require a description and department name.");
      }
      body.description = description;
      body.departmentName = departmentName;
    } else {
      const rawPrice = input.price;
      const price = Number(rawPrice);
      const label = typeof input.label === "string" ? input.label.trim() : "";
      const batchNumber = typeof input.batchNumber === "string" ? input.batchNumber.trim() : "";
      const vendor = typeof input.vendor === "string" ? input.vendor.trim() : "";
      if (
        (typeof rawPrice !== "number" && typeof rawPrice !== "string") ||
        String(rawPrice).trim() === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !label ||
        !batchNumber ||
        !vendor
      ) {
        throw new Error("Outsourced resources require a non-negative price, label, batch number, and vendor.");
      }
      Object.assign(body, { price, label, batchNumber, vendor });
    }

    return apiRequest<unknown>("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update: (id: string, input: ResourceInput) => {
    const { type, ...body } = input;
    if (type !== "insourced" && type !== "outsourced") {
      throw new Error("Select the resource type before updating it.");
    }
    return apiRequest<unknown>(
      `/api/v1/resources/${type}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },
  available: () => apiRequest<unknown>("/api/v1/resources"),
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
  list: (filters: AuditLogFilters = {}) =>
    apiRequest<unknown>(
      withQuery("/api/v1/audit-logs", {
        userId: filters.userId,
        actionType: filters.actionType,
        entityType: filters.entityType,
        date: filters.date,
        time: filters.time,
      }),
    ),
};
