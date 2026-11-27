import { useRef, useState } from "react";
import type { FormEvent } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import type { UserDraft } from "../../data/user-store";
import {
  availableDepartments,
  hasDuplicateEmail,
  supportedRoles,
} from "../../data/user-store";
import type { UserAccount } from "../../types/user";
import styles from "./AdminUserForm.module.css";

interface AdminUserFormProps {
  user?: UserAccount;
  onSave: (draft: UserDraft) => void;
  submitLabel: string;
}

type FieldErrors = Partial<Record<keyof UserDraft, string>>;

export default function AdminUserForm({
  user,
  onSave,
  submitLabel,
}: AdminUserFormProps) {
  const [form, setForm] = useState<UserDraft>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
    role: user?.role ?? "team-lead",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const submitting = useRef(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) next.name = "Enter the user's name.";
    if (!email) {
      next.email = "Enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    } else if (hasDuplicateEmail(email, user?.id)) {
      next.email = "An account with this email address already exists.";
    }
    if (
      !availableDepartments.some(
        (department) => department.name === form.department,
      )
    ) {
      next.department = "Select an available department.";
    }
    if (!supportedRoles.some((role) => role.value === form.role)) {
      next.role = "Select a supported role.";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError("");
    setSuccess("");
    if (Object.keys(nextErrors).length > 0) return;

    submitting.current = true;
    try {
      onSave({
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department,
        role: form.role,
      });
      setSuccess(
        user
          ? "Account details were updated in this browser."
          : "The account record was created in this browser. No password, invitation, or secure sign-in access was created.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The account could not be saved. Your entered values have been preserved.",
      );
    } finally {
      submitting.current = false;
    }
  }

  function updateField<K extends keyof UserDraft>(
    field: K,
    value: UserDraft[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccess("");
  }

  return (
    <>
      {submitError && (
        <ErrorMessage title="Account not saved" message={submitError} />
      )}
      {success && (
        <p className={styles.success} role="status">
          {success}
        </p>
      )}
      <form
        className={`rt-root ${styles.form}`}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className={styles.field}>
          <label htmlFor="admin-user-name">User name</label>
          <input
            id="admin-user-name"
            autoComplete="name"
            placeholder="Enter full name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "admin-user-name-error" : undefined}
            required
          />
          {errors.name && (
            <p
              className={styles.fieldError}
              id="admin-user-name-error"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="admin-user-email">Email</label>
          <input
            id="admin-user-email"
            type="email"
            autoComplete="email"
            placeholder="Enter email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "admin-user-email-error" : undefined
            }
            required
          />
          {errors.email && (
            <p
              className={styles.fieldError}
              id="admin-user-email-error"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="admin-user-department">Department</label>
          <select
            id="admin-user-department"
            value={form.department}
            onChange={(event) => updateField("department", event.target.value)}
            aria-invalid={Boolean(errors.department)}
            aria-describedby={
              errors.department ? "admin-user-department-error" : undefined
            }
            required
          >
            <option value="">Select a department</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>
          {errors.department && (
            <p
              className={styles.fieldError}
              id="admin-user-department-error"
              role="alert"
            >
              {errors.department}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="admin-user-role">Role</label>
          <select
            id="admin-user-role"
            value={form.role}
            onChange={(event) =>
              updateField("role", event.target.value as UserDraft["role"])
            }
            aria-invalid={Boolean(errors.role)}
            aria-describedby={errors.role ? "admin-user-role-error" : undefined}
            required
          >
            {supportedRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p
              className={styles.fieldError}
              id="admin-user-role-error"
              role="alert"
            >
              {errors.role}
            </p>
          )}
        </div>

        {/* <p className={styles.accountNote}>
          Account records are demonstration data stored in this browser. There is no authentication or invitation service.
        </p> */}
        <div className={styles.actions}>
          <button type="submit" className="rt-root rt-btn rt-btn--primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}
