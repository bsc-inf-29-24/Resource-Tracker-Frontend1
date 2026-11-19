import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../data/auth-store";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailError = submitted
    ? !email.trim()
      ? "Enter your email."
      : !emailPattern.test(email.trim())
        ? "Enter a valid email."
        : ""
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    setSuccess("");
    if (!email.trim() || !emailPattern.test(email.trim())) return;

    setBusy(true);
    try {
      const response = await requestPasswordReset(email.trim());
      setSuccess(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The password reset request could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={`rt-root ${styles.card}`}
      aria-labelledby="forgot-title"
    >
      <p className={styles.eyebrow}>Account Recovery</p>
     
      <p className={styles.description}>
        Enter your account email to request a password reset.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && (
          <p className={styles.fieldError} role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className={styles.notice} role="status">
            {success} Password reset completion is not available.
          </p>
        )}
        <div className={styles.field}>
          <label htmlFor="recovery-email">Email</label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "recovery-email-error" : undefined}
            required
          />
          {emailError && (
            <p
              className={styles.fieldError}
              id="recovery-email-error"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Sending request..." : "Request password reset"}
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}
