import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardPathForRole } from "../../data/auth-store";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, isLoading, sessionError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isLoading) {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [navigate, user, isLoading]);

  const emailError = submitted
    ? !email.trim()
      ? "Enter your email."
      : !emailPattern.test(email.trim())
        ? "Enter a valid email."
        : ""
    : "";
  const passwordError = submitted && !password ? "Enter your password." : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");

    if (!email.trim() || !emailPattern.test(email.trim()) || !password) return;

    setBusy(true);
    try {
      const authenticatedUser = await login(email.trim(), password);
      navigate(getDashboardPathForRole(authenticatedUser.role), { replace: true });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="login-title">
      <p className={styles.eyebrow}>Welcome Back!</p>
      <h1 id="login-title" className={styles.title}>
        Sign in
      </h1>

      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
      {sessionError && (
        <p className={styles.fieldError} role="alert">
          Your saved session could not be restored: {sessionError}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            required
          />
          {emailError && (
            <p
              className={styles.fieldError}
              id="login-email-error"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password">Password</label>
          <div className={styles.passwordControl}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "login-password-error" : undefined
              }
              required
            />

            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {passwordError && (
            <p
              className={styles.fieldError}
              id="login-password-error"
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={busy || isLoading}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className={styles.links}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </div>
    </section>
  );
}
