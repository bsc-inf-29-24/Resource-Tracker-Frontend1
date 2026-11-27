import type { UserRole } from "../config/navigation";

const USER_STORAGE_KEY = "resource-tracker.user.v1";
import {
  ApiError,
  apiRequest,
  clearAuthSession,
  getStoredAuthTokens,
  normalizeAuthTokens,
  saveAuthTokens,
} from "./api-client";

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  team?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  preferredPronoun?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapUserProfile(value: unknown): Record<string, unknown> | null {
  let current = value;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!isRecord(current)) return null;

    const nested = current.data ?? current.result ?? current.user ?? current.profile;
    if (nested === undefined) return current;
    current = nested;
  }

  return isRecord(current) ? current : null;
}

function readTokens(): AuthTokens | null {
  return getStoredAuthTokens();
}

function saveTokens(tokens: AuthTokens) {
  saveAuthTokens(tokens);
}

function clearTokens() {
  clearAuthSession();
}

function saveCurrentUser(user: AuthenticatedUser) {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getSavedUser(): AuthenticatedUser | undefined {
  const saved = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!saved) return undefined;

  try {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === "object" && typeof parsed.email === "string") {
      return parsed as AuthenticatedUser;
    }
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }

  return undefined;
}

export function getFrontendRoleFromBackendRole(role?: string | null): UserRole | null {
  switch (role?.trim().toLowerCase()) {
    case "team_lead":
      return "TEAM_LEAD";
    case "line_manager":
      return "LINE_MANAGER";
    case "department_head":
      return "DEPARTMENT_MANAGER";
    case "managing_director":
      return "MANAGING_DIRECTOR";
    case "system_admin":
      return "SYSTEM_ADMIN";
    case "team_member":
      return "TEAM_MEMBER";
    default:
      return null;
  }
}

export function getDashboardPathForRole(role?: string | null): string {
  switch (role?.trim().toLowerCase()) {
    case "team_lead":
      return "/team-lead/dashboard";
    case "line_manager":
      return "/line-manager/dashboard";
    case "department_head":
      return "/department-manager/requests";
    case "managing_director":
      return "/managing-director/dashboard";
    case "system_admin":
      return "/system-admin/dashboard";
    case "team_member":
      return "/team-member/dashboard";
    default:
      return "/login";
  }
}

export function getBackendRoleFromFrontendRole(role?: string | null): string {
  switch (role?.trim().toLowerCase()) {
    case "team-lead":
      return "TEAM_LEAD";
    case "line-manager":
      return "LINE_MANAGER";
    case "department-manager":
      return "DEPARTMENT_HEAD";
    case "system-admin":
      return "SYSTEM_ADMIN";
    case "managing-director":
      return "MANAGING_DIRECTOR";
    case "team-member":
      return "TEAM_MEMBER";
    default:
      throw new Error(`Unsupported frontend role: ${role ?? "missing"}.`);
  }
}

export async function createAdministratorUser(
  input: import("./api-services").CreateUserInput,
): Promise<AuthenticatedUser> {
  const created = await request<import("./api-services").CreateUserResponse>(
    "/api/v1/users",
    { method: "POST", body: JSON.stringify(input) },
    true,
  );
  if (!created?.user) {
    throw new Error("The create-user response did not contain the created account.");
  }
  return normalizeUser(created.user);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  return apiRequest<T>(path, options, requireAuth);
}

function normalizeUser(
  user: Partial<AuthenticatedUser> & {
    fullName?: string;
    name?: string;
    role?: string;
  },
): AuthenticatedUser {
  return {
    id: String(user.id ?? ""),
    fullName: user.fullName ?? user.name ?? "User",
    email: String(user.email ?? ""),
    role: String(user.role ?? ""),
    department: user.department ?? null,
    team: user.team ?? null,
    phoneNumber: user.phoneNumber ?? null,
    address: user.address ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    preferredPronoun: user.preferredPronoun ?? null,
  };
}

export async function getCurrentUserProfile(): Promise<AuthenticatedUser> {
  const profile = unwrapUserProfile(await request<unknown>("/api/v1/users/me"));
  const nameFromParts = profile
    ? [profile.firstName, profile.middleName, profile.surname ?? profile.lastName]
        .filter(
          (part): part is string =>
            typeof part === "string" && Boolean(part.trim()),
        )
        .map((part) => part.trim())
        .join(" ")
    : "";
  const fullName = [profile?.fullName, profile?.name, nameFromParts].find(
    (name): name is string => typeof name === "string" && Boolean(name.trim()),
  );
  const id = profile?.id ?? profile?._id;
  if (
    !profile ||
    (typeof id !== "string" && typeof id !== "number") ||
    !String(id).trim() ||
    !fullName ||
    typeof profile.email !== "string" ||
    !profile.email.trim() ||
    typeof profile.role !== "string" ||
    !profile.role.trim()
  ) {
    throw new Error("The user profile response is missing required account fields.");
  }
  const normalized = normalizeUser({
    id: String(id),
    fullName: fullName.trim(),
    email: profile.email.trim(),
    role: profile.role.trim(),
    department:
      typeof profile.department === "string" ? profile.department : null,
    team: typeof profile.team === "string" ? profile.team : null,
    phoneNumber:
      typeof profile.phoneNumber === "string" ? profile.phoneNumber : null,
    address: typeof profile.address === "string" ? profile.address : null,
    dateOfBirth:
      typeof profile.dateOfBirth === "string" ? profile.dateOfBirth : null,
    preferredPronoun:
      typeof profile.preferredPronoun === "string"
        ? profile.preferredPronoun
        : null,
  });
  saveCurrentUser(normalized);
  return normalized;
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthenticatedUser> {
  const tokens = await request<unknown>(
    "/api/v1/auth",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false,
  );

  const normalizedTokens = normalizeAuthTokens(tokens);
  if (!normalizedTokens) {
    throw new Error("The sign-in response did not contain both session tokens.");
  }
  saveTokens(normalizedTokens);

  const profile = await getCurrentUserProfile();
  return profile;
}

export async function restoreAuthenticatedSession(): Promise<AuthenticatedUser | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  try {
    const user = await getCurrentUserProfile();
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function signOut() {
  const tokens = readTokens();

  try {
    if (tokens?.refreshToken) {
      await request(
        "/api/v1/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        },
        false,
      );
    }
  } finally {
    clearTokens();
  }
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/api/v1/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    false,
  );
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/api/v1/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    },
    false,
  );
}
