import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { flattenApiRecord, formatApiValue, getApiRecords, humanizeApiKey } from "../../data/api-response";
import { teamsApi } from "../../data/api-services";

type TeamRecord = Record<string, unknown>;

export default function TeamLeadTeamsTable() {
  const [records, setRecords] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const response = await teamsApi.list();
      setRecords(getApiRecords(response));
    } catch (loadError) {
      setRecords([]);
      setError(loadError instanceof Error ? loadError.message : "Teams could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTeams(); }, []);
  const columns = useMemo<DataTableColumn<TeamRecord>[]>(() => {
    const keys = Array.from(new Set(records.flatMap((record) => Object.keys(flattenApiRecord(record)))));
    return keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatApiValue(flattenApiRecord(record)[key]),
    }));
  }, [records]);

  return (
    <>
      {error && <ErrorMessage title="Teams could not be loaded" message={error} onRetry={() => void loadTeams()} />}
      <DataTable title="Teams" columns={columns} rows={records} loading={loading} itemLabel="team" emptyTitle="No teams found" emptyDescription="The backend returned no teams for this account." />
    </>
  );
}
