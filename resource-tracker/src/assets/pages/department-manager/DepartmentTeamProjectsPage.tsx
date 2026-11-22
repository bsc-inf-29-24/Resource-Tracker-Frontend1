import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import type { ApiRecord } from "../../data/api-response";
import { departmentsApi } from "../../data/api-services";
import useDepartmentScope from "./useDepartmentScope";

export default function DepartmentTeamProjectsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [projects, setProjects] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    if (!department || !teamId) return;
    setLoading(true);
    setError("");
    try {
      const response = await departmentsApi.teamProjects(
        String(department.id),
        teamId,
      );
      setProjects(getApiRecords(response));
    } catch (loadError) {
      setProjects([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Team projects could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department && teamId) void loadProjects();
  }, [department?.id, teamId]);

  const columns = useMemo<DataTableColumn<ApiRecord>[]>(() => {
    const flattened = projects.map(flattenApiRecord);
    const keys = Array.from(
      new Set(flattened.flatMap((record) => Object.keys(record))),
    );
    return keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatApiValue(flattenApiRecord(record)[key]),
    }));
  }, [projects]);

  if (scopeLoading) return <LoadingState message="Loading your department..." />;
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

  return (
    <div className="rt-root">
      <PageHeader
        title="Team Projects"
        description={`Projects assigned to team ${teamId ?? ""} in ${department.name}`}
      />
      <Link to="/department-manager/teams">Back to department teams</Link>
      {error && (
        <ErrorMessage
          title="Team projects unavailable"
          message={error}
          onRetry={() => void loadProjects()}
        />
      )}
      <DataTable
        title="Projects assigned to this team"
        columns={columns}
        rows={projects}
        loading={loading}
        itemLabel="project"
        emptyTitle="No team projects found"
        emptyDescription="The backend returned no projects assigned to this team."
      />
    </div>
  );
}
