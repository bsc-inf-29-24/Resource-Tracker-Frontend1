import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/StatusCard";
import PageHeader from "../../components/layout/PageHeader";
import { auditLogsApi, usersApi } from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

type DashboardData = {
  users?: unknown;
  auditLogs?: unknown;
};

type DashboardErrors = Partial<Record<keyof DashboardData, string>>;

function arrayCount(value: unknown): number | string {
  return value === undefined ? "Unavailable" : getApiRecords(value).length;
}

export default function SystemAdminDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const results = await Promise.allSettled([
      usersApi.list(),
      auditLogsApi.list(),
    ]);
    const nextData: DashboardData = {};
    const nextErrors: DashboardErrors = {};
    const keys: (keyof DashboardData)[] = ["users", "auditLogs"];
    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === "fulfilled") {
        nextData[key] = result.value;
      } else {
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
        title="System Administrator"
        description="User and audit-log information comes from endpoints documented for System Administrators. No unguarded dashboard or department endpoint is used."
      />
      <StatusCardGrid>
        <StatusCard
          label="Users returned"
          value={arrayCount(data.users)}
          note="Counted from the user-list records returned by the API."
          loading={loading}
        />
        <StatusCard
          label="Audit log records returned"
          value={arrayCount(data.auditLogs)}
          note="Counted from audit-log records returned by the API."
          loading={loading}
        />
      </StatusCardGrid>
      <div className={styles.actions}>
        <Link
          to="/system-admin/users"
          className="rt-root rt-btn rt-btn--outline"
        >
          Manage users
        </Link>
        <Link
          to="/system-admin/users/new"
          className="rt-root rt-btn rt-btn--primary"
        >
          Create user
        </Link>
      </div>
      <ApiResponsePanel
        title="Users"
        data={data.users}
        loading={loading}
        error={errors.users}
        onRefresh={() => void loadDashboard()}
      />
      <ApiResponsePanel
        title="Recent audit activity"
        data={data.auditLogs}
        loading={loading}
        error={errors.auditLogs}
        onRefresh={() => void loadDashboard()}
      />
    </section>
  );
}
