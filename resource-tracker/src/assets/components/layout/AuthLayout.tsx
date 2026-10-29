import { Link, Outlet } from "react-router-dom";
import styles from "./AuthLayout.module.css";

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.brandPanel}>
        <Link className={styles.brand} to="/login">
          <span className={styles.brandMark} aria-hidden="true">
            RT
          </span>
        </Link>
        <div className={styles.brandContent}>
          <h1>Real-time Resource Tracking System</h1>
          <p>
            Manage resource requests, review decisions and track resource
            allocation in one place.
          </p>
          <div className={styles.brandTags} aria-label="System benefits">
            <span>Safe</span>
            <span>Trusted</span>
            <span>Efficient</span>
          </div>
        </div>
      </aside>
      <main className={styles.formPanel}>
        <Outlet />
      </main>
    </div>
  );
}
