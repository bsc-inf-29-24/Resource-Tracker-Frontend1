import { useEffect, useState, type FormEvent } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { getApiRecords } from "../../data/api-response";
import {
  assignableUserRoles,
  departmentsApi,
  type CreateUserInput,
} from "../../data/api-services";
import styles from "./AdminUserForm.module.css";

interface CreateUserSaveResult {
  departmentAssignmentError?: string;
}

interface CreateUserFormProps {
  onSave: (
    input: CreateUserInput,
    departmentId?: string,
  ) => Promise<CreateUserSaveResult | undefined>;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateUserForm({
  onSave,
}: CreateUserFormProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateUserInput["role"]>("TEAM_LEAD");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void departmentsApi.list()
      .then((response) => {
        const options = getApiRecords(response).flatMap((record) => {
          const id = record.id;
          const name = record.name;
          if (
            (typeof id !== "string" && typeof id !== "number") ||
            typeof name !== "string" ||
            !name.trim()
          ) {
            return [];
          }
          return [{ id: String(id), name: name.trim() }];
        });
        if (active) setDepartments(options);
      })
      .catch((error: unknown) => {
        if (active) {
          setDepartmentsError(
            error instanceof Error
              ? error.message
              : "Departments could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setDepartmentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
    if (role === "DEPARTMENT_HEAD" && !departmentId) {
      nextErrors.department = "Select the department this user will lead.";
    }
    setErrors(nextErrors);
    setSubmitError("");
    setAssignmentError("");
    setSuccessMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const result = await onSave({
        firstName: firstName.trim(),
        ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
        surname: surname.trim(),
        email: email.trim(),
        role,
      }, role === "DEPARTMENT_HEAD" ? departmentId : undefined);
      setFirstName("");
      setMiddleName("");
      setSurname("");
      setEmail("");
      setDepartmentId("");
      const assignmentFailure = result?.departmentAssignmentError ?? "";
      setAssignmentError(assignmentFailure);
      setSuccessMessage(
        assignmentFailure || !departmentId
          ? "Account created successfully. A temporary password was emailed to the user."
          : "Account created and assigned to the selected department. A temporary password was emailed to the user.",
      );
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
      {successMessage && (
        <p className={styles.success} role="status">
          {successMessage}
        </p>
      )}
      {assignmentError && (
        <p className={styles.fieldError} role="alert">
          The account was created, but department assignment failed: {assignmentError}
        </p>
      )}
      <form
        className={`rt-root ${styles.form}`}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <p className={styles.accountNote}>
          Email will be sent to the user after creation.
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
        {role === "DEPARTMENT_HEAD" && (
          <div className={styles.field}>
            <label htmlFor="create-user-department">Department</label>
            <select
              id="create-user-department"
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setErrors((current) => ({ ...current, department: "" }));
              }}
              aria-invalid={Boolean(errors.department)}
              aria-describedby={errors.department ? "create-user-department-error" : undefined}
              disabled={departmentsLoading || Boolean(departmentsError) || departments.length === 0}
              required
            >
              <option value="">
                {departmentsLoading
                  ? "Loading departments..."
                  : departmentsError
                    ? "Departments unavailable"
                    : departments.length === 0
                      ? "No departments available"
                      : "Select a department"}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p
                className={styles.fieldError}
                id="create-user-department-error"
                role="alert"
              >
                {errors.department}
              </p>
            )}
            {departmentsError && (
              <p className={styles.fieldError} role="alert">
                Departments could not be loaded: {departmentsError}
              </p>
            )}
            {!departmentsLoading && !departmentsError && departments.length === 0 && (
              <p className={styles.fieldError} role="alert">
                Create a department before assigning a department head.
              </p>
            )}
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="submit"
            className="rt-root rt-btn rt-btn--primary"
            disabled={busy}
          >
            {busy ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </>
  );
}
