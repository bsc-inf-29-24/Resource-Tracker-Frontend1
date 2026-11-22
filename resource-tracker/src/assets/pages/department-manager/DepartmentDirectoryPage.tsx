import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
} from "../../data/api-response";
import { departmentsApi } from "../../data/api-services";
import type { ApiRecord } from "../../data/api-response";
import useDepartmentScope from "./useDepartmentScope";

type DirectoryType = "teams" | "projects";

interface DepartmentDirectoryPageProps {
  type: DirectoryType;
}

export default function DepartmentDirectoryPage({
  type,
}: DepartmentDirectoryPageProps) {
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    if (!department) return;
    setLoading(true);
    setError("");
    try {
      const response =
        type === "teams"
          ? await departmentsApi.teams(String(department.id))
          : await departmentsApi.projects(String(department.id));
      setRecords(getApiRecords(response));
    } catch (loadError) {
      setRecords([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : `Department ${type} could not be loaded.`,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [department?.id, type]);

  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const flattened = records.map(flattenApiRecord);
    const keys = Array.from(
      new Set(flattened.flatMap((record) => Object.keys(record))),
    );
    const result: DataTableColumn<ApiRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatApiValue(flattenApiRecord(record)[key]),
    }));
    if (type === "teams") {
      result.push({
        key: "teamProjects",
        header: "Projects",
        render: (record) =>
          record.id === undefined ? (
            "—"
          ) : (
            <Link to={`/department-manager/teams/${encodeURIComponent(String(record.id))}/projects`}>
              View projects
            </Link>
          ),
      });
    }
    return result;
  }, [records]);

  if (scopeLoading) return <LoadingState message="Loading department..." />;
  if (scopeError) {
    return (
      <ErrorMessage
        title="Department unavailable"
        message={scopeError}
        onRetry={reload}
      />
    );
  }
  if (!department) return null;

  const title = type === "teams" ? "Department Teams" : "Department Projects";

  return (
    <div className="rt-root">
      <PageHeader
        title={title}
        description={`${title} for ${department.name}`}
      />
      {error && (
        <ErrorMessage
          title={`${title} could not be loaded`}
          message={error}
          onRetry={() => void loadRecords()}
        />
      )}
      <DataTable
        title={title}
        columns={columns}
        rows={records}
        loading={loading}
        itemLabel={type === "teams" ? "team" : "project"}
        emptyTitle={`No ${type} found`}
        emptyDescription={`The backend returned no ${type} for ${department.name}.`}
      />
    </div>
  );
}
