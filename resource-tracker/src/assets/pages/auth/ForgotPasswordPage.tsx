import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted
    ? !email.trim()
      ? "Enter your email address."
      : !emailPattern.test(email.trim())
        ? "Enter a valid email address."
        : ""
    : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="forgot-title">
      <p className={styles.eyebrow}>Account access</p>
      <h1 className={styles.title} id="forgot-title">
        Forgot password
      </h1>
      <p className={styles.description}>
        Enter your account email to request a password reset.
      </p>
      <p className={styles.notice}>
        Password recovery is unavailable because no recovery service is
        connected. This form will not send an email.
      </p>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="recovery-email">Email address</label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "recovery-email-error" : undefined}
            required
          />
          {emailError && (
            <p className={styles.fieldError} id="recovery-email-error" role="alert">
              {emailError}
            </p>
          )}
        </div>
        {submitted && !emailError && (
          <ErrorMessage
            title="Recovery service unavailable"
            message="No reset email was sent. Connect the password recovery service to continue."
          />
        )}
        <button className={styles.submit} type="submit">
          Request password reset
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}