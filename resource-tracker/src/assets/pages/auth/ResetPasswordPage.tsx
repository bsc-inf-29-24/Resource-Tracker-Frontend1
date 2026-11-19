import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../../data/auth-store";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^[0-9]{6}$/.test(code.trim())) {
      setError("Enter the 6-digit reset code from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await resetPassword(email.trim(), code.trim(), password);
      setSuccess(response.message || "Your password was reset successfully.");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "The password could not be reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="reset-title">
      <Link className={styles.backLink} to="/login">Back to sign in</Link>
      <p className={styles.eyebrow}>Account Recovery</p>
      <h1 className={styles.title} id="reset-title">Reset password</h1>
      <p className={styles.description}>Enter the email address, 6-digit code, and new password from the reset email.</p>
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
      {success && <p className={styles.notice} role="status">{success}</p>}
      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className={styles.field}>
          <label htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="reset-code">Reset code</label>
          <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="reset-password">New password</label>
          <input id="reset-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="reset-confirm-password">Confirm new password</label>
          <input id="reset-confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Resetting password..." : "Reset password"}</button>
      </form>
      <div className={styles.links}><Link to="/forgot-password">Request a new reset code</Link></div>
    </section>
  );
}
