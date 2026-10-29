import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DEMO_PASSWORD, signInDemoUser } from "../../data/auth-store";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import styles from "./AuthPage.module.css";
import AuthLayout from "./AuthLayout";
import { mockUsers } from "../../data/mock-data"; 
import { Eye, EyeOff } from "lucide-react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleHome: Record<string, string> = {
  "team-lead": "/team-lead/dashboard",
  "line-manager": "/line-manager/dashboard",
  "department-manager": "/department-manager/dashboard",
  "system-admin": "/system-admin/dashboard",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      const account = await signInDemoUser(email.trim(), password);
      navigate(roleHome[account.role], { replace: true });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Sign-in failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="login-title">
      <p className={styles.eyebrow}>Welcome Back</p>
      <h1 id="login-title" className={styles.title}>
        Sign in
      </h1>
      
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            required
          />
          {emailError && (
            <p className={styles.fieldError} id="login-email-error" role="alert">
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
              aria-describedby={passwordError ? "login-password-error" : undefined}
              required
            />
      
            <button
              type="button"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
             aria-pressed={showPassword}
              onClick={() =>
                setShowPassword((visible) => !visible)
              }
            >
              {showPassword ? <EyeOff/> : <Eye/>}
            </button>
          </div>
          {passwordError && (
            <p className={styles.fieldError} id="login-password-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

  
      <div className={styles.links}>
         <Link to="/register">Sign up</Link>
        <Link to="/forgot-password">Forgot your password?</Link>
        
      </div>

      
    </section>
  );
}



/*defining the dashboard routes for each user role, 
 which will be used to navigate to the appropriate dashboard after a successful login.*/
const dashboardRoutes: Record<string, string> = {
  TEAM_LEAD: "/team-lead/dashboard",
  LINE_MANAGER: "/line-manager/dashboard",
  DEPARTMENT_MANAGER: "/department-manager/dashboard",
  SYSTEM_ADMIN: "/admin/dashboard",
};
