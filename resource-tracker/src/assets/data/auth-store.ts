import type { UserRole } from "../config/navigation";

const USER_STORAGE_KEY = "resource-tracker.user.v1";
import {
  ApiError,
  apiRequest,
  clearAuthSession,
  getStoredAuthTokens,
  saveAuthTokens,
} from "./api-client";

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  team?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) return false;
  const tokens = value as Record<string, unknown>;
  return (
    typeof tokens.accessToken === "string" &&
    typeof tokens.refreshToken === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

export function getCurrentDemoUser(): AuthenticatedUser | undefined {
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
      return "/department-manager/dashboard";
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
      return "team_lead";
    case "line-manager":
      return "line_manager";
    case "department-manager":
      return "department_head";
    case "system-admin":
      return "system_admin";
    case "managing-director":
      return "managing_director";
    case "team-member":
      return "team_member";
    default:
      throw new Error(`Unsupported frontend role: ${role ?? "missing"}.`);
  }
}

export async function registerDemoUser(
  draft: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    team?: string;
  },
  password: string,
): Promise<AuthenticatedUser> {
  const fullName = draft.name?.trim();
  const email = draft.email?.trim();

  if (!fullName || !email) {
    throw new Error("Full name and email are required.");
  }

  const backendRole = getBackendRoleFromFrontendRole(draft.role);
  const payload = {
    fullName,
    email,
    role: backendRole,
    initialPassword: password,
  };

  const created = await request<{ id?: string; fullName?: string; email?: string; role?: string }>(
    "/api/v1/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );

  const nextUser = normalizeUser({
    id: created?.id ?? "",
    fullName: created?.fullName ?? fullName,
    email: created?.email ?? email,
    role: created?.role ?? backendRole,
    department: draft.department ?? null,
    team: draft.team ?? null,
  });

  saveCurrentUser(nextUser);
  return nextUser;
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
  };
}

export async function getCurrentUserProfile(): Promise<AuthenticatedUser> {
  const profile = await request<unknown>("/api/v1/users/me");
  if (
    !isRecord(profile) ||
    typeof profile.id !== "string" ||
    typeof profile.fullName !== "string" ||
    typeof profile.email !== "string" ||
    typeof profile.role !== "string"
  ) {
    throw new Error("The user profile response is missing required account fields.");
  }
  const normalized = normalizeUser({
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role,
    department:
      typeof profile.department === "string" ? profile.department : null,
    team: typeof profile.team === "string" ? profile.team : null,
  });
  saveCurrentUser(normalized);
  return normalized;
}

export async function signInDemoUser(
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

  if (!isAuthTokens(tokens)) {
    throw new Error("The sign-in response did not contain both session tokens.");
  }
  saveTokens(tokens);

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
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    if (!tokens.refreshToken) {
      clearTokens();
      return null;
    }

    let refreshed: unknown;
    try {
      refreshed = await request<unknown>(
        "/api/v1/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        },
        false,
      );
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        clearTokens();
        return null;
      }
      throw refreshError;
    }

    if (!isAuthTokens(refreshed)) {
      throw new Error("The refresh response did not contain both session tokens.");
    }
    saveTokens(refreshed);
    try {
      return await getCurrentUserProfile();
    } catch (profileError) {
      if (profileError instanceof ApiError && profileError.status === 401) {
        clearTokens();
        return null;
      }
      throw profileError;
    }
  }
}

export async function signOutDemoUser() {
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
