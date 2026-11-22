import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import { getApiRecords } from "../../data/api-response";
import type { ApiRecord } from "../../data/api-response";
import { departmentsApi } from "../../data/api-services";
import ApiResponsePanel from "../management/ApiResponsePanel";
import styles from "./DepartmentRequestDetailsPage.module.css";
import useDepartmentScope from "./useDepartmentScope";

export default function DepartmentRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { department, loading: scopeLoading, error: scopeError, reload } =
    useDepartmentScope();
  const [request, setRequest] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequest() {
    if (!department || !id) return;
    setLoading(true);
    setError("");
    try {
      const response = await departmentsApi.requests(String(department.id));
      const matched = getApiRecords(response).find(
        (record) => String(record.id ?? "") === id,
      );
      setRequest(matched ?? null);
      if (!matched) {
        setError("This request was not returned for your department.");
      }
    } catch (loadError) {
      setRequest(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The department request could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (department && id) void loadRequest();
  }, [department?.id, id]);

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
    <div className={styles.page}>
      <div className={styles.topActions}>
        <Link className={styles.backLink} to="/department-manager/requests">
          Back to requests
        </Link>
        <Link className={styles.backLinkSecondary} to="/department-manager/dashboard">
          Return to dashboard
        </Link>
      </div>
      {error && (
        <ErrorMessage
          title="Request unavailable"
          message={error}
          onRetry={() => void loadRequest()}
        />
      )}
      {loading ? (
        <LoadingState message="Loading department request..." />
      ) : request ? (
        <ApiResponsePanel
          title="Department request details"
          data={request}
          emptyTitle="Request details unavailable"
          emptyDescription="The backend returned no details for this request."
        />
      ) : null}
    </div>
  );
}
