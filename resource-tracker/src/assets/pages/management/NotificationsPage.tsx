import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CheckCheck,
  ClipboardList,
  FileText,
  MailOpen,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../data/api-services";
import { getApiRecords, type ApiRecord } from "../../data/api-response";
import styles from "./NotificationsPage.module.css";

type NotificationFilter = "all" | "unread";
type ConfirmAction = { type: "delete"; id: string } | { type: "clear" } | null;

function notificationMessage(notification: ApiRecord): string {
  const message = notification.message ?? notification.description ?? notification.title;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : "You have a new notification.";
}

function isRead(notification: ApiRecord): boolean {
  return notification.isRead === true || notification.read === true;
}

function getNotificationIcon(message: string): LucideIcon {
  const text = message.toLowerCase();
  if (/call|phone|dial/.test(text)) return Phone;
  if (/meeting|calendar|schedule/.test(text)) return CalendarDays;
  if (/note|document|report/.test(text)) return FileText;
  if (/message|comment|reply/.test(text)) return MessageSquare;
  if (/resource|allocation|stock/.test(text)) return Package;
  if (/user|contact|member|assign|ownership/.test(text)) return UserRound;
  if (/request|task|action|approval/.test(text)) return ClipboardList;
  return Bell;
}

function relativeTime(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const elapsedSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(elapsedSeconds);
  if (absoluteSeconds < 60) return "Moments ago";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [60 * 60, "hour"],
    [60 * 60 * 24, "day"],
    [60 * 60 * 24 * 7, "week"],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (let index = units.length - 1; index >= 0; index -= 1) {
    const [unitSeconds, unit] = units[index];
    if (absoluteSeconds >= unitSeconds || index === 0) {
      return formatter.format(Math.round(elapsedSeconds / unitSeconds), unit);
    }
  }
  return "";
}

