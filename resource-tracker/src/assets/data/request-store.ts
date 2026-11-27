import { useSyncExternalStore } from "react";
import { mockRequests } from "./mock-data";
import type { RequestStatus, ResourceRequest } from "../types/resource-request";
import { canReviewRequest, hasTeamLeadReplied } from "../utils/status";

export const LINE_MANAGER_ID = "u2";
export const LINE_MANAGER_NAME = "Tamandani Longwe";
export const TEAM_LEAD_ID = "u1";
export const TEAM_LEAD_NAME = "Chikondi Banda";

const STORAGE_KEY = "resource-tracker.requests.v1";
const knownStatuses: RequestStatus[] = [
  "Submitted",
  "Pending",
  "Queried",
  "Approved",
  "Rejected",
];

export interface RequestSnapshot {
  requests: ResourceRequest[];
  persistenceWarning?: string;
}

function isRequest(value: unknown): value is ResourceRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ResourceRequest>;
  return (
    typeof request.id === "string" &&
    typeof request.itemDescription === "string" &&
    (request.requiredByDate === undefined ||
      typeof request.requiredByDate === "string") &&
    typeof request.quantity === "number" &&
    typeof request.estimatedPrice === "number" &&
    typeof request.department === "string" &&
    typeof request.project === "string" &&
    typeof request.team === "string" &&
    typeof request.summary === "string" &&
    typeof request.submittedAt === "string" &&
    typeof request.requestedById === "string" &&
    knownStatuses.includes(request.status as RequestStatus) &&
    Array.isArray(request.comments) &&
    request.comments.every(
      (comment) =>
        comment &&
        typeof comment.id === "string" &&
        typeof comment.authorId === "string" &&
        typeof comment.authorName === "string" &&
        typeof comment.message === "string" &&
        typeof comment.createdAt === "string"
    ) &&
    Array.isArray(request.history) &&
    request.history.every(
      (change) =>
        change &&
        knownStatuses.includes(change.status) &&
        typeof change.changedAt === "string" &&
        typeof change.changedBy === "string"
    )
  );
}

