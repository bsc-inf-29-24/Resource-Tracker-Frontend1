import { useCallback, useEffect, useState } from "react";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/StatusCard";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import {
  departmentsApi,
  projectsApi,
  resourceRequestsApi,
  teamsApi,
  usersApi,
} from "../../data/api-services";
import { getApiRecords, type ApiRecord } from "../../data/api-response";
import { ApiError } from "../../data/api-client";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

type DashboardData = {
  users?: unknown;
  departments?: unknown;
  teams?: unknown;
  projects?: unknown;
  requests?: unknown;
};

type DashboardErrors = Partial<
  Record<keyof DashboardData | "userDepartments", string>
>;

function arrayCount(value: unknown): number | string {
  return value === undefined ? "Unavailable" : getApiRecords(value).length;
}

async function addUserDepartments(
  userResponse: unknown,
  departmentResponse: unknown,
): Promise<{ users: ApiRecord[]; error?: string }> {
  const users = getApiRecords(userResponse);
  if (departmentResponse === undefined) {
    return {
      users: users.map((user) => ({ ...user, department: "Unavailable" })),
      error: "Department assignments could not be loaded.",
    };
  }

  const departments = getApiRecords(departmentResponse);
  const memberships = await Promise.allSettled(
    departments.map(async (department) => {
      const id = department.id ?? department.departmentId;
      const name =
        typeof department.name === "string"
          ? department.name.trim()
          : typeof department.departmentName === "string"
            ? department.departmentName.trim()
            : "";
      if (
        (typeof id !== "string" && typeof id !== "number") ||
        !name
      ) {
        throw new Error("A department record is missing its ID or name.");
      }
      const response = await departmentsApi.users(String(id));
      return { name, users: getApiRecords(response) };
    }),
  );

  if (memberships.some((result) => result.status === "rejected")) {
    return {
      users: users.map((user) => ({ ...user, department: "Unavailable" })),
      error: "Department assignments could not be loaded for every department.",
    };
  }

  const departmentNamesByUser = new Map<string, string[]>();
  for (const result of memberships) {
    if (result.status !== "fulfilled") continue;
    for (const user of result.value.users) {
      if (typeof user.id !== "string" && typeof user.id !== "number") continue;
      const userId = String(user.id);
      const names = departmentNamesByUser.get(userId) ?? [];
      if (!names.includes(result.value.name)) names.push(result.value.name);
      departmentNamesByUser.set(userId, names);
    }
  }

  return {
    users: users.map((user) => {
      const names =
        typeof user.id === "string" || typeof user.id === "number"
          ? departmentNamesByUser.get(String(user.id)) ?? []
          : [];
      return {
        ...user,
        department: names.length ? names.join(", ") : "Not assigned",
      };
    }),
  };
}

export default function ManagingDirectorDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const results = await Promise.allSettled([
      usersApi.list(),
      departmentsApi.list(),
      teamsApi.list(),
      projectsApi.list(),
      resourceRequestsApi.list(),
    ]);
    const keys: (keyof DashboardData)[] = [
      "users",
      "departments",
      "teams",
      "projects",
      "requests",
    ];
    const nextData: DashboardData = {};
    const nextErrors: DashboardErrors = {};
    results.forEach((result, index) => {
      const key = keys[index];
      if (!key) return;
      if (result.status === "fulfilled") nextData[key] = result.value;
      else {
        const reason = result.reason;
        nextErrors[key] = reason instanceof ApiError
          ? `${reason.message} (HTTP ${reason.status}; response: ${JSON.stringify(reason.responseBody)})`
          : reason instanceof Error ? reason.message : "The request failed.";
      }
    });
    if (nextData.users !== undefined) {
      const enrichedUsers = await addUserDepartments(
        nextData.users,
        nextData.departments,
      );
      nextData.users = enrichedUsers.users;
      if (enrichedUsers.error) {
        nextErrors.userDepartments = enrichedUsers.error;
      }
    }
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    if (usersLoading) return;
    setUsersLoading(true);
    setErrors((current) => ({
      ...current,
      users: undefined,
      userDepartments: undefined,
    }));
    try {
      const [usersResult, departmentsResult] = await Promise.allSettled([
        usersApi.list(),
        departmentsApi.list(),
      ]);
      if (usersResult.status === "rejected") throw usersResult.reason;
      const enrichedUsers = await addUserDepartments(
        usersResult.value,
        departmentsResult.status === "fulfilled"
          ? departmentsResult.value
          : undefined,
      );
      setData((current) => ({
        ...current,
        users: enrichedUsers.users,
        ...(departmentsResult.status === "fulfilled"
          ? { departments: departmentsResult.value }
          : {}),
      }));
      if (enrichedUsers.error) {
        setErrors((current) => ({
          ...current,
          userDepartments: enrichedUsers.error,
        }));
      }
    } catch (error) {
      setErrors((current) => ({ ...current, users: error instanceof Error ? error.message : "Users could not be loaded." }));
    } finally {
      setUsersLoading(false);
    }
  }, [usersLoading]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Managing Director"
        description=""
      />
      {Object.values(errors).some(Boolean) && <ErrorMessage title="Some dashboard data could not be loaded" message={Object.entries(errors).filter(([, message]) => Boolean(message)).map(([key, message]) => `${key}: ${message}`).join("; ")} onRetry={() => void loadDashboard()} />}
      <StatusCardGrid>
        <StatusCard
          label="Users returned"
          value={arrayCount(data.users)}
          loading={loading}
        />
        <StatusCard
          label="Departments returned"
          value={arrayCount(data.departments)}
          loading={loading}
        />
        <StatusCard
          label="Teams returned"
          value={arrayCount(data.teams)}
          loading={loading}
        />
        <StatusCard
          label="Projects returned"
          value={arrayCount(data.projects)}
          loading={loading}
        />
        <StatusCard
          label="Requests returned"
          value={arrayCount(data.requests)}
          loading={loading}
        />
      </StatusCardGrid>
      <ApiResponsePanel title="Users" data={data.users} loading={loading || usersLoading} error={errors.users} onRefresh={() => void loadUsers()} />
    </section>
  );
}
