import { Link } from "react-router-dom";
import styles from "./AuthPage.module.css";

export default function ResetPasswordPage() {
  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="reset-title">
      <Link className={styles.backLink} to="/login">
        Back to sign in
      </Link>
      <h1 className={styles.title} id="reset-title">
        Password reset unavailable
      </h1>
      <p className={styles.description}>
        The backend accepts password-reset requests, but does not document an
        endpoint for completing a password reset. Contact your System
        Administrator to regain access.
      </p>
      <div className={styles.links}>
        <Link to="/forgot-password">Request password reset instructions</Link>
      </div>
    </section>
  );
}
