import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  assignableUserRoles,
  usersApi,
  type AssignableUserRole,
} from "../../data/api-services";
import { getApiRecords, type ApiRecord } from "../../data/api-response";
import ApiDataView from "./ApiDataView";
import styles from "./ApiManagementPage.module.css";

function isAssignableUserRole(value: string): value is AssignableUserRole {
  return assignableUserRoles.some((role) => role.value === value);
}

function displayRole(value: string): string {
  return (
    assignableUserRoles.find((role) => role.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

export default function EditUserPage() {
  const { id = "" } = useParams();
  const [user, setUser] = useState<ApiRecord | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const users = await usersApi.list();
      const selectedUser =
        getApiRecords(users).find((record) => String(record.id ?? "") === id) ??
        null;
      setUser(selectedUser);
      setRole(typeof selectedUser?.role === "string" ? selectedUser.role : "");
    } catch (loadError) {
      setUser(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "User details could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !id || !isAssignableUserRole(role)) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await usersApi.setRole(id, role);
      setUser((current) => (current ? { ...current, role } : current));
      setSuccess("User role updated successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The user role could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  const userName =
    typeof user?.fullName === "string" && user.fullName.trim()
      ? user.fullName.trim()
      : typeof user?.name === "string" && user.name.trim()
        ? user.name.trim()
        : "user";
  const canEditRole = user ? isAssignableUserRole(String(user.role ?? "")) : false;

  return (
    <section className={`rt-root ${styles.page}`}>
      {loading ? (
        <LoadingState message="Loading user details..." />
      ) : error && !user ? (
        <ErrorMessage
          title="User details could not be loaded"
          message={error}
          onRetry={() => void loadUser()}
        />
      ) : !user ? (
        <EmptyState
          title="User not found"
          description="The user list did not contain a record with this ID."
        />
      ) : (
        <>
          <PageHeader
            title={`Edit ${userName}`}
            description="Review the current account details and update the user's role."
          />
          {error && (
            <ErrorMessage title="User role not updated" message={error} />
          )}
          {success && (
            <p className={styles.notice} role="status">
              {success}
            </p>
          )}
          <section className={`rt-root rt-card ${styles.panel}`}>
            <h2>Current account details</h2>
            <ApiDataView data={user} />
          </section>
          <section className={`rt-root rt-card ${styles.panel}`}>
            <h2>Edit role</h2>
            <form className={styles.form} onSubmit={(event) => void saveRole(event)}>
              <label className={styles.field} htmlFor="edit-user-role">
                <span>Role</span>
                <select
                  id="edit-user-role"
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={!canEditRole || busy}
                >
                  {!isAssignableUserRole(role) && (
                    <option value={role}>{displayRole(role)}</option>
                  )}
                  {assignableUserRoles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {!canEditRole && (
                  <small>
                    The backend does not allow this account role to be changed.
                  </small>
                )}
              </label>
              <div className={styles.actions}>
                <Link
                  to={`/system-admin/users/${encodeURIComponent(id)}`}
                  className="rt-root rt-btn rt-btn--outline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="rt-root rt-btn rt-btn--primary"
                  disabled={busy || !canEditRole || role === user.role}
                >
                  {busy ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </section>
  );
}
