import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import styles from "./AuthPage.module.css";

const minimumPasswordLength = 8;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const hasResetToken = Boolean(searchParams.get("token")?.trim());
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordError =
    submitted && !password
      ? "Enter a new password."
      : submitted && password.length < minimumPasswordLength
        ? `Use at least ${minimumPasswordLength} characters.`
        : "";
  const confirmationError =
    submitted && !confirmation
      ? "Confirm your new password."
      : submitted && password !== confirmation
        ? "The passwords do not match."
        : "";
  const hasValidationErrors =
    !password ||
    password.length < minimumPasswordLength ||
    !confirmation ||
    password !== confirmation;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="reset-title">
      <p className={styles.eyebrow}>Account access</p>
      <h1 className={styles.title} id="reset-title">
        Reset password
      </h1>
      <p className={styles.description}>
        Choose a new password for your account.
      </p>
      <p className={styles.policy}>
        Use at least {minimumPasswordLength} characters. Passwords must match.
      </p>
      {!hasResetToken && (
        <p className={styles.notice} role="status">
          No reset token was provided. A valid token must be issued and
          verified by the password recovery service.
        </p>
      )}
      {submitted && !hasValidationErrors && (
        <ErrorMessage
          title="Password not changed"
          message={
            hasResetToken
              ? "A secure password reset service is not connected. Your password was not changed."
              : "A valid reset token and secure password reset service are required. Your password was not changed."
          }
        />
      )}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="new-password">New password</label>
          <div className={styles.passwordControl}>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "new-password-error" : undefined}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide new password" : "Show new password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError && (
            <p className={styles.fieldError} id="new-password-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="confirm-password">Confirm new password</label>
          <div className={styles.passwordControl}>
            <input
              id="confirm-password"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-invalid={Boolean(confirmationError)}
              aria-describedby={confirmationError ? "confirm-password-error" : undefined}
              required
            />
            <button
              type="button"
              aria-label={
                showConfirmation
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
              aria-pressed={showConfirmation}
              onClick={() => setShowConfirmation((visible) => !visible)}
            >
              {showConfirmation ? "Hide" : "Show"}
            </button>
          </div>
          {confirmationError && (
            <p className={styles.fieldError} id="confirm-password-error" role="alert">
              {confirmationError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit">
          Reset password
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}