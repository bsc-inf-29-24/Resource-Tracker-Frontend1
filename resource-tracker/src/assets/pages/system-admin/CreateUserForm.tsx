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

const companyEmailPattern = /^[^\s@]+@company\.com$/i;

export default function CreateUserForm({
  onSave,
  onCancel,
}: CreateUserFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateUserInput["role"]>("team_lead");
  const [initialPassword, setInitialPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isDirty = Boolean(fullName || email || initialPassword || confirmPassword);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Enter the user's full name.";
    if (!companyEmailPattern.test(email.trim())) {
      nextErrors.email = "Use a valid @company.com email address.";
    }
    if (initialPassword.length < 8 || initialPassword.length > 12) {
      nextErrors.initialPassword = "Use 8 to 12 characters.";
    } else if (!/\d/.test(initialPassword)) {
      nextErrors.initialPassword = "Include at least one number.";
    }
    if (confirmPassword !== initialPassword) {
      nextErrors.confirmPassword = "The passwords do not match.";
    }
    setErrors(nextErrors);
    setSubmitError("");
    setSuccess(false);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        initialPassword,
      });
      setInitialPassword("");
      setConfirmPassword("");
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
          Account created successfully.{" "}
          <Link to="/system-admin/users">Return to user management</Link>
        </p>
      )}
      <form
        className={`rt-root ${styles.form}`}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        {/* <p className={styles.accountNote}>
          The API does not accept a department or team during user creation.
          System Administrator accounts are excluded because they are not in
          the documented create-user role enum.
        </p> */}
        <div className={styles.field}>
          <label htmlFor="create-user-full-name">Full name</label>
          <input
            id="create-user-full-name"
            autoComplete="name"
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            required
          />
          {errors.fullName && (
            <p className={styles.fieldError} role="alert">
              {errors.fullName}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-email">Company email</label>
          <input
            id="create-user-email"
            type="email"
            autoComplete="email"
            maxLength={254}
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
          <label htmlFor="create-user-role">Role</label>
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
        <div className={styles.field}>
          <label htmlFor="create-user-initial-password">
            Initial password
          </label>
          <input
            id="create-user-initial-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={12}
            value={initialPassword}
            onChange={(event) => setInitialPassword(event.target.value)}
            aria-invalid={Boolean(errors.initialPassword)}
            required
          />
          {errors.initialPassword && (
            <p className={styles.fieldError} role="alert">
              {errors.initialPassword}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-user-confirm-password">
            Confirm password
          </label>
          <input
            id="create-user-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={12}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            required
          />
          {errors.confirmPassword && (
            <p className={styles.fieldError} role="alert">
              {errors.confirmPassword}
            </p>
          )}
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