function exactTime(value: unknown): string {
  if (typeof value !== "string") return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(date);
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApiRecord[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmError, setConfirmError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNotifications(getApiRecords(await notificationsApi.mine()));
    } catch (loadError) {
      setNotifications([]);
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

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !isRead(notification)),
    [notifications],
  );
  const visibleNotifications = filter === "unread"
    ? unreadNotifications
    : notifications;

  async function markAsRead(notificationId: string) {
    if (!user?.id) {
      setError("Your account could not be identified. Please sign in again.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await notificationsApi.markRead(notificationId, user.id);
      setNotice("Notification marked as read.");
      await loadNotifications();
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "Notification could not be marked as read.");
    } finally {
      setBusy(false);
    }
  }

  async function markAllAsRead() {
    if (!user?.id || unreadNotifications.length === 0) return;
    const ids = unreadNotifications
      .map((notification) => notification.id)
      .filter((id): id is string => typeof id === "string");
    if (ids.length === 0) {
      setError("The unread notifications do not include IDs required by the API.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    const results = await Promise.allSettled(
      ids.map((id) => notificationsApi.markRead(id, user.id)),
    );
    const failedCount = results.filter((result) => result.status === "rejected").length;
    await loadNotifications();
    if (failedCount) {
      setError(`${failedCount} notification${failedCount === 1 ? "" : "s"} could not be marked as read.`);
    } else {
      setNotice(`${ids.length} notification${ids.length === 1 ? "" : "s"} marked as read.`);
    }
    setBusy(false);
  }

  async function confirmDeletion() {
    if (!confirmAction || !user?.id) return;
    const ids = confirmAction.type === "clear"
      ? notifications
          .map((notification) => notification.id)
          .filter((id): id is string => typeof id === "string")
      : [confirmAction.id];

    if (ids.length === 0) {
      setConfirmError("No notification IDs were returned by the API.");
      return;
    }

    setBusy(true);
    setConfirmError("");
    setError("");
    setNotice("");
    const results = await Promise.allSettled(
      ids.map((id) => notificationsApi.remove(user.id, id)),
    );
    const failedCount = results.filter((result) => result.status === "rejected").length;
    setConfirmAction(null);
    await loadNotifications();
    if (failedCount) {
      setError(`${failedCount} notification${failedCount === 1 ? "" : "s"} could not be deleted.`);
    } else {
      setNotice(ids.length === 1 ? "Notification deleted." : "All notifications cleared.");
    }
    setBusy(false);
  }

  const pendingNotification = confirmAction?.type === "delete"
    ? notifications.find((notification) => notification.id === confirmAction.id)
    : undefined;

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader title="Notifications" description="Stay up to date with activity on your account." />
      <section className={`rt-root rt-card ${styles.panel}`} aria-label="Notifications">
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Filter notifications">
            <button type="button" className={filter === "all" ? styles.selectedFilter : styles.filterButton} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All <span>{notifications.length}</span>
            </button>
            <button type="button" className={filter === "unread" ? styles.selectedFilter : styles.filterButton} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>
              Unread <span>{unreadNotifications.length}</span>
            </button>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.textAction} onClick={() => void markAllAsRead()} disabled={busy || loading || unreadNotifications.length === 0}>
              <CheckCheck aria-hidden="true" size={16} />
              Mark all read
            </button>
            <button type="button" className={`${styles.textAction} ${styles.clearAction}`} onClick={() => { setConfirmError(""); setConfirmAction({ type: "clear" }); }} disabled={busy || loading || notifications.length === 0}>
              <Trash2 aria-hidden="true" size={16} />
              Clear all
            </button>
            <button type="button" className={styles.iconButton} aria-label="Refresh notifications" title="Refresh notifications" onClick={() => void loadNotifications()} disabled={busy || loading}>
              <RefreshCw aria-hidden="true" size={17} />
            </button>
          </div>
        </div>

        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}

        {loading ? (
          <p className={styles.state}>Loading notifications...</p>
        ) : visibleNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell aria-hidden="true" size={24} />
            <p>{filter === "unread" ? "You are all caught up." : "No notifications yet."}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {visibleNotifications.map((notification, index) => {
              const id = typeof notification.id === "string" ? notification.id : null;
              const message = notificationMessage(notification);
              const read = isRead(notification);
              const Icon = getNotificationIcon(message);
              const title = typeof notification.title === "string" && notification.title.trim()
                ? notification.title.trim()
                : message;
              const description = typeof notification.title === "string" && notification.title.trim()
                ? message
                : typeof notification.description === "string"
                  ? notification.description
                  : "";
              const rowId = id ?? `notification-${index}`;
              const detailsId = `notification-details-${index}`;
              const expanded = expandedId === rowId;

              return (
                <article className={`${styles.item} ${read ? styles.read : styles.unread}`} key={rowId}>
                  <button
                    type="button"
                    className={styles.expandButton}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    onClick={() => setExpandedId(expanded ? null : rowId)}
                  >
                    <span className={styles.itemIcon} aria-hidden="true"><Icon size={20} strokeWidth={1.7} /></span>
                    <span className={styles.content}>
                      <span className={styles.message}>{title}</span>
                      {description && <span className={styles.description}>{description}</span>}
                    </span>
                    <time className={styles.time} dateTime={typeof notification.createdAt === "string" ? notification.createdAt : undefined}>
                      {relativeTime(notification.createdAt)}
                    </time>
                    <ChevronDown className={`${styles.expandIcon} ${expanded ? styles.expandIconOpen : ""}`} aria-hidden="true" size={17} />
                  </button>
                  <div className={styles.itemActions}>
                    {!read && id && (
                      <button type="button" className={styles.iconButton} aria-label="Mark as read" title="Mark as read" disabled={busy} onClick={() => void markAsRead(id)}>
                        <MailOpen aria-hidden="true" size={16} />
                      </button>
                    )}
                    {id && (
                      <button type="button" className={`${styles.iconButton} ${styles.deleteButton}`} aria-label="Delete notification" title="Delete notification" disabled={busy} onClick={() => { setConfirmError(""); setConfirmAction({ type: "delete", id }); }}>
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className={styles.expandedDetails} id={detailsId}>
                      <p className={styles.expandedMessage}>{message}</p>
                      <dl className={styles.metadata}>
                        <div>
                          <dt>Received</dt>
                          <dd>{exactTime(notification.createdAt)}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>{read ? "Read" : "Unread"}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.type === "clear" ? "Clear all notifications?" : "Delete notification?"}
        message={confirmError || (confirmAction?.type === "clear"
          ? `This will delete all ${notifications.length} notifications. This action cannot be undone.`
          : `Delete "${pendingNotification ? notificationMessage(pendingNotification) : "this notification"}"?`)}
        confirmLabel={confirmAction?.type === "clear" ? "Clear all" : "Delete"}
        cancelLabel="Cancel"
        destructive
        loading={busy}
        onConfirm={() => void confirmDeletion()}
        onCancel={() => !busy && setConfirmAction(null)}
      />
    </section>
  );
}
