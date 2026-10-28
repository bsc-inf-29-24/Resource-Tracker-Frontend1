import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import RequestDetails from "../../components/requests/RequestDetails";
import RequestTimeline from "../../components/requests/RequestTimeline";
import { useResourceRequests, addRequestQuery, recordDecision } from "../../data/request-store";
import { mockUsers } from "../../data/mock-data";
import { canReviewRequest } from "../../utils/status";
import styles from "./RequestReviewDetailsPage.module.css";

type ActionMode = "query" | "reject";

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be updated.";
}

export default function RequestReviewDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { requests, persistenceWarning } = useResourceRequests();
  const request = requests.find((item) => item.id === id);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);
  const [actionText, setActionText] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  function closeActionForm() {
    setActionMode(null);
    setActionText("");
    setFormError("");
  }

  function handleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request || !actionMode || submitting.current) return;

    const text = actionText.trim();
    if (!text) {
      setFormError(
        actionMode === "query"
          ? "Enter the information needed before submitting the query."
          : "Enter a reason before rejecting this request."
      );
      return;
    }

    submitting.current = true;
    setBusy(true);
    setFormError("");
    setNotice(null);
    try {
      if (actionMode === "query") {
        addRequestQuery(request.id, text);
        setNotice({ kind: "success", text: "Query sent and saved in this browser." });
      } else {
        recordDecision(request.id, "Rejected", text);
        setNotice({ kind: "success", text: "Request rejected and decision history updated." });
      }
      closeActionForm();
    } catch (error) {
      setFormError(messageFromError(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function handleApprove() {
    if (!request || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice(null);
    try {
      recordDecision(request.id, "Approved");
      setConfirmOpen(false);
      setNotice({ kind: "success", text: "Request approved and decision history updated." });
    } catch (error) {
      setConfirmOpen(false);
      setNotice({ kind: "error", text: messageFromError(error) });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (!request) {
    return (
      <section className={`rt-root ${styles.page}`}>
        <Link className={styles.backLink} to="/line-manager/requests">
          Back to requests
        </Link>
        {persistenceWarning && (
          <p className={styles.warning} role="alert">
            {persistenceWarning}
          </p>
        )}
        <h1>Request not found</h1>
        <p>
          {id ? `No request with ID ${id} is available in this browser.` : "A request ID was not provided."}
        </p>
        <Link className="rt-btn rt-btn--primary" to="/line-manager/dashboard">
          Return to dashboard
        </Link>
      </section>
    );
  }

  const actionable = canReviewRequest(request);

  return (
    <div className={`rt-root ${styles.page}`}>
      <div className={styles.topActions}>
        <Link className={styles.backLink} to="/line-manager/requests">
          Back to requests
        </Link>
        <Link
          className={styles.historyLink}
          to={`/line-manager/decisions?requestId=${encodeURIComponent(request.id)}`}
        >
          View decision history
        </Link>
      </div>

      {persistenceWarning && (
        <p className={styles.warning} role="alert">
          {persistenceWarning}
        </p>
      )}
      {notice && (
        <p
          className={notice.kind === "success" ? styles.success : styles.error}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}

      <RequestDetails
        request={request}
        actions={
          actionable ? (
            <>
              <button
                type="button"
                className="rt-btn rt-btn--outline"
                onClick={() => {
                  setActionMode("query");
                  setActionText("");
                  setFormError("");
                }}
              >
                Query request
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
              >
                Approve request
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--danger"
                onClick={() => {
                  setActionMode("reject");
                  setActionText("");
                  setFormError("");
                }}
              >
                Reject request
              </button>
            </>
          ) : (
            <p className={styles.readOnlyNotice}>
              This request is not currently awaiting a Line Manager decision.
            </p>
          )
        }
      />

      {actionMode && actionable && (
        <form className={styles.actionForm} onSubmit={handleActionSubmit}>
          <h2>{actionMode === "query" ? "Query this request" : "Reject this request"}</h2>
          <label htmlFor="request-action-text">
            {actionMode === "query" ? "Information required" : "Rejection reason"}
          </label>
          <textarea
            id="request-action-text"
            rows={5}
            value={actionText}
            onChange={(event) => {
              setActionText(event.target.value);
              if (formError) setFormError("");
            }}
            aria-invalid={Boolean(formError)}
            aria-describedby={formError ? "request-action-error" : undefined}
            required
          />
          {formError && (
            <p id="request-action-error" className={styles.error} role="alert">
              {formError}
            </p>
          )}
          <div className={styles.formActions}>
            <button type="button" className="rt-btn rt-btn--outline" onClick={closeActionForm} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="rt-btn rt-btn--primary" disabled={busy}>
              {busy ? "Saving..." : actionMode === "query" ? "Send query" : "Confirm rejection"}
            </button>
          </div>
        </form>
      )}

      <section className={`rt-root rt-card ${styles.history}`} aria-labelledby="request-history-title">
        <h2 id="request-history-title" className="rt-card__title">
          Request history
        </h2>
        <RequestTimeline
          request={request}
          getUserName={(userId) => mockUsers.find((user) => user.id === userId)?.name ?? userId}
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Approve this request?"
        message={`Confirm approval of ${request.id} for ${request.itemDescription}.`}
        confirmLabel="Approve request"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleApprove}
        loading={busy}
      />
    </div>
  );
}
