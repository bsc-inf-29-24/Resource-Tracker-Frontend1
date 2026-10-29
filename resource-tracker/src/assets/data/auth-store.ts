import {
  createUser,
  getUserByEmail,
  getUserById,
  hasDuplicateEmail,
  type UserDraft,
} from "./user-store";
import type { UserAccount } from "../types/user";

const SESSION_KEY = "resource-tracker.session-user.v1";
const CREDENTIALS_KEY = "resource-tracker.demo-credentials.v1";
export const DEMO_PASSWORD = "Demo123!";

interface DemoCredential {
  email: string;
  passwordHash: string;
}

function readCredentials(): DemoCredential[] {
  const saved = window.localStorage.getItem(CREDENTIALS_KEY);
  if (saved === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error(
      "Saved demo sign-in data could not be read. Clear this browser's demo data and register again."
    );
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "email" in item &&
        typeof item.email === "string" &&
        "passwordHash" in item &&
        typeof item.passwordHash === "string"
    )
  ) {
    throw new Error(
      "Saved demo sign-in data is invalid. Clear this browser's demo data and register again."
    );
  }
  return parsed;
}

async function hashPassword(password: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Secure password hashing is unavailable in this browser. Use localhost or a secure connection."
    );
  }
  const bytes = new TextEncoder().encode(password);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function saveCredentials(credentials: DemoCredential[]) {
  try {
    window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch {
    throw new Error(
      "Demo sign-in details could not be saved in this browser. Check available storage and try again."
    );
  }
}

function saveSession(user: UserAccount) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, user.id);
  } catch {
    throw new Error(
      "The demo session could not be started in this browser. Check browser storage and try again."
    );
  }
}

export async function signInDemoUser(
  email: string,
  password: string
): Promise<UserAccount> {
  const account = getUserByEmail(email);
  if (!account || !account.isActive) {
    throw new Error("The email or password is incorrect, or this account is inactive.");
  }

  const credential = readCredentials().find(
    (item) => item.email.toLocaleLowerCase() === account.email.toLocaleLowerCase()
  );
  const isValid = credential
    ? credential.passwordHash === (await hashPassword(password))
    : password === DEMO_PASSWORD;

  if (!isValid) throw new Error("The email or password is incorrect.");
  saveSession(account);
  return account;
}

export async function registerDemoUser(
  draft: UserDraft,
  password: string
): Promise<UserAccount> {
  if (hasDuplicateEmail(draft.email)) {
    throw new Error("An account with this email address already exists.");
  }

  const email = draft.email.trim().toLocaleLowerCase();
  const credentials = readCredentials();
  const passwordHash = await hashPassword(password);
  const nextCredentials = [
    ...credentials.filter((credential) => credential.email !== email),
    { email, passwordHash },
  ];

  saveCredentials(nextCredentials);
  let account: UserAccount;
  try {
    account = createUser(draft);
  } catch (error) {
    saveCredentials(credentials);
    throw error;
  }

  saveSession(account);
  return account;
}

export function getCurrentDemoUser(): UserAccount | undefined {
  const userId = window.sessionStorage.getItem(SESSION_KEY);
  return userId ? getUserById(userId) : undefined;
}

export function signOutDemoUser() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
