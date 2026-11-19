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
  manufacturerLabel: string;
  price: string;
  batchNumber: string;
  vendor: string;
  quantity: string;
  projectId: string;
  lineManagerId: string;
  teamId: string;
  departmentId: string;
};

const initialForm: RequestForm = {
  itemDescription: "",
  manufacturerLabel: "",
  price: "",
  batchNumber: "",
  vendor: "",
  quantity: "",
  projectId: "",
  lineManagerId: "",
  teamId: "",
  departmentId: "",
};

function isValidPrice(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0.01;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default function NewApiRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDraft, setCreatedDraft] = useState(false);
  const [createdDraftId, setCreatedDraftId] = useState("");
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
    for (const field of [
      "itemDescription",
      "manufacturerLabel",
      "batchNumber",
      "vendor",
    ] as const) {
      if (!form[field].trim()) errors[field] = "This field is required.";
    }
    if (!isValidPrice(form.price)) {
      errors.price = "Enter a unit price of at least 0.01 with at most 2 decimals.";
    }
    if (!/^[1-9]\d*$/.test(form.quantity.trim())) {
      errors.quantity = "Enter a positive whole number.";
    }
    if (!form.departmentId.trim()) errors.departmentId = "Enter the backend department ID.";
    if (!form.teamId.trim()) errors.teamId = "Enter the backend team ID.";
    if (!form.projectId.trim()) errors.projectId = "Enter the backend project ID.";
    if (!isUuid(form.lineManagerId.trim())) {
      errors.lineManagerId = "Enter the assigned Line Manager's UUID.";
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
      manufacturerLabel: form.manufacturerLabel.trim(),
      price: Number(form.price),
      batchNumber: form.batchNumber.trim(),
      vendor: form.vendor.trim(),
      quantity: Number(form.quantity),
      projectId: form.projectId,
      lineManagerId: form.lineManagerId.trim(),
      teamId: form.teamId,
      departmentId: form.departmentId,
    };
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || submissionComplete) return;
    setIsSubmitting(true);
    setSubmitError("");
    setSuccess("");
    try {
      let requestId = createdDraftId;
      if (!createdDraft) {
        const draftResponse = unwrapApiResponse(
          await resourceRequestsApi.create(requestInput()),
        );
        setCreatedDraft(true);
        if (
          !isApiRecord(draftResponse) ||
          (typeof draftResponse.id !== "string" &&
            typeof draftResponse.id !== "number")
        ) {
          setSubmitError(
            " created a DRAFT with no ID. Check Request History before trying again; this form will not create a duplicate.",
          );
          return;
        }
        requestId = String(draftResponse.id);
        setCreatedDraftId(requestId);
      }
      if (!requestId) {
        setSubmitError(
          "The draft ID is unavailable. Check Request History before retrying.",
        );
        return;
      }
      await resourceRequestsApi.update(requestId, { status: "SUBMITTED" });
      setSubmissionComplete(true);
      setSuccess(`Request ${requestId} was submitted.`);
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
    if (hasInput || createdDraft) {
      setConfirmCancel(true);
      return;
    }
    navigate("/team-lead/dashboard");
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Submit a resource request"
        description="Create the documented draft, then request the documented SUBMITTED transition."
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
              <p>
                 The
                authenticated Team Lead cannot list department, team, or
                project catalogs; enter IDs supplied by your administrator.
              </p>
            </div>
            {isReviewing ? (
              <dl className={formStyles.reviewGrid}>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Item</dt>
                  <dd className={formStyles.reviewValue}>{form.itemDescription}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Manufacturer label</dt>
                  <dd className={formStyles.reviewValue}>{form.manufacturerLabel}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Unit price</dt>
                  <dd className={formStyles.reviewValue}>{form.price}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Quantity</dt>
                  <dd className={formStyles.reviewValue}>{form.quantity}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Batch number</dt>
                  <dd className={formStyles.reviewValue}>{form.batchNumber}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Vendor</dt>
                  <dd className={formStyles.reviewValue}>{form.vendor}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Department</dt>
                  <dd className={formStyles.reviewValue}>{form.departmentId}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Team</dt>
                  <dd className={formStyles.reviewValue}>{form.teamId}</dd>
                </div>
                <div className={formStyles.reviewField}>
                  <dt className={formStyles.reviewLabel}>Project</dt>
                  <dd className={formStyles.reviewValue}>{form.projectId}</dd>
                </div>
                <div className={`${formStyles.reviewField} ${formStyles.fullWidth}`}>
                  <dt className={formStyles.reviewLabel}>Line Manager UUID</dt>
                  <dd className={formStyles.reviewValue}>{form.lineManagerId}</dd>
                </div>
              </dl>
            ) : (
              <div className={formStyles.grid}>
                {(
                  [
                    ["itemDescription", "Item description"],
                    ["manufacturerLabel", "Manufacturer label"],
                    ["price", "Unit price"],
                    ["batchNumber", "Batch number"],
                    ["vendor", "Vendor"],
                    ["quantity", "Quantity"],
                  ] as const
                ).map(([field, label]) => (
                  <div className={formStyles.field} key={field}>
                    <label htmlFor={`request-${field}`}>{label} *</label>
                    <input
                      id={`request-${field}`}
                      type={
                        field === "price" || field === "quantity"
                          ? "number"
                          : "text"
                      }
                      min={
                        field === "price" ? "0.01" : field === "quantity" ? "1" : undefined
                      }
                      step={
                        field === "price" ? "0.01" : field === "quantity" ? "1" : undefined
                      }
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
                    placeholder="Enter the assigned Line Manager UUID"
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
            {isReviewing && createdDraft && (
              <p className={styles.notice} role="status">
                A draft already exists. Retry will only submit that draft.
              </p>
            )}
            <div className={formStyles.actions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                onClick={() => {
                  if (isReviewing && !createdDraft) setIsReviewing(false);
                  else cancelRequest();
                }}
              >
                {isReviewing && !createdDraft ? "Back to edit" : "Cancel"}
              </button>
              {!isReviewing ? (
                <button
                  type="submit"
                  className="rt-root rt-btn rt-btn--primary"
                >
                  Review request
                </button>
              ) : (
                <button
                  type="submit"
                  className="rt-root rt-btn rt-btn--primary"
                  disabled={
                    isSubmitting ||
                    submissionComplete ||
                    (createdDraft && !createdDraftId)
                  }
                >
                  {isSubmitting
                    ? createdDraft
                      ? "Submitting..."
                      : "Creating draft..."
                    : submissionComplete
                      ? "Submitted"
                    : createdDraft
                      ? "Retry submission"
                      : "Create draft and submit"}
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
            : createdDraft
              ? "Leave this draft?"
              : "Discard request details?"
        }
        message={
          submissionComplete
            ? "The request was submitted. Leaving will not remove it."
            : createdDraft
            ? "The draft will remain saved. Leaving will not delete it."
            : "The entered request details will be lost."
        }
        confirmLabel="Continue"
        cancelLabel="Stay here"
        destructive={!createdDraft}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          navigate("/team-lead/dashboard");
        }}
      />
    </section>
  );
}
