import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../data/api-services";
import { getFrontendRoleFromBackendRole } from "../../data/auth-store";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

export default function NotificationsPage() {
  const { user } = useAuth();
  const isTeamLead =
    getFrontendRoleFromBackendRole(user?.role) === "TEAM_LEAD";
  const [data, setData] = useState<unknown>();
  const [notificationId, setNotificationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await notificationsApi.mine());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Notifications could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function mutate(
    operation: () => Promise<unknown>,
    message: string,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setData(await operation());
      setNotice(message);
      await loadNotifications();
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "The notification operation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title={isTeamLead ? "Team Lead Notifications" : "Notifications"}
        description={
          isTeamLead
            ? "Updates about your resource requests, including queries and review decisions."
            : undefined
        }
        supplementary={
          isTeamLead ? (
            <Link to="/team-lead/requests">View request history</Link>
          ) : undefined
        }
      />
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <ApiResponsePanel
        title={isTeamLead ? "Updates on your requests" : "My notifications"}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => void loadNotifications()}
        emptyTitle={
          isTeamLead ? "No request updates yet" : "No notifications yet"
        }
        emptyDescription={
          isTeamLead
            ? "Updates about queries and review decisions for your requests will appear here."
            : "The backend returned no notifications for your account."
        }
        noResponseTitle={
          isTeamLead ? "No request updates yet" : "No notifications yet"
        }
        noResponseDescription={
          isTeamLead
            ? "Updates about queries and review decisions for your requests will appear here."
            : "The backend returned no notifications for your account."
        }
      />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Notification actions</h2>
        <label className={styles.field} htmlFor="notification-id">
          <span>Notification ID</span>
          <input
            id="notification-id"
            value={notificationId}
            onChange={(event) => setNotificationId(event.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={busy || !notificationId.trim() || !user?.id}
            onClick={() =>
              void mutate(
                () =>
                  notificationsApi.markRead(
                    notificationId.trim(),
                    user?.id ?? "",
                  ),
                "The read operation completed.",
              )
            }
          >
            Mark as read
          </button>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--danger"
            disabled={busy || !notificationId.trim() || !user?.id}
            onClick={() => setConfirmDelete(true)}
          >
            Delete notification
          </button>
        </div>
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this notification?"
        message="This action will be sent to the backend and may not be reversible."
        confirmLabel="Delete notification"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void mutate(
            () =>
              notificationsApi.remove(
                user?.id ?? "",
                notificationId.trim(),
              ),
            "The delete operation completed.",
          );
        }}
      />
    </section>
  );
}
