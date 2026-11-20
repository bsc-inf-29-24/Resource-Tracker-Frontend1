import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { assignableUserRoles, usersApi, type CreateUserInput } from "../../data/api-services";
import styles from "./AuthPage.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateUserInput["role"]>("TEAM_LEAD");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const errors = {
    fullName: submitted && !fullName.trim() ? "Enter the user's full name." : "",
    email:
      submitted && !email.trim()
        ? "Enter the user's email address."
        : submitted && !emailPattern.test(email.trim())
          ? "Enter a valid email address."
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (
      !fullName.trim() ||
      !emailPattern.test(email.trim()) ||
      password.length < 8 ||
      confirmPassword !== password
    ) return;

    setBusy(true);
    try {
      await usersApi.create({
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        initialPassword: password,
      });
      navigate("/system-admin/users", { replace: true });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "The account could not be created. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="register-title">
      <h1 id="register-title" className={styles.title}>Create account</h1>
      {error && <ErrorMessage title="Could not create account" message={error} />}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" autoComplete="name" value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)} required />
          {errors.fullName && <p className={styles.fieldError} role="alert">{errors.fullName}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="register-email">Email address</label>
          <input id="register-email" type="email" autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)} required />
          {errors.email && <p className={styles.fieldError} role="alert">{errors.email}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="register-role">Role</label>
          <select id="register-role" value={role}
            onChange={(event) => setRole(event.target.value as CreateUserInput["role"])}>
            {assignableUserRoles.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-password">Password</label>
          <div className={styles.passwordControl}>
            <input id="register-password" type={showPassword ? "text" : "password"}
              autoComplete="new-password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)} required />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && <p className={styles.fieldError} role="alert">{errors.password}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input id="register-confirm-password" type={showPassword ? "text" : "password"}
            autoComplete="new-password" value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)} required />
          {errors.confirmPassword && <p className={styles.fieldError} role="alert">{errors.confirmPassword}</p>}
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className={styles.links}><Link to="/login">Back to sign in</Link></div>
    </section>
  );
}
