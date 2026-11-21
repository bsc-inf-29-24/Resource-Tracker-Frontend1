import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import {
  assignableUserRoles,
  type CreateUserInput,
} from "../../data/api-services";
import styles from "./AdminUserForm.module.css";

interface CreateUserFormProps {
  onSave: (input: CreateUserInput) => Promise<unknown>;
  onCancel: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUserForm({
  onSave,
  onCancel,
}: CreateUserFormProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateUserInput["role"]>("TEAM_LEAD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isDirty = Boolean(
    firstName || middleName || surname || email,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "Enter the user's first name.";
    if (firstName.trim().length > 60) nextErrors.firstName = "Use 60 characters or fewer.";
    if (middleName.trim().length > 60) nextErrors.middleName = "Use 60 characters or fewer.";
    if (!surname.trim()) nextErrors.surname = "Enter the user's surname.";
    if (surname.trim().length > 60) nextErrors.surname = "Use 60 characters or fewer.";
    if (!emailPattern.test(email.trim()) || email.trim().length > 254) {
      nextErrors.email = "Enter a valid email address (254 characters maximum).";
    }
    setErrors(nextErrors);
    setSubmitError("");
    setSuccess(false);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
        surname: surname.trim(),
        email: email.trim(),
        role,
      });
      setFirstName("");
      setMiddleName("");
      setSurname("");
      setEmail("");
      setSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The user account could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {submitError && (
        <ErrorMessage title="User account not created" message={submitError} />
      )}
      {success && (
        <p className={styles.success} role="status">
          Account created successfully. A temporary password was emailed to the user.{" "}
          <Link to="/system-admin/users">Return to user management</Link>
        </p>
      )}
      <form
        className={`rt-root ${styles.form}`}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <p className={styles.accountNote}>
          The backend will email the user a generated temporary password.
        </p>
        <h2>User Details</h2>
        <div className={styles.field}>
          <label htmlFor="create-user-first-name">First name</label>
          <input
            id="create-user-first-name"
            autoComplete="given-name"
            maxLength={60}
            placeholder="Enter first name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            required
          />
          {errors.firstName && (
            <p className={styles.fieldError} role="alert">
              {errors.firstName}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-middle-name">Middle name (optional)</label>
          <input
            id="create-user-middle-name"
            autoComplete="additional-name"
            maxLength={60}
            value={middleName}
            onChange={(event) => setMiddleName(event.target.value)}
            aria-invalid={Boolean(errors.middleName)}
          />
          {errors.middleName && <p className={styles.fieldError} role="alert">{errors.middleName}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-surname">Surname</label>
          <input
            id="create-user-surname"
            autoComplete="family-name"
            maxLength={60}
            placeholder="Enter surname"
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
            aria-invalid={Boolean(errors.surname)}
            required
          />
          {errors.surname && <p className={styles.fieldError} role="alert">{errors.surname}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-email">Email</label>
          <input
            id="create-user-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="Enter user email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            required
          />
          {errors.email && (
            <p className={styles.fieldError} role="alert">
              {errors.email}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-role">Assign role</label>
          <select
            id="create-user-role"
            value={role}
            onChange={(event) => {
              const nextRole = assignableUserRoles.find(
                (item) => item.value === event.target.value,
              );
              if (nextRole) setRole(nextRole.value);
            }}
          >
            {assignableUserRoles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="rt-root rt-btn rt-btn--outline"
            disabled={busy}
            onClick={() => {
              if (isDirty) setConfirmCancel(true);
              else onCancel();
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rt-root rt-btn rt-btn--primary"
            disabled={busy}
          >
            {busy ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={confirmCancel}
        title="Discard user details?"
        message="The entered information will be lost."
        confirmLabel="Discard"
        cancelLabel="Continue editing"
        destructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
      />
    </>
  );
}
