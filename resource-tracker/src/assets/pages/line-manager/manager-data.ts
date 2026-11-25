import { getApiRecords, isApiRecord, unwrapApiResponse } from "../../data/api-response";

type RecordValue = Record<string, unknown>;

export interface ManagerIdentity {
  id: string;
  fullName: string;
  email: string;
  team?: string | null;
}

export function recordsFromResponse(response: unknown, label: string): RecordValue[] {
  const value = unwrapApiResponse(response);
  if (!Array.isArray(value)) {
    throw new Error(`The ${label} endpoint did not return its documented list response.`);
  }
  const records = getApiRecords(value);
  if (records.length !== value.length) {
    throw new Error(`The ${label} endpoint returned an item with an unexpected response shape.`);
  }
  return records;
}

export function relatedLabel(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isApiRecord(value)) {
    const label = value.name ?? value.fullName ?? value.title ?? value.email ?? value.id;
    return label === undefined ? "—" : String(label);
  }
  return "—";
}

export function getTeamId(record: RecordValue): string {
  const value = record.id ?? record.teamId;
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function getTeamName(record: RecordValue): string {
  return relatedLabel(record.name ?? record.teamName);
}

export function getAssignedTeams(
  teams: RecordValue[],
  user: ManagerIdentity,
): RecordValue[] {
  return teams.filter((team) => {
    const assignedId = team.lineManagerId ?? team.managerId ?? team.assignedManagerId;
    const assignedManager = team.lineManager ?? team.manager ?? team.assignedManager;
    if (
      (typeof assignedId === "string" || typeof assignedId === "number") &&
      String(assignedId) === user.id
    ) return true;
    if (isApiRecord(assignedManager)) {
      const managerId = assignedManager.id;
      const managerName = assignedManager.fullName ?? assignedManager.name;
      if (managerId !== undefined && String(managerId) === user.id) return true;
      if (typeof managerName === "string" && managerName === user.fullName) return true;
    } else if (
      typeof assignedManager === "string" &&
      (assignedManager === user.fullName || assignedManager === user.email)
    ) {
      return true;
    }
    const profileTeam = user.team?.trim().toLocaleLowerCase();
    return Boolean(profileTeam && getTeamName(team).toLocaleLowerCase() === profileTeam);
  });
}

export function isApiRecordValue(value: unknown): value is RecordValue {
  return isApiRecord(value);
}
