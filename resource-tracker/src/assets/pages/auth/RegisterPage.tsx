import { useState, type FormEvent } from "react";
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
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const errors = {
    fullName: submitted && nameParts.length < 2 ? "Enter a first name and surname." : "",
    email:
      submitted && !email.trim()
        ? "Enter the user's email address."
        : submitted && !emailPattern.test(email.trim())
          ? "Enter a valid email address."
          : "",
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (nameParts.length < 2 || !emailPattern.test(email.trim())) return;
    const firstName = nameParts[0];
    const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    if (!surname) return;

    setBusy(true);
    try {
      await usersApi.create({
        firstName,
        ...(nameParts.length > 2 ? { middleName: nameParts.slice(1, -1).join(" ") } : {}),
        surname,
        email: email.trim(),
        role,
      });
      navigate("/system-admin/users", { replace: true });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "The account could not be created. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="register-title">
      <h1 id="register-title" className={styles.title}>Create account</h1>
      <p>A generated temporary password will be sent to the user's email address.</p>
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
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className={styles.links}><Link to="/login">Back to sign in</Link></div>
    </section>
  );
}
