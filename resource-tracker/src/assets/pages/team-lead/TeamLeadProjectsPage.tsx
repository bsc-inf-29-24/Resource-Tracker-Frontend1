import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { flattenApiRecord, formatApiValue, getApiRecords, humanizeApiKey } from "../../data/api-response";
import { projectsApi } from "../../data/api-services";
import styles from "../management/ApiManagementPage.module.css";

type ProjectRecord = Record<string, unknown>;

export default function TeamLeadProjectsPage() {
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      setRecords(getApiRecords(await projectsApi.list()));
    } catch (loadError) {
      setRecords([]);
      setError(loadError instanceof Error ? loadError.message : "Projects could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);
  const columns = useMemo<DataTableColumn<ProjectRecord>[]>(() => {
    const keys = Array.from(new Set(records.flatMap((record) => Object.keys(flattenApiRecord(record)))));
    return keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatApiValue(flattenApiRecord(record)[key]),
    }));
  }, [records]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title="Projects" description="Review projects." />
      {error && <ErrorMessage title="Projects could not be loaded" message={error} onRetry={() => void loadProjects()} />}
      <DataTable title="Projects" columns={columns} rows={records} loading={loading} itemLabel="project" emptyTitle="No projects found" emptyDescription="The backend returned no projects for this account." />
    </section>
  );
}
