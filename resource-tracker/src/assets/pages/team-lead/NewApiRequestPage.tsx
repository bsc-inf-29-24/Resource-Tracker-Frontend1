import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import LoadingState from "../../components/feedback/LoadingState";
import { mockDepartments } from "../../data/Users.js";
import { resourceRequestsApi, usersApi } from "../../data/api-services";
import type { CreateResourceRequestInput } from "../../data/api-services";
import {
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import {
  teamLeadProjects,
  teamLeadTeams,
} from "../../data/team-lead-catalog";
import styles from "../management/ApiManagementPage.module.css";
import formStyles from "./NewRequestPage.module.css";

type RequestForm = {
  itemDescription: string;
  batchNumber: string;
  quantity: string;
  expectedDurationDays: string;
  departmentName: string;
  teamName: string;
  projectName: string;
  lineManagerName: string;
};

const initialForm: RequestForm = {
  itemDescription: "",
  batchNumber: "",
  quantity: "",
  expectedDurationDays: "",
  departmentName: "",
  teamName: "",
  projectName: "",
  lineManagerName: "",
};

interface LineManagerOption {
  id: string;
  fullName: string;
  email: string;
}

const departmentNames = [
  ...new Set([
    ...mockDepartments.map((department) => department.name),
    "Data Science",
  ]),
].sort((a, b) => a.localeCompare(b));

export default function NewApiRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  const [lineManagers, setLineManagers] = useState<LineManagerOption[]>([]);
  const [isLoadingLineManagers, setIsLoadingLineManagers] = useState(true);
  const [lineManagerLoadError, setLineManagerLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadLineManagers = useCallback(async () => {
    setIsLoadingLineManagers(true);
    setLineManagerLoadError("");
    try {
      const response = unwrapApiResponse(await usersApi.lineManagers());
      if (!Array.isArray(response)) {
        throw new Error("The Line Manager list response was invalid.");
      }
      const options = response.map((record) => {
        if (
          !isApiRecord(record) ||
          typeof record.id !== "string" ||
          !record.id.trim() ||
          typeof record.fullName !== "string" ||
          !record.fullName.trim() ||
          typeof record.email !== "string"
        ) {
          throw new Error("A Line Manager record is missing required details.");
        }
        return {
          id: record.id,
          fullName: record.fullName,
          email: record.email,
        };
      });
      setLineManagers(options);
    } catch (loadError) {
      setLineManagerLoadError(
        loadError instanceof Error
          ? loadError.message
          : "The active Line Managers could not be loaded.",
      );
      setLineManagers([]);
    } finally {
      setIsLoadingLineManagers(false);
    }
  }, []);

  useEffect(() => {
    void loadLineManagers();
  }, [loadLineManagers]);

  function updateField<K extends keyof RequestForm>(
    field: K,
    value: RequestForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccess("");
  }

  function updateDepartment(value: string) {
    setForm((current) => ({
      ...current,
      departmentName: value,
      teamName: "",
    }));
    setFieldErrors((current) => ({
      ...current,
      departmentName: undefined,
      teamName: undefined,
    }));
    setSubmitError("");
    setSuccess("");
  }

  function validate(): Partial<Record<keyof RequestForm, string>> {
    const errors: Partial<Record<keyof RequestForm, string>> = {};
    for (const field of ["itemDescription", "batchNumber"] as const) {
      if (!form[field].trim()) errors[field] = "This field is required.";
    }
    if (!/^[1-9]\d*$/.test(form.quantity.trim())) {
      errors.quantity = "Enter a positive whole number.";
    }
    if (!/^[1-9]\d*$/.test(form.expectedDurationDays.trim())) {
      errors.expectedDurationDays = "Enter a positive whole number of days.";
    }
    if (!form.departmentName) errors.departmentName = "Select a department.";
    if (!form.teamName) errors.teamName = "Select a team.";
    if (!form.projectName) errors.projectName = "Select a project.";
    if (!form.lineManagerName) errors.lineManagerName = "Select a Line Manager.";
    if (lineManagerLoadError) errors.lineManagerName = "Load Line Managers before continuing.";
    if (lineManagers.length === 0 && !lineManagerLoadError) {
      errors.lineManagerName = "No active Line Managers are available.";
    }
    return errors;
  }

  function reviewRequest() {
    const errors = validate();
    setFieldErrors(errors);
    setSubmitError("");
    if (Object.keys(errors).length > 0) return;
    setIsReviewing(true);
  }

  function requestInput(): CreateResourceRequestInput {
    return {
      itemDescription: form.itemDescription.trim(),
      batchNumber: form.batchNumber.trim(),
      quantity: Number(form.quantity),
      expectedDurationDays: Number(form.expectedDurationDays),
      projectName: form.projectName,
      lineManagerName: form.lineManagerName,
      teamName: form.teamName,
    };
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || submissionComplete) return;
    setIsSubmitting(true);
    setSubmitError("");
    setSuccess("");
    try {
      const response = unwrapApiResponse(
        await resourceRequestsApi.create(requestInput()),
      );
      if (
        !isApiRecord(response) ||
        (typeof response.id !== "string" && typeof response.id !== "number")
      ) {
        setSubmissionComplete(true);
        setSubmitError(
          "The request was sent, but the API did not return its ID. Check Request History before trying again.",
        );
        return;
      }
      setSubmissionComplete(true);
      setSuccess(`Request ${String(response.id)} was submitted.`);
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : "The request could not be submitted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelRequest() {
    const hasInput = Object.values(form).some((value) => value.trim());
    if (hasInput || submissionComplete) {
      setConfirmCancel(true);
      return;
    }
    navigate("/team-lead/dashboard");
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Submit a resource request"
        supplementary={<Link to="/team-lead/requests">Request history</Link>}
      />
      {lineManagerLoadError && (
        <ErrorMessage
          title="Line Managers could not be loaded"
          message={lineManagerLoadError}
          onRetry={() => void loadLineManagers()}
        />
      )}
      {submitError && (
        <ErrorMessage title="Request operation failed" message={submitError} />
      )}
      {success && (
        <p className={styles.notice} role="status">
          {success} <Link to="/team-lead/requests">View request history</Link>
        </p>
      )}
        <form
          className={`rt-root ${formStyles.form}`}
          onSubmit={(event) => {
            if (!isReviewing) {
              event.preventDefault();
              reviewRequest();
            } else {
              void submitRequest(event);
            }
          }}
          noValidate
        >
          <section className={formStyles.card}>
            <div className={formStyles.sectionHeading}>
              <h2>{isReviewing ? "Review request" : "Request details"}</h2>
            </div>
            {isReviewing ? (
              <dl className={formStyles.reviewGrid}>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Item</dt>
                  <dd className={formStyles.reviewValue}>{form.itemDescription}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Batch number</dt>
                  <dd className={formStyles.reviewValue}>{form.batchNumber}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Quantity</dt>
                  <dd className={formStyles.reviewValue}>{form.quantity}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Expected duration (days)</dt>
                  <dd className={formStyles.reviewValue}>{form.expectedDurationDays}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Department</dt>
                  <dd className={formStyles.reviewValue}>{form.departmentName}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Team</dt>
                  <dd className={formStyles.reviewValue}>{form.teamName}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Project</dt>
                  <dd className={formStyles.reviewValue}>{form.projectName}</dd>
                </div>
                <div className={`${formStyles.reviewField} ${formStyles.fullWidth}`}>
                  <dt className={formStyles.reviewLabel}>Line Manager</dt>
                  <dd className={formStyles.reviewValue}>{form.lineManagerName}</dd>
                </div>
              </dl>
            ) : (
              <div className={formStyles.grid}>
                {(
                  [
                    ["itemDescription", "Item description"],
                    ["batchNumber", "Batch number"],
                    ["quantity", "Quantity"],
                    ["expectedDurationDays", "Expected duration (days)"],
                  ] as const
                ).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input
                      id={`request-${field}`}
                      type={
                        field === "quantity" || field === "expectedDurationDays"
                          ? "number"
                          : "text"
                      }
                      min={field === "quantity" || field === "expectedDurationDays" ? "1" : undefined}
                      step={field === "quantity" || field === "expectedDurationDays" ? "1" : undefined}
                      value={form[field]}
                      onChange={(event) => updateField(field, event.target.value)}
                      aria-invalid={Boolean(fieldErrors[field])}
                      required
                    />
                    {fieldErrors[field] && (
                      <p className={formStyles.fieldError} role="alert">
                        {fieldErrors[field]}
                      </p>
                    )}
                  </div>
                ))}
                <div className={formStyles.field}>
                  <label htmlFor="request-department">Department *</label>
                  <select
                    id="request-department"
                    value={form.departmentName}
                    onChange={(event) => updateDepartment(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.departmentName)}
                    required
                  >
                    <option value="">Select a department</option>
                    {departmentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentName && (
                    <p className={formStyles.fieldError} role="alert">
                      {fieldErrors.departmentName}
                    </p>
                  )}
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="request-team">Team *</label>
                  <select
                    id="request-team"
                    value={form.teamName}
                    onChange={(event) => updateField("teamName", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.teamName)}
                    disabled={!form.departmentName}
                    required
                  >
                    <option value="">
                      {form.departmentName ? "Select a team" : "Select a department first"}
                    </option>
                    {teamLeadTeams
                      .filter((team) => team.department === form.departmentName)
                      .map((team) => (
                        <option key={team.id} value={team.name}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                  {fieldErrors.teamName && (
                    <p className={formStyles.fieldError} role="alert">
                      {fieldErrors.teamName}
                    </p>
                  )}
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="request-project">Project *</label>
                  <select
                    id="request-project"
                    value={form.projectName}
                    onChange={(event) => updateField("projectName", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.projectName)}
                    required
                  >
                    <option value="">Select a project</option>
                    {teamLeadProjects.map((project) => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.projectName && (
                    <p className={formStyles.fieldError} role="alert">
                      {fieldErrors.projectName}
                    </p>
                  )}
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="request-line-manager">Line Manager *</label>
                  {isLoadingLineManagers ? (
                    <LoadingState message="Loading active Line Managers..." />
                  ) : (
                    <select
                      id="request-line-manager"
                      value={form.lineManagerName}
                      onChange={(event) =>
                        updateField("lineManagerName", event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.lineManagerName)}
                      disabled={lineManagers.length === 0}
                      required
                    >
                      <option value="">
                        {lineManagers.length
                          ? "Select a Line Manager"
                          : "No active Line Managers available"}
                      </option>
                      {lineManagers.map((manager) => (
                        <option key={manager.id} value={manager.fullName}>
                          {manager.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.lineManagerName && (
                    <p className={formStyles.fieldError} role="alert">
                      {fieldErrors.lineManagerName}
                    </p>
                  )}
                </div>
                <p className={formStyles.fullWidth} role="note">
                  Department, team, and project options are demonstration data. Choose
                  values that exist in the backend for request submission to succeed.
                </p>
              </div>
            )}
            <div className={formStyles.actions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                onClick={() => {
                  if (isReviewing && !submissionComplete) setIsReviewing(false);
                  else cancelRequest();
                }}
                disabled={isSubmitting}
              >
                {isReviewing && !submissionComplete ? "Back to edit" : "Cancel"}
              </button>
              {!isReviewing ? (
                <button type="submit" className="rt-root rt-btn rt-btn--primary">
                  Review request
                </button>
              ) : (
                <button
                  type="submit"
                  className="rt-root rt-btn rt-btn--primary"
                  disabled={
                    isSubmitting ||
                    submissionComplete
                  }
                >
                  {isSubmitting
                    ? "Submitting..."
                    : submissionComplete
                      ? "Submitted"
                      : "Submit request"}
                </button>
              )}
            </div>
          </section>
        </form>
      <ConfirmDialog
        open={confirmCancel}
        title={
          submissionComplete
            ? "Leave submitted request?"
            : "Discard request details?"
        }
        message={
          submissionComplete
            ? "The request was submitted. Leaving will not remove it."
            : "The entered request details will be lost."
        }
        confirmLabel="Continue"
        cancelLabel="Stay here"
        destructive={!submissionComplete}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          navigate("/team-lead/dashboard");
        }}
      />
    </section>
  );
}
