import { useCallback, useEffect, useState } from "react";
import {
  departmentsApi,
  usersApi,
} from "../../data/api-services";
import {
  getApiRecords,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";

export interface DepartmentRecord {
  id: number;
  name: string;
  code?: string | null;
  description?: string;
}

interface DepartmentScope {
  department: DepartmentRecord | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

export default function useDepartmentScope(): DepartmentScope {
  const [department, setDepartment] = useState<DepartmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadScope() {
      setLoading(true);
      setError("");
      try {
        const [profileResponse, departmentsResponse] = await Promise.all([
          usersApi.myProfile(),
          departmentsApi.list(),
        ]);
        const profile = unwrapApiResponse(profileResponse);
        if (!isApiRecord(profile) || typeof profile.department !== "string") {
          throw new Error("Your account is not associated with a department.");
        }

        const matchedDepartment = getApiRecords(departmentsResponse).find(
          (record) =>
            typeof record.id === "number" &&
            typeof record.name === "string" &&
            record.name.trim().toLowerCase() ===
              profile.department?.trim().toLowerCase(),
        );
        const departmentId = matchedDepartment?.id;
        const departmentName = matchedDepartment?.name;
        if (
          typeof departmentId !== "number" ||
          typeof departmentName !== "string"
        ) {
          throw new Error(
            `The department "${profile.department}" could not be found.`,
          );
        }

        if (!cancelled) {
          setDepartment({
            id: departmentId,
            name: departmentName,
            code:
              typeof matchedDepartment.code === "string" ||
              matchedDepartment.code === null
                ? matchedDepartment.code
                : undefined,
            description:
              typeof matchedDepartment.description === "string"
                ? matchedDepartment.description
                : undefined,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setDepartment(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The department could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadScope();
    return () => {
      cancelled = true;
    };
  }, [revision]);

  return { department, loading, error, reload };
}
