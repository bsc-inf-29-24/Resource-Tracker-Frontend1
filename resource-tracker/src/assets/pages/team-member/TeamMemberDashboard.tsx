import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { dashboardApi } from "../../data/api-services";
import ApiResponsePanel from "../management/ApiResponsePanel";
import styles from "../management/ApiManagementPage.module.css";

export default function TeamMemberDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await dashboardApi.overview());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The dashboard could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Team Member Dashboard"
        description="Your profile and dashboard information come from the authenticated backend session."
      />
      {user && (
        <section className={`rt-root rt-card ${styles.panel}`}>
          <h2>My profile</h2>
          <dl className={styles.apiDataFields}>
            <div className={styles.apiDataField}>
              <dt>Name</dt>
              <dd>{user.fullName}</dd>
            </div>
            <div className={styles.apiDataField}>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className={styles.apiDataField}>
              <dt>Department</dt>
              <dd>{user.department || "Not assigned"}</dd>
            </div>
            <div className={styles.apiDataField}>
              <dt>Team</dt>
              <dd>{user.team || "Not assigned"}</dd>
            </div>
          </dl>
        </section>
      )}
      <ApiResponsePanel
        title="Dashboard information"
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => void loadDashboard()}
      />
    </section>
  );
}
