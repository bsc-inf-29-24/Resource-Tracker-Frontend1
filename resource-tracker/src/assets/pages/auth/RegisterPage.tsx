import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import {
  availableDepartments,
  supportedRoles,
  type UserDraft,
} from "../../data/user-store";
import { registerDemoUser } from "../../data/auth-store";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleHome: Record<UserDraft["role"], string> = {
  "team-lead": "/team-lead/dashboard",
  "line-manager": "/line-manager/dashboard",
  "department-manager": "/department-manager/dashboard",
  "system-admin": "/system-admin/dashboard",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<UserDraft>({
    name: "",
    email: "",
    department: "",
    role: "team-lead",
    team: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const errors = {
    name: submitted && !form.name.trim() ? "Enter your name." : "",
    email:
      submitted && !form.email.trim()
        ? "Enter your email address."
        : submitted && !emailPattern.test(form.email.trim())
          ? "Enter a valid email address."
          : "",
    department:
      submitted && !availableDepartments.some((item) => item.name === form.department)
        ? "Select an available department."
        : "",
    password:
      submitted && password.length < 8
        ? "Use at least 8 characters for the password."
        : "",
    confirmPassword:
      submitted && confirmPassword !== password
        ? "The passwords do not match."
        : "",
  };

  function updateField<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (
      !form.name.trim() ||
      !emailPattern.test(form.email.trim()) ||
      !availableDepartments.some((item) => item.name === form.department) ||
      password.length < 8 ||
      confirmPassword !== password
    ) {
      return;
    }

    setBusy(true);
    try {
      const account = await registerDemoUser(form, password);
      navigate(roleHome[account.role], { replace: true });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "The test account could not be created. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="register-title">
      <p className={styles.eyebrow}>Resource Tracker · Demo</p>
      <h1 id="register-title" className={styles.title}>
        Create a test account
      </h1>
      <p className={styles.description}>
        This creates a browser-local account for testing. It is not a secure production registration.
      </p>
      {error && <ErrorMessage title="Could not create account" message={error} />}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            required
          />
          {errors.name && <p className={styles.fieldError} id="register-name-error" role="alert">{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            required
          />
          {errors.email && <p className={styles.fieldError} id="register-email-error" role="alert">{errors.email}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-department">Department</label>
          <select
            id="register-department"
            value={form.department}
            onChange={(event) => updateField("department", event.target.value)}
            aria-invalid={Boolean(errors.department)}
            aria-describedby={errors.department ? "register-department-error" : undefined}
            required
          >
            <option value="">Select a department</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>
          {errors.department && <p className={styles.fieldError} id="register-department-error" role="alert">{errors.department}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-role">Test role</label>
          <select
            id="register-role"
            value={form.role}
            onChange={(event) => updateField("role", event.target.value as UserDraft["role"])}
          >
            {supportedRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {form.role === "team-lead" && (
          <div className={styles.field}>
            <label htmlFor="register-team">Team (optional)</label>
            <input
              id="register-team"
              value={form.team ?? ""}
              onChange={(event) => updateField("team", event.target.value)}
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="register-password">Password</label>
          <div className={styles.passwordControl}>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <p className={styles.fieldError} id="register-password-error" role="alert">{errors.password}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
            required
          />
          {errors.confirmPassword && <p className={styles.fieldError} id="register-confirm-password-error" role="alert">{errors.confirmPassword}</p>}
        </div>

        <p className={styles.policy}>
          Demo accounts and password hashes are stored in this browser only. Do not use a real password.
        </p>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className={styles.links}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}
