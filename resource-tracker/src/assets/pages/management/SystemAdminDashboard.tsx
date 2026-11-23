import { useCallback, useEffect, useState } from "react";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/StatusCard";
import { auditLogsApi, usersApi } from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import styles from "./ApiManagementPage.module.css";
import UsersPage from "./UsersPage";

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
  
      <StatusCardGrid>
        <StatusCard
          label="System users"
          value={arrayCount(data.users)}
          note="User returned by the API."
          loading={loading}
        />
        <StatusCard
          label="Audit log records"
          value={arrayCount(data.auditLogs)}
          note="Audit-log records returned by the API."
          loading={loading}
        />
      </StatusCardGrid>
      <UsersPage dashboard />
    </section>
  );
}
