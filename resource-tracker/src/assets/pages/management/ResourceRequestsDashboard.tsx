import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/StatusCard";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import { useAuth } from "../../context/AuthContext";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  unwrapApiResponse,
} from "../../data/api-response";
import {
  resourceRequestsApi,
  type ApiRequestStatus,
} from "../../data/api-services";
import styles from "./ApiManagementPage.module.css";

type RequestRecord = Record<string, unknown>;

const requestStatuses: ApiRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "QUERIED",
  "APPROVED",
  "REJECTED",
];

interface ResourceRequestsDashboardProps {
  title: string;
  description: string;
  detailsPath: string;
}

export default function ResourceRequestsDashboard({
  title,
  description,
  detailsPath,
}: ResourceRequestsDashboardProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRecord[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await resourceRequestsApi.list();
      const unwrapped = unwrapApiResponse(result);
      if (!Array.isArray(unwrapped)) {
        throw new Error("The resource-request endpoint did not return its documented array response.");
      }
      const records = getApiRecords(unwrapped);
      if (records.length !== unwrapped.length) {
        throw new Error("The resource-request endpoint returned an item with an unexpected response shape.");
      }
      setRequests(records);
    } catch (requestError) {
      setRequests(undefined);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Resource requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const requestRecords = requests ?? [];
  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        requestStatuses.map((status) => [
          status,
          requestRecords.filter((request) => request.status === status).length,
        ]),
      ) as Record<ApiRequestStatus, number>,
    [requestRecords],
  );

  const columns = useMemo<DataTableColumn<RequestRecord>[]>(() => {
    const allKeys = new Set(
      requestRecords.flatMap((request) =>
        Object.keys(flattenApiRecord(request)),
      ),
    );
    const preferred = [
      "id",
      "itemDescription",
      "status",
      "quantity",
      "price",
      "createdAt",
      "updatedAt",
    ];
    const keys = [
      ...preferred.filter((key) => allKeys.has(key)),
      ...[...allKeys].filter((key) => !preferred.includes(key)),
    ];
    const result: DataTableColumn<RequestRecord>[] = keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (request: RequestRecord) =>
        formatApiValue(flattenApiRecord(request)[key]),
    }));
    result.push({
      key: "details",
      header: "Details",
      render: (request) => {
        const id = request.id;
        if (typeof id !== "string" && typeof id !== "number") {
          return "Request ID not provided";
        }
        return (
          <Link to={`${detailsPath}/${encodeURIComponent(String(id))}`}>
            View request
          </Link>
        );
      },
    });
    return result;
  }, [detailsPath, requestRecords]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title={title} description={description} />
      {user && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>Profile</h2>
          <dl className={styles.apiDataFields}>
            <div className={styles.apiDataField}>
              <dt>Name</dt>
              <dd>{user.fullName}</dd>
            </div>
            <div className={styles.apiDataField}>
              <dt>Role</dt>
              <dd>{humanizeApiKey(user.role)}</dd>
            </div>
            {user.department && (
              <div className={styles.apiDataField}>
                <dt>Department</dt>
                <dd>{user.department}</dd>
              </div>
            )}
            {user.team && (
              <div className={styles.apiDataField}>
                <dt>Team</dt>
                <dd>{user.team}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
      {error && (
        <ErrorMessage
          title="Request data unavailable"
          message={error}
          onRetry={() => void loadRequests()}
        />
      )}
      {!error && loading ? (
        <LoadingState message="Loading backend requests..." />
      ) : !error && !loading && requests === undefined ? (
        <EmptyState
          title="No request response"
          description="No request data."
        />
      ) : !error ? (
        <>
          <StatusCardGrid>
            <StatusCard label="Requests returned" value={requestRecords.length} />
            {requestStatuses.map((status) => (
              <StatusCard
                key={status}
                label={status}
                value={statusCounts[status]}
              />
            ))}
          </StatusCardGrid>
          <div className={styles.actions}>
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={loading}
              onClick={() => void loadRequests()}
            >
              Refresh requests
            </button>
          </div>
          {requestRecords.length ? (
            <DataTable
              title="Recent requests"
              columns={columns}
              rows={requestRecords.slice(0, 5)}
              itemLabel="request"
              emptyTitle="No requests"
              emptyDescription="no requests for this account."
            />
          ) : (
            <EmptyState
              title="No requests found"
              description="an empty request list for this account returned."
            />
          )}
        </>
      ) : null}
    </section>
  );
}
