import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { ApiError } from "../../data/api-client";
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

export default function ManagingDirectorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({});
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departmentCreating, setDepartmentCreating] = useState(false);
  const [departmentError, setDepartmentError] = useState("");

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
        nextErrors[key] = reason instanceof ApiError
          ? `${reason.message} (HTTP ${reason.status}; response: ${JSON.stringify(reason.responseBody)})`
          : reason instanceof Error ? reason.message : "The request failed.";
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
      setErrors((current) => ({ ...current, users: error instanceof Error ? error.message : "Users could not be loaded." }));
    } finally {
      setUsersLoading(false);
    }
  }, [usersLoading]);

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDepartmentError("");
    setDepartmentCreating(true);
    try {
      await departmentsApi.create({
        name: departmentName.trim(),
        ...(departmentCode.trim() ? { code: departmentCode.trim() } : {}),
        description: departmentDescription.trim(),
      }, { successToast: false });
      setDepartmentName("");
      setDepartmentCode("");
      setDepartmentDescription("");
      navigate("/managing-director/departments");
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
      {Object.values(errors).some(Boolean) && <ErrorMessage title="Some dashboard data could not be loaded" message={Object.entries(errors).filter(([, message]) => Boolean(message)).map(([key, message]) => `${key}: ${message}`).join("; ")} onRetry={() => void loadDashboard()} />}
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
            <input required minLength={3} maxLength={100} value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Enter department name" />
          </label>
          <label className={styles.departmentField}>
            <span>Department code</span>
            <input minLength={2} maxLength={20} value={departmentCode} onChange={(event) => setDepartmentCode(event.target.value)} placeholder="Optional code (e.g. FIN)" />
          </label>
          <label className={styles.departmentField}>
            <span>Description</span>
            <textarea maxLength={500} rows={3} value={departmentDescription} onChange={(event) => setDepartmentDescription(event.target.value)} placeholder="Describe the department" />
          </label>
          {departmentError && <p className={styles.error} role="alert">{departmentError}</p>}
          <div className={styles.actions}>
            <button type="submit" className="rt-root rt-btn rt-btn--primary" disabled={departmentCreating}>{departmentCreating ? "Creating…" : "Create department"}</button>
          </div>
        </form>
      </section>
      <ApiResponsePanel title="Users" data={data.users} loading={loading || usersLoading} error={errors.users} onRefresh={() => void loadUsers()} />
    </section>
  );
}
