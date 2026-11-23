import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../data/api-services";
import { getFrontendRoleFromBackendRole } from "../../data/auth-store";
import { getApiRecords, formatApiValue } from "../../data/api-response";
import ApiResponsePanel from "./ApiResponsePanel";
import styles from "./ApiManagementPage.module.css";

export default function NotificationsPage() {
  const { user } = useAuth();
  const isTeamLead =
    getFrontendRoleFromBackendRole(user?.role) === "TEAM_LEAD";
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  const notifications = getApiRecords(data);
  const unreadCount = notifications.filter((notification) => notification.isRead === false).length;

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
      />
      <section className={`rt-root rt-card ${styles.panel}`} aria-label="Notifications">
        <h2>{unreadCount} unread of {notifications.length} notifications</h2>
        {notifications.map((notification, index) => {
          const id = notification.id;
          const isRead = notification.isRead === true || notification.read === true;
          return <article className={styles.apiDataField} key={String(id ?? index)}>
            <h3>{String(notification.title ?? notification.name ?? "Notification")}</h3>
            <p>{formatApiValue(notification.description ?? notification.message)}</p>
            <small>{formatApiValue(notification.createdAt ?? notification.created_at ?? notification.date)} · {isRead ? "Read" : "Unread"}</small>
            {typeof id === "string" && !isRead && <button type="button" className="rt-root rt-btn rt-btn--outline" disabled={busy} onClick={() => void mutate(() => notificationsApi.markRead(id, user?.id ?? ""), "Notification marked as read.")}>Mark as read</button>}
          </article>;
        })}
      </section>
    </section>
  );
}
