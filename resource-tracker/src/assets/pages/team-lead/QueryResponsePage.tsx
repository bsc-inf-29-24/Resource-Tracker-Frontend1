import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import RequestTimeline from "../../components/requests/RequestTimeline";
import { mockUsers } from "../../data/mock-data";
import {
  addTeamLeadResponse,
  hasPendingTeamLeadResponse,
  TEAM_LEAD_ID,
  useResourceRequests,
} from "../../data/request-store";
import styles from "./QueryResponsePage.module.css";

export default function QueryResponsePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, persistenceWarning } = useResourceRequests();
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const request = requests.find(
    (item) => item.id === id && item.requestedById === TEAM_LEAD_ID
  );
  const pendingResponse = request ? hasPendingTeamLeadResponse(request) : false;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      setValidationError("Enter the additional information requested.");
      return;
    }

    setValidationError("");
    setSubmitError("");
    try {
      addTeamLeadResponse(id ?? "", message);
      setSubmitted(true);
      setMessage("");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "The response could not be saved."
      );
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Respond to request query"
        description="Provide the additional information requested by the Line Manager."
        supplementary={<Link to="/team-lead/requests">Request history</Link>}
      />
      {persistenceWarning && (
        <ErrorMessage title="Using demo request data" message={persistenceWarning} />
      )}
      {!request ? (
        <ErrorMessage
          title="Request not found"
          message="This request is not available in the Team Lead preview account's request data."
        />
      ) : (
        <>
          <section className={`rt-root rt-card ${styles.requestCard}`}>
            <h2>{request.id} · {request.itemDescription}</h2>
            <p>{request.summary}</p>
            <RequestTimeline
              request={request}
              getUserName={(userId) =>
                mockUsers.find((user) => user.id === userId)?.name ?? userId
              }
            />
          </section>

          {submitError && (
            <ErrorMessage title="Response not saved" message={submitError} />
          )}
          {submitted && (
            <p className={styles.success} role="status">
              Your response was saved in this browser, and the request returned to Pending review.
            </p>
          )}
          {pendingResponse ? (
            <form className={`rt-root rt-card ${styles.form}`} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor="query-response">Additional information <span aria-hidden="true">*</span></label>
                <textarea
                  id="query-response"
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setValidationError("");
                    setSubmitError("");
                  }}
                  rows={5}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? "query-response-error" : undefined}
                  required
                />
                {validationError && (
                  <p className={styles.fieldError} id="query-response-error" role="alert">
                    {validationError}
                  </p>
                )}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="rt-root rt-btn rt-btn--outline"
                  onClick={() => navigate("/team-lead/requests")}
                >
                  Cancel
                </button>
                <button type="submit" className="rt-root rt-btn rt-btn--primary">
                  Submit response
                </button>
              </div>
            </form>
          ) : !submitted ? (
            <p className={styles.notice} role="status">
              This request is not waiting for a Team Lead response.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
