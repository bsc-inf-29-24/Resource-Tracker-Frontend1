import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import { resourceRequestsApi } from "../../data/api-services";
import type { CreateResourceRequestInput } from "../../data/api-services";
import { isApiRecord, unwrapApiResponse } from "../../data/api-response";
import styles from "../management/ApiManagementPage.module.css";
import formStyles from "./NewRequestPage.module.css";

type RequestForm = {
  itemDescription: string;
  batchNumber: string;
  quantity: string;
  expectedDurationDays: string;
  projectName: string;
  lineManagerName: string;
  teamName: string;
};

const initialForm: RequestForm = {
  itemDescription: "",
  batchNumber: "",
  quantity: "",
  expectedDurationDays: "",
  projectName: "",
  lineManagerName: "",
  teamName: "",
};

const requestFields: { name: keyof RequestForm; label: string; numeric?: boolean }[] = [
  { name: "itemDescription", label: "Item description" },
  { name: "batchNumber", label: "Batch number" },
  { name: "quantity", label: "Quantity", numeric: true },
  { name: "expectedDurationDays", label: "Expected duration (days)", numeric: true },
  { name: "projectName", label: "Project name" },
  { name: "lineManagerName", label: "Line Manager full name" },
  { name: "teamName", label: "Team name" },
];

export default function NewApiRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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

  function validate(): Partial<Record<keyof RequestForm, string>> {
    const errors: Partial<Record<keyof RequestForm, string>> = {};
    for (const field of requestFields) {
      const value = form[field.name].trim();
      if (!value) errors[field.name] = "This field is required.";
      else if (field.numeric && !/^[1-9]\d*$/.test(value)) {
        errors[field.name] = "Enter a positive whole number.";
      }
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
      projectName: form.projectName.trim(),
      lineManagerName: form.lineManagerName.trim(),
      teamName: form.teamName.trim(),
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
      const message = isApiRecord(response) && typeof response.message === "string"
        ? response.message
        : "Your request was submitted successfully.";
      setSubmissionComplete(true);
      setSuccess(message);
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
    if (hasInput && !submissionComplete) {
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
                {requestFields.map(({ name, label }) => (
                  <div className={formStyles.reviewField} key={name}>
                    <dt className={formStyles.reviewLabel}>{label}</dt>
                    <dd className={formStyles.reviewValue}>{form[name]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className={formStyles.grid}>
                {(
                  [
                    ["itemDescription", "Item description"],
                    ["price", "Unit price"],
                    ["manufacturerLabel", "Manufacturer label"],
                    ["batchNumber", "Batch number"],
                    ["vendor", "Vendor"],
                    ["quantity", "Quantity"],
                  ] as const
                ).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input
                      id={`request-${name}`}
                      type={numeric ? "number" : "text"}
                      min={numeric ? "1" : undefined}
                      step={numeric ? "1" : undefined}
                      value={form[name]}
                      onChange={(event) => updateField(name, event.target.value)}
                      aria-invalid={Boolean(fieldErrors[name])}
                      required
                    />
                    {fieldErrors[name] && (
                      <p className={formStyles.fieldError} role="alert">
                        {fieldErrors[name]}
                      </p>
                    )}
                  </div>
                ))}
                {(
                  [
                    ["departmentId", "Department ID"],
                    ["teamId", "Team ID"],
                    ["projectId", "Project ID"],
                  ] as const
                ).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input
                      id={`request-${field}`}
                      inputMode="numeric"
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
                  <label htmlFor="request-line-manager">
                    Line Manager UUID *
                  </label>
                  <input
                    id="request-line-manager"
                    value={form.lineManagerId}
                    onChange={(event) =>
                      updateField("lineManagerId", event.target.value)
                    }
                    aria-invalid={Boolean(fieldErrors.lineManagerId)}
                    required
                  />
                  {fieldErrors.lineManagerId && (
                    <p className={formStyles.fieldError} role="alert">
                      {fieldErrors.lineManagerId}
                    </p>
                  )}
                </div>
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
                  disabled={isSubmitting || submissionComplete}
                >
                  {isSubmitting ? "Submitting..." : submissionComplete ? "Submitted" : "Submit request"}
                </button>
              )}
            </div>
          </section>
        </form>
      <ConfirmDialog
        open={confirmCancel}
        title="Discard request details?"
        message="The entered request details will be lost."
        confirmLabel="Discard"
        cancelLabel="Continue editing"
        destructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          navigate("/team-lead/dashboard");
        }}
      />
    </section>
  );
}
