import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import StatusCard, {
  StatusCardGrid,
} from "../../components/cards/statusCard";
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
  const [usersLoading, setUsersLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departmentCreating, setDepartmentCreating] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const [departmentSuccess, setDepartmentSuccess] = useState("");

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
        const reason = result.reason;
        console.error(`Managing Director ${key} data could not be loaded`, reason);
        nextErrors[key] = `${key} data could not be loaded. Please try again.`;
      }
    });
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    if (usersLoading) return;
    setUsersLoading(true);
    setErrors((current) => ({ ...current, users: undefined }));
    try {
      const users = await usersApi.list();
      setData((current) => ({ ...current, users }));
    } catch (error) {
      console.error("Managing Director users could not be loaded", error);
      setErrors((current) => ({ ...current, users: "User data could not be loaded. Please try again." }));
    } finally {
      setUsersLoading(false);
    }
  }, [usersLoading]);

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDepartmentError("");
    setDepartmentSuccess("");
    setDepartmentCreating(true);
    try {
      await departmentsApi.create({
        name: departmentName.trim(),
        description: departmentDescription.trim(),
      });
      setDepartmentSuccess("Department created successfully.");
      setDepartmentName("");
      setDepartmentDescription("");
      await loadDashboard();
    } catch (error) {
      setDepartmentError(error instanceof Error ? error.message : "The department could not be created.");
    } finally {
      setDepartmentCreating(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Managing Director"
        description=""
      />
      {Object.entries(errors).some(([key, message]) => key !== "users" && Boolean(message)) && <ErrorMessage title="Dashboard data unavailable" message={Object.entries(errors).filter(([key, message]) => key !== "users" && Boolean(message)).map(([, message]) => message).join(" ")} onRetry={() => void loadDashboard()} />}
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
      </div>
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Create department</h2>
        <form className={styles.departmentForm} onSubmit={(event) => void createDepartment(event)}>
          <label className={styles.departmentField}>
            <span>Department name</span>
            <input required maxLength={255} value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Enter department name" />
          </label>
          <label className={styles.departmentField}>
            <span>Description</span>
            <textarea required maxLength={500} rows={3} value={departmentDescription} onChange={(event) => setDepartmentDescription(event.target.value)} placeholder="Describe the department" />
          </label>
          {departmentError && <p className={styles.error} role="alert">{departmentError}</p>}
          {departmentSuccess && <p className={styles.success} role="status">{departmentSuccess}</p>}
          <div className={styles.actions}>
            <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={departmentCreating}>{departmentCreating ? "Creating…" : "Create department"}</button>
          </div>
        </form>
      </section>
      <ApiResponsePanel title="Users" data={data.users} loading={loading || usersLoading} error={errors.users} errorTitle="Users unavailable" onRefresh={() => void loadUsers()} />
    </section>
  );
}
