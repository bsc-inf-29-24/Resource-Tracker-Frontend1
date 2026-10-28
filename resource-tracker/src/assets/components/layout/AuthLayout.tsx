import { Link, Outlet } from "react-router-dom";
import styles from "./AuthLayout.module.css";

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/login">
          <span className={styles.brandMark} aria-hidden="true">
            RT
          </span>
          <span>Resource Tracker</span>
        </Link>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        Resource Tracker · Demo sign-in is stored in this browser and is not production authentication.
      </footer>
    </div>
  );
}
