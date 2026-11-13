export type ApiRecord = Record<string, unknown>;

const collectionKeys = [
  "items",
  "results",
  "users",
  "departments",
  "teams",
  "projects",
  "requests",
  "resourceRequests",
  "notifications",
  "auditLogs",
] as const;

export function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function unwrapApiResponse(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 5 && isApiRecord(current); depth += 1) {
    if ("data" in current) {
      current = current.data;
      continue;
    }
    if ("result" in current) {
      current = current.result;
      continue;
    }
    const collectionKey = collectionKeys.find((key) =>
      Array.isArray(current[key]),
    );
    if (collectionKey) return current[collectionKey];
    break;
  }
  return current;
}

export function getApiRecords(value: unknown): ApiRecord[] {
  const unwrapped = unwrapApiResponse(value);
  if (!Array.isArray(unwrapped)) return [];
  return unwrapped.filter(isApiRecord);
}

export function humanizeApiKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatApiValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string" || typeof item === "number")) {
      return value.join(", ") || "—";
    }
    return `${value.length} ${value.length === 1 ? "record" : "records"}`;
  }
  if (!isApiRecord(value)) return "—";

  const label = value.name ?? value.fullName ?? value.title ?? value.email;
  const id = value.id;
  if (label !== undefined) {
    const suffix =
      typeof id === "string" || typeof id === "number" ? ` (ID ${id})` : "";
    return `${String(label)}${suffix}`;
  }

  const values = Object.entries(value)
    .filter(([, item]) => item === null || ["string", "number", "boolean"].includes(typeof item))
    .slice(0, 3)
    .map(([key, item]) => `${humanizeApiKey(key)}: ${formatApiValue(item)}`);
  return values.length ? values.join(" · ") : "Related record";
}

function flattenRecord(
  record: ApiRecord,
  prefix = "",
  depth = 0,
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const columnKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      flattened[columnKey] = formatApiValue(value);
    } else if (isApiRecord(value) && depth < 2) {
      const nested = flattenRecord(value, columnKey, depth + 1);
      if (Object.keys(nested).length) Object.assign(flattened, nested);
      else flattened[columnKey] = formatApiValue(value);
    } else {
      flattened[columnKey] = isApiRecord(value) ? formatApiValue(value) : value;
    }
  }
  return flattened;
}

export function flattenApiRecord(record: ApiRecord): Record<string, unknown> {
  return flattenRecord(record);
}
