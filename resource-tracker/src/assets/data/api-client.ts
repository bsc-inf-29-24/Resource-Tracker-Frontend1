export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_STORAGE_KEY = "resource-tracker.tokens.v1";
const USER_STORAGE_KEY = "resource-tracker.user.v1";

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) return false;
  const tokens = value as Record<string, unknown>;
  return (
    typeof tokens.accessToken === "string" &&
    typeof tokens.refreshToken === "string"
  );
}

export function getStoredAuthTokens(): AuthTokens | null {
  const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (isAuthTokens(parsed)) return parsed;
  } catch {
    // Invalid browser storage must not be used as credentials.
  }

  clearAuthSession();
  return null;
}

export function saveAuthTokens(tokens: AuthTokens): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string => typeof item === "string",
      );
      if (messages.length) return messages.join(", ");
    }
  }
  return `Request failed with status ${status}`;
}

async function send<T>(
  path: string,
  options: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    throw new ApiError(errorMessage(body, response.status), response.status, body);
  }
  return body as T;
}

let refreshInProgress: Promise<AuthTokens> | null = null;

async function refreshAuthTokens(): Promise<AuthTokens> {
  const current = getStoredAuthTokens();
  if (!current) throw new ApiError("Your session has expired.", 401, null);

  if (!refreshInProgress) {
    refreshInProgress = send<AuthTokens>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      },
    )
      .then((tokens) => {
        if (!isAuthTokens(tokens)) {
          throw new Error("The refresh response did not contain both tokens.");
        }
        saveAuthTokens(tokens);
        return tokens;
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          window.dispatchEvent(new Event("resource-tracker:session-expired"));
        }
        throw error;
      })
      .finally(() => {
        refreshInProgress = null;
      });
  }

  return refreshInProgress;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const tokens = authenticated ? getStoredAuthTokens() : null;
  try {
    return await send<T>(path, options, tokens?.accessToken);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !authenticated ||
      path === "/api/v1/auth/refresh"
    ) {
      throw error;
    }

    const refreshed = await refreshAuthTokens();
    try {
      return await send<T>(path, options, refreshed.accessToken);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        clearAuthSession();
        window.dispatchEvent(new Event("resource-tracker:session-expired"));
      }
      throw retryError;
    }
  }
}
