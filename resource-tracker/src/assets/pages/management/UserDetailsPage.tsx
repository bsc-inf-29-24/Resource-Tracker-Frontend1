import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { usersApi } from "../../data/api-services";
import { getApiRecords } from "../../data/api-response";
import ApiDataView from "./ApiDataView";
import styles from "./ApiManagementPage.module.css";

export default function UserDetailsPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await usersApi.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "User records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const user = getApiRecords(data).find(
    (item) => String(item.id ?? "") === id,
  );

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="User account details"
        description="The user-list response is inspected without assuming undocumented fields."
      />
      <Link to="/system-admin/users" className="rt-root rt-btn rt-btn--outline">
        Back to users
      </Link>
      {loading ? (
        <LoadingState message="Loading backend user records..." />
      ) : error ? (
        <ErrorMessage
          title="User records could not be loaded"
          message={error}
          onRetry={() => void loadUsers()}
        />
      ) : user ? (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <ApiDataView data={user} />
          <Link
            to={`/system-admin/users/${encodeURIComponent(id)}/edit`}
            className="rt-root rt-btn rt-btn--primary"
          >
            Edit role assignment
          </Link>
        </section>
      ) : data !== undefined ? (
        <EmptyState
          title="User not found"
          description="The user list did not contain a record with this ID."
        />
      ) : (
        <EmptyState
          title="No user data"
          description="The user list returned no data. Refresh to try again."
        />
      )}
    </section>
  );
}
