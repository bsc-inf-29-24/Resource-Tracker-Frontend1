import type { ResourceRequest } from "../../types/resource-request";
import styles from "./RequestTimeline.module.css";

interface RequestTimelineProps {
    request: ResourceRequest;
    getUserName?: (userId: string) => string;
}

interface TimelineEntry {
    key: string;
    date: string;
    kind: "status" | "comment";
    title: string;
    detail?: string;
}

function buildEntries(
    request: ResourceRequest,
    getUserName: (id: string) => string
): TimelineEntry[] {
    const statusEntries: TimelineEntry[] = request.history.map((change, i) => ({
        key: `status-${i}`,
        date: change.changedAt,
        kind: "status",
        title: `Status changed to ${change.status}`,
        detail: change.note
        ? `${change.note} (by ${getUserName(change.changedBy)})`
        : `by ${getUserName(change.changedBy)}`,

    }));

    const commentEntries: TimelineEntry[] = request.comments.map((comment) => ({
    key: `comment-${comment.id}`,
    date: comment.createdAt,
    kind: "comment",
    title: `${comment.authorName} commented`,
    detail: comment.message,
  }));

  return [...statusEntries, ...commentEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestTimeline({
  request,
  getUserName = (id) => id,
}: RequestTimelineProps) {
  const entries = buildEntries(request, getUserName);

  if (entries.length === 0) {
    return <p className={styles.empty}>No history yet for this request.</p>;
  }

  return (
    <ol className={styles.list} aria-label="Request history">
      {entries.map((entry) => (
        <li
          key={entry.key}
          className={`${styles.item} ${
            entry.kind === "comment" ? styles.comment : styles.status
          }`}
        >
          <time className={styles.date} dateTime={entry.date}>
            {formatTimestamp(entry.date)}
          </time>
          <p className={styles.title}>{entry.title}</p>
          {entry.detail && <p className={styles.detail}>{entry.detail}</p>}
        </li>
      ))}
    </ol>
  );
}