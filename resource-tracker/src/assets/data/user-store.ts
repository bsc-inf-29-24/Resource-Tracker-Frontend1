import { useSyncExternalStore } from "react";
import { mockDepartments, mockUsers as adminMockUsers } from "./Users.js";
import { mockUsers as resourceMockUsers } from "./mock-data";
import type { AccountStatus, Role, UserAccount } from "../types/user";

const STORAGE_KEY = "resource-tracker.users.v1";
const roles: Role[] = [
  "team-lead",
  "line-manager",
  "department-manager",
  "system-admin",
];
const statuses: AccountStatus[] = ["Active", "Inactive"];

export interface UserSnapshot {
  users: UserAccount[];
  persistenceWarning?: string;
}

export interface UserDraft {
  name: string;
  email: string;
  department: string;
  role: Role;
  team?: string;
}

type DepartmentRecord = {
  id: string;
  name: string;
  code?: string;
  manager?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeUser(value: unknown): UserAccount | null {
  if (!isRecord(value)) return null;
  const { id, name, email, department, role } = value;
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof department !== "string" ||
    !roles.includes(role as Role)
  ) {
    return null;
  }
  const rawStatus = value.status;
  const status: AccountStatus = statuses.includes(rawStatus as AccountStatus)
    ? (rawStatus as AccountStatus)
    : value.isActive === false
      ? "Inactive"
      : "Active";
  const team = typeof value.team === "string" ? value.team : undefined;
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : undefined;
  return {
    id,
    name,
    email,
    department,
    role: role as Role,
    ...(team ? { team } : {}),
    ...(createdAt ? { createdAt } : {}),
    status,
    isActive: status === "Active",
  };
}

function uniqueUsers(values: unknown[]): UserAccount[] {
  const users: UserAccount[] = [];
  const ids = new Set<string>();
  const emails = new Set<string>();
  for (const value of values) {
    const user = normalizeUser(value);
    if (!user) continue;
    const email = user.email.trim().toLocaleLowerCase();
    if (ids.has(user.id) || emails.has(email)) continue;
    ids.add(user.id);
    emails.add(email);
    users.push(user);
  }
  return users;
}

const seedUsers = uniqueUsers([...adminMockUsers, ...resourceMockUsers]);

function readSnapshot(): UserSnapshot {
  if (typeof window === "undefined") return { users: seedUsers };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { users: seedUsers };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return {
        users: seedUsers,
        persistenceWarning:
          "Saved account data is invalid. The original demonstration users are shown.",
      };
    }
    return { users: uniqueUsers([...parsed, ...seedUsers]) };
  } catch {
    return {
      users: seedUsers,
      persistenceWarning:
        "Saved account data could not be read. The original demonstration users are shown.",
    };
  }
}

let snapshot = readSnapshot();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readSnapshot();
      notify();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot() {
  return snapshot;
}

export function useUsers(): UserSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getUserByEmail(email: string): UserAccount | undefined {
  const normalizedEmail = email.trim().toLocaleLowerCase();
  return snapshot.users.find(
    (user) => user.email.trim().toLocaleLowerCase() === normalizedEmail
  );
}

export function getUserById(id: string): UserAccount | undefined {
  return snapshot.users.find((user) => user.id === id);
}

function saveUsers(users: UserAccount[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    throw new Error(
      "The account change could not be saved in this browser. Check available storage and try again."
    );
  }
  snapshot = { users };
  notify();
}

function normalizeDraft(draft: UserDraft): UserDraft {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    department: draft.department.trim(),
    role: draft.role,
    ...(draft.team?.trim() ? { team: draft.team.trim() } : {}),
  };
}

function assertUniqueEmail(email: string, exceptId?: string) {
  if (
    snapshot.users.some(
      (user) =>
        user.id !== exceptId &&
        user.email.trim().toLocaleLowerCase() === email.toLocaleLowerCase()
    )
  ) {
    throw new Error("An account with this email address already exists.");
  }
}

function createUserId() {
  let id: string;
  do {
    id = `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (snapshot.users.some((user) => user.id === id));
  return id;
}

export function createUser(draft: UserDraft): UserAccount {
  const normalized = normalizeDraft(draft);
  assertUniqueEmail(normalized.email);
  const account: UserAccount = {
    id: createUserId(),
    ...normalized,
    status: "Active",
    isActive: true,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveUsers([...snapshot.users, account]);
  return account;
}

export function updateUser(id: string, draft: UserDraft): UserAccount {
  const currentUser = snapshot.users.find((user) => user.id === id);
  if (!currentUser) throw new Error("The selected user could not be found.");
  const normalized = normalizeDraft(draft);
  assertUniqueEmail(normalized.email, id);
  if (
    currentUser.role === "system-admin" &&
    currentUser.status === "Active" &&
    normalized.role !== "system-admin" &&
    snapshot.users.filter(
      (user) => user.role === "system-admin" && user.status === "Active"
    ).length <= 1
  ) {
    throw new Error("At least one active system administrator must remain.");
  }
  const updatedUser: UserAccount = {
    ...currentUser,
    ...normalized,
    ...(normalized.team ? { team: normalized.team } : {}),
  };
  saveUsers(
    snapshot.users.map((user) => (user.id === id ? updatedUser : user))
  );
  return updatedUser;
}

export function setUserStatus(id: string, status: AccountStatus): UserAccount {
  const currentUser = snapshot.users.find((user) => user.id === id);
  if (!currentUser) throw new Error("The selected user could not be found.");
  if (
    status === "Inactive" &&
    currentUser.role === "system-admin" &&
    currentUser.status === "Active" &&
    snapshot.users.filter(
      (user) => user.role === "system-admin" && user.status === "Active"
    ).length <= 1
  ) {
    throw new Error("At least one active system administrator must remain.");
  }
  const updatedUser: UserAccount = {
    ...currentUser,
    status,
    isActive: status === "Active",
  };
  saveUsers(
    snapshot.users.map((user) => (user.id === id ? updatedUser : user))
  );
  return updatedUser;
}

export function hasDuplicateEmail(email: string, exceptId?: string): boolean {
  const normalized = email.trim().toLocaleLowerCase();
  return snapshot.users.some(
    (user) =>
      user.id !== exceptId &&
      user.email.trim().toLocaleLowerCase() === normalized
  );
}

const departmentOptions = mockDepartments as DepartmentRecord[];
const existingDepartmentNames = new Set(
  departmentOptions.map((department) => department.name)
);
export const availableDepartments = [
  ...departmentOptions.map(({ id, name, code, manager }) => ({
    id,
    name,
    code,
    manager,
  })),
  ...Array.from(
    new Set(
      resourceMockUsers
        .map((user) => user.department)
        .filter((name) => !existingDepartmentNames.has(name))
    )
  ).map((name, index) => ({ id: `demo-${index}`, name })),
];

export const supportedRoles: { value: Role; label: string }[] = [
  { value: "team-lead", label: "Team Lead" },
  { value: "line-manager", label: "Line Manager" },
  { value: "department-manager", label: "Department Manager" },
  { value: "system-admin", label: "System Administrator" },
];