function readSnapshot(): RequestSnapshot {
  if (typeof window === "undefined") return { requests: mockRequests };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { requests: mockRequests };

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isRequest)) {
      return {
        requests: mockRequests,
        persistenceWarning:
          "Saved request data is invalid. Showing the available demo requests instead.",
      };
    }

    return { requests: parsed };
  } catch {
    return {
      requests: mockRequests,
      persistenceWarning:
        "Saved request data could not be read. Showing the available demo requests instead.",
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

export function useResourceRequests(): RequestSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function saveRequests(requests: ResourceRequest[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    throw new Error(
      "The request could not be saved in this browser. Check available storage and try again."
    );
  }

  snapshot = { requests };
  notify();
}

function createId() {
  let id: string;
  do {
    id = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (snapshot.requests.some((request) => request.id === id));
  return id;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface NewResourceRequest {
  itemDescription: string;
  manufacturer?: string;
  requiredByDate?: string;
  quantity: number;
  estimatedPrice: number;
  department: string;
  project: string;
  team: string;
  summary: string;
}

export function createResourceRequest(
  input: NewResourceRequest
): ResourceRequest {
  const itemDescription = input.itemDescription.trim();
  const summary = input.summary.trim();
  if (input.requiredByDate && !isValidDateOnly(input.requiredByDate)) {
    throw new Error("Enter a valid required-by date.");
  }
  if (!itemDescription) throw new Error("Enter an item description.");
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }
  if (!Number.isFinite(input.estimatedPrice) || input.estimatedPrice <= 0) {
    throw new Error("Total estimated cost must be greater than zero.");
  }
  if (!input.department.trim() || !input.project.trim() || !input.team.trim()) {
    throw new Error("Department, project, and requesting team are required.");
  }
  if (!summary) throw new Error("Enter a request summary.");

  const submittedAt = new Date().toISOString();
  const request: ResourceRequest = {
    id: createId(),
    itemDescription,
    ...(input.manufacturer?.trim()
      ? { manufacturer: input.manufacturer.trim() }
      : {}),
    ...(input.requiredByDate
      ? { requiredByDate: input.requiredByDate }
      : {}),
    quantity: input.quantity,
    estimatedPrice: input.estimatedPrice,
    department: input.department.trim(),
    project: input.project.trim(),
    team: input.team.trim(),
    summary,
    status: "Pending",
    submittedAt,
    requestedById: TEAM_LEAD_ID,
    comments: [],
    history: [
      {
        status: "Submitted",
        changedAt: submittedAt,
        changedBy: TEAM_LEAD_ID,
        note: "Request submitted by the Team Lead.",
      },
      {
        status: "Pending",
        changedAt: submittedAt,
        changedBy: "system",
        note: "Request is awaiting review.",
      },
    ],
  };

  saveRequests([...snapshot.requests, request]);
  return request;
}

export function hasPendingTeamLeadResponse(request: ResourceRequest): boolean {
  return request.status === "Queried" && !hasTeamLeadReplied(request);
}

export function addTeamLeadResponse(requestId: string, message: string) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error("Enter a response before submitting.");
  }
  const request = snapshot.requests.find((item) => item.id === requestId);
  if (!request) throw new Error("The selected request could not be found.");
  if (!hasPendingTeamLeadResponse(request)) {
    throw new Error("This request is not waiting for a Team Lead response.");
  }

  const now = new Date().toISOString();
  const updatedRequest: ResourceRequest = {
    ...request,
    status: "Pending",
    comments: [
      ...request.comments,
      {
        id: createId(),
        authorId: TEAM_LEAD_ID,
        authorName: TEAM_LEAD_NAME,
        message: trimmedMessage,
        createdAt: now,
      },
    ],
    history: [
      ...request.history,
      {
        status: "Pending",
        changedAt: now,
        changedBy: TEAM_LEAD_ID,
        note: "Additional information provided by the Team Lead.",
      },
    ],
  };

  saveRequests(
    snapshot.requests.map((item) =>
      item.id === requestId ? updatedRequest : item
    )
  );
}

function requireActionableRequest(request: ResourceRequest) {
  if (!canReviewRequest(request)) {
    throw new Error("This request is not currently available for review.");
  }
}

export function addRequestQuery(requestId: string, message: string) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new Error("Enter a query comment before submitting.");

  const request = snapshot.requests.find((item) => item.id === requestId);
  if (!request) throw new Error("The selected request could not be found.");
  requireActionableRequest(request);

  const now = new Date().toISOString();
  const updatedRequest: ResourceRequest = {
    ...request,
    status: "Queried",
    comments: [
      ...request.comments,
      {
        id: createId(),
        authorId: LINE_MANAGER_ID,
        authorName: LINE_MANAGER_NAME,
        message: trimmedMessage,
        createdAt: now,
      },
    ],
    history:
      request.status === "Queried"
        ? request.history
        : [
            ...request.history,
            {
              status: "Queried",
              changedAt: now,
              changedBy: LINE_MANAGER_ID,
              note: "Additional information requested.",
            },
          ],
  };

  saveRequests(
    snapshot.requests.map((item) =>
      item.id === requestId ? updatedRequest : item
    )
  );
}

export function recordDecision(
  requestId: string,
  status: Extract<RequestStatus, "Approved" | "Rejected">,
  reason?: string
) {
  const trimmedReason = reason?.trim();
  if (status === "Rejected" && !trimmedReason) {
    throw new Error("Enter a rejection reason before submitting.");
  }

  const request = snapshot.requests.find((item) => item.id === requestId);
  if (!request) throw new Error("The selected request could not be found.");
  requireActionableRequest(request);

  const now = new Date().toISOString();
  const note =
    status === "Rejected" ? trimmedReason : "Approved by the Line Manager.";
  const updatedRequest: ResourceRequest = {
    ...request,
    status,
    ...(status === "Rejected" ? { rejectionReason: trimmedReason } : {}),
    history: [
      ...request.history,
      {
        status,
        changedAt: now,
        changedBy: LINE_MANAGER_ID,
        note,
      },
    ],
  };

  saveRequests(
    snapshot.requests.map((item) =>
      item.id === requestId ? updatedRequest : item
    )
  );
}
