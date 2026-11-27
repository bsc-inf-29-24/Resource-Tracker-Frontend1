import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { formatApiValue } from "../../data/api-response";
import { resourceRequestsApi } from "../../data/api-services";
import { recordsFromResponse, relatedLabel } from "./manager-data";
import styles from "./LineManagerReportsPage.module.css";

type RecordValue = Record<string, unknown>;

function requestDate(request: RecordValue): Date | null {
  const raw = request.submittedAt ?? request.createdAt ?? request.requestedAt;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function LineManagerReportsPage() {
  const [requests, setRequests] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(recordsFromResponse(await resourceRequestsApi.list(), "resource requests"));
    } catch (requestError) {
      setRequests([]);
      setError(requestError instanceof Error ? requestError.message : "Report request data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const date = requestDate(request);
    if (!date) return !dateFrom && !dateTo;
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
  }), [dateFrom, dateTo, requests]);

  const columns = useMemo<DataTableColumn<RecordValue>[]>(() => [
    { key: "id", header: "Request ID", render: (request) => String(request.id ?? request.requestId ?? "—") },
    { key: "requester", header: "Requesting employee", render: (request) => relatedLabel(request.requestedBy ?? request.requester ?? request.createdBy ?? request.requestedByName) },
    { key: "team", header: "Team", render: (request) => relatedLabel(request.team ?? request.teamName) },
    { key: "resource", header: "Resource", render: (request) => String(request.itemDescription ?? request.resourceName ?? "—") },
    { key: "quantity", header: "Quantity", render: (request) => formatApiValue(request.quantity) },
    { key: "status", header: "Status", render: (request) => formatApiValue(request.status) },
    { key: "submitted", header: "Submitted", render: (request) => requestDate(request)?.toLocaleDateString() ?? "—" },
  ], []);

  function downloadCsv() {
    setDownloadError("");
    try {
      const headings = ["Request ID", "Requesting employee", "Team", "Resource", "Quantity", "Priority", "Status", "Submitted"];
      const rows = filteredRequests.map((request) => [
        request.id ?? request.requestId,
        relatedLabel(request.requestedBy ?? request.requester ?? request.createdBy ?? request.requestedByName),
        relatedLabel(request.team ?? request.teamName),
        request.itemDescription ?? request.resourceName,
        request.quantity,
        request.priority ?? request.urgency,
        request.status,
        requestDate(request)?.toISOString(),
      ]);
      const content = [headings, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "line-manager-resource-requests.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (requestError) {
      setDownloadError(requestError instanceof Error ? requestError.message : "The CSV report could not be generated.");
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Request reports"
        description="Generate a CSV report from the resource requests returned for your authenticated manager account."
        supplementary={<button type="button" className="rt-root rt-btn rt-btn--outline" disabled={loading} onClick={() => void loadRequests()}>Refresh</button>}
      />
      {error && <ErrorMessage title="Report data could not be loaded" message={error} onRetry={() => void loadRequests()} />}
      {downloadError && <ErrorMessage title="Report could not be generated" message={downloadError} />}
      <section className={`rt-root rt-card ${styles.filters}`}>
        <label>From <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label>To <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
        <button type="button" className="rt-root rt-btn rt-btn--primary" disabled={loading || Boolean(error)} onClick={downloadCsv}>Download CSV</button>
      </section>
      {loading ? <LoadingState message="Loading report data…" /> : !error && (
        <DataTable
          title={`${filteredRequests.length} ${filteredRequests.length === 1 ? "request" : "requests"} in report`}
          columns={columns}
          rows={filteredRequests}
          rowKey={(request, index) => String(request.id ?? request.requestId ?? index)}
          itemLabel="request"
          pageSize={10}
          emptyTitle="No requests in this period"
          emptyDescription="Adjust the date range or refresh to load current manager-scoped request data."
        />
      )}
    </section>
  );
}
