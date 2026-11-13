import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/StatusCard";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import {
  departmentsApi,
  projectsApi,
  resourceRequestsApi,
  teamsApi,
  usersApi,
} from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

type DashboardData = {
  users?: unknown;
  departments?: unknown;
  teams?: unknown;
  projects?: unknown;
  requests?: unknown;
};

type DashboardErrors = Partial<Record<keyof DashboardData, string>>;

function arrayCount(value: unknown): number | string {
  return value === undefined ? "Unavailable" : getApiRecords(value).length;
}

export default function ManagingDirectorDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const results = await Promise.allSettled([
      usersApi.list(),
      departmentsApi.list(),
      teamsApi.list(),
      projectsApi.list(),
      resourceRequestsApi.list(),
    ]);
    const keys: (keyof DashboardData)[] = [
      "users",
      "departments",
      "teams",
      "projects",
      "requests",
    ];
    const nextData: DashboardData = {};
    const nextErrors: DashboardErrors = {};
    results.forEach((result, index) => {
      const key = keys[index];
      if (!key) return;
      if (result.status === "fulfilled") nextData[key] = result.value;
      else {
        nextErrors[key] =
          result.reason instanceof Error
            ? result.reason.message
            : "The request failed.";
      }
    });
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Managing Director"
        description=""
      />
      {Object.values(errors).some(Boolean) && (
        <ErrorMessage
          title="Some dashboard data could not be loaded"
          message="Review each endpoint response below. Failed API requests are not replaced with sample values."
          onRetry={() => void loadDashboard()}
        />
      )}
      <StatusCardGrid>
        <StatusCard
          label="Users returned"
          value={arrayCount(data.users)}
          loading={loading}
        />
        <StatusCard
          label="Departments returned"
          value={arrayCount(data.departments)}
          loading={loading}
        />
        <StatusCard
          label="Teams returned"
          value={arrayCount(data.teams)}
          loading={loading}
        />
        <StatusCard
          label="Projects returned"
          value={arrayCount(data.projects)}
          loading={loading}
        />
        <StatusCard
          label="Requests returned"
          value={arrayCount(data.requests)}
          loading={loading}
        />
      </StatusCardGrid>
      <div className={styles.actions}>
        <Link
          className="rt-root rt-btn rt-btn--outline"
          to="/managing-director/departments"
        >
          View departments
        </Link>
        <Link
          className="rt-root rt-btn rt-btn--outline"
          to="/managing-director/requests"
        >
          View requests
        </Link>
        <Link
          className="rt-root rt-btn rt-btn--outline"
          to="/managing-director/reports"
        >
          View reports
        </Link>
        <button
          type="button"
          className="rt-root rt-btn rt-btn--outline"
          disabled={loading}
          onClick={() => void loadDashboard()}
        >
          Refresh
        </button>
      </div>
      {(
        ["users", "departments", "teams", "projects", "requests"] as const
      ).map((key) => (
        <ApiResponsePanel
          key={key}
          title={key === "requests" ? "Recent resource requests" : key}
          data={data[key]}
          loading={loading}
          error={errors[key]}
        />
      ))}
    </section>
  );
}
