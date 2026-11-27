import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import {
  flattenApiRecord,
  formatApiValue,
  isApiRecord,
  humanizeApiKey,
  unwrapApiResponse,
} from "../../data/api-response";
import { resourceRequestsApi } from "../../data/api-services";
import styles from "./QueryResponsePage.module.css";

type RequestRecord = Record<string, unknown>;

export default function QueryResponsePage() {
  const { id } = useParams();
  const [request, setRequest] = useState<RequestRecord>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!id) {
      setError("A request ID is required.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    void resourceRequestsApi.get(id).then((response) => {
      const record = unwrapApiResponse(response);
      if (!isApiRecord(record)) {
        throw new Error("The request-details endpoint returned an unexpected response.");
      }
      if (active) setRequest(record);
    }).catch((loadError: unknown) => {
      if (active) {
        setRequest(undefined);
        setError(loadError instanceof Error
          ? loadError.message
          : "Request details could not be loaded.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [id]);

  const details = request ? flattenApiRecord(request) : {};
  const reviewNote = request?.reviewNote ?? request?.queryNote ?? request?.note;

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Request query"
        description="View the query and request details recorded by the backend."
      />
      {loading ? (
        <LoadingState message="Loading request details..." />
      ) : error ? (
        <ErrorMessage title="Request unavailable" message={error} />
      ) : request ? (
        <>
          <section className={`rt-root rt-card ${styles.requestCard}`}>
            <h2>{String(request.id ?? id)} · {String(request.itemDescription ?? "Resource request")}</h2>
            {reviewNote ? (
              <p>{formatApiValue(reviewNote)}</p>
            ) : (
              <p>No query note was included in the backend response.</p>
            )}
            <dl className={styles.requestDetails}>
              {Object.entries(details).map(([key, value]) => (
                <div key={key}>
                  <dt>{humanizeApiKey(key)}</dt>
                  <dd>{formatApiValue(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <ErrorMessage
            title="Response submission is not available"
            message="The current backend Swagger API documents reading and updating resource requests, but does not document a Team Lead query-response operation or payload. No response was submitted or saved locally."
          />
        </>
      ) : null}
    </section>
  );
}
