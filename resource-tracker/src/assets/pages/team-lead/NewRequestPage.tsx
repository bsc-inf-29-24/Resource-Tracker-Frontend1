import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import PageHeader from "../../components/layout/PageHeader";
import { mockUsers } from "../../data/mock-data";
import {
  createResourceRequest,
  TEAM_LEAD_ID,
  useResourceRequests,
} from "../../data/request-store";
import styles from "./NewRequestPage.module.css";

type FormFields = {
  itemDescription: string;
  manufacturer: string;
  quantity: string;
  estimatedPrice: string;
  project: string;
  summary: string;
};

type FieldName = keyof FormFields;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialForm: FormFields = {
  itemDescription: "",
  manufacturer: "",
  quantity: "",
  estimatedPrice: "",
  project: "",
  summary: "",
};

function isValidPrice(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { requests } = useResourceRequests();
  const teamLead = mockUsers.find((user) => user.id === TEAM_LEAD_ID);
  const projects = useMemo(
    () => [...new Set(requests.map((request) => request.project.trim()).filter(Boolean))].sort(),
    [requests]
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const hasUnsavedInput = Object.values(form).some((value) => value.trim() !== "");

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const field = name as FieldName;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (!form.itemDescription.trim()) {
      nextErrors.itemDescription = "Enter an item description.";
    }
    if (
      !form.quantity.trim() ||
      !/^[1-9]\d*$/.test(form.quantity.trim()) ||
      !Number.isSafeInteger(Number(form.quantity))
    ) {
      nextErrors.quantity = "Enter a positive whole number.";
    }
    if (!isValidPrice(form.estimatedPrice)) {
      nextErrors.estimatedPrice =
        "Enter a total cost greater than zero with no more than two decimal places.";
    }
    if (!form.project || !projects.includes(form.project)) {
      nextErrors.project = "Select an available project.";
    }
    if (!form.summary.trim()) {
      nextErrors.summary = "Enter a summary explaining why this resource is needed.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    setSubmitError("");
    setSuccessMessage("");
    if (Object.keys(validationErrors).length > 0) return;

    if (!teamLead?.department || !teamLead.team) {
      setSubmitError(
        "The preview account has no assigned department or team. A request cannot be associated safely."
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const request = createResourceRequest({
        itemDescription: form.itemDescription,
        manufacturer: form.manufacturer,
        quantity: Number(form.quantity),
        estimatedPrice: Number(form.estimatedPrice),
        department: teamLead.department,
        project: form.project,
        team: teamLead.team,
        summary: form.summary,
      });
      setForm(initialForm);
      setErrors({});
      setSuccessMessage(
        `${request.id} was saved in this browser as a pending request. It was not sent to a server.`
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The request could not be saved. Your entered values have been preserved."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    if (hasUnsavedInput) {
      setConfirmCancel(true);
      return;
    }
    navigate("/team-lead/dashboard");
  }

  function discardAndLeave() {
    setConfirmCancel(false);
    navigate("/team-lead/dashboard");
  }

  if (!teamLead) {
    return (
      <section className={`rt-root ${styles.page}`}>
        <PageHeader title="Submit a resource request" />
        <ErrorMessage
          title="Preview account unavailable"
          message="The demo Team Lead account is missing, so department and team details cannot be assigned."
        />
      </section>
    );
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Submit a resource request"
        description="Provide the resource details and explain the need."
        supplementary={<Link to="/team-lead/requests">Request history</Link>}
      />
      <p className={styles.previewNotice} role="note">
        Preview mode: department ({teamLead.department}) and team ({teamLead.team ?? "not assigned"})
        are taken from the seeded Team Lead profile. Projects are drawn from existing request data.
        New requests are saved only in this browser.
      </p>

      {submitError && (
        <ErrorMessage
          title="Request not submitted"
          message={submitError}
        />
      )}
      {successMessage && (
        <p className={styles.success} role="status">
          {successMessage}{" "}
          <Link to="/team-lead/requests">View request history</Link>
        </p>
      )}
      {projects.length === 0 && (
        <ErrorMessage
          title="No projects available"
          message="There are no project records in the available request data. Add a project data source before submitting a request."
        />
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.card} aria-labelledby="resource-details-title">
          <div className={styles.sectionHeading}>
            <h2 id="resource-details-title">Resource details</h2>
            <p>Fields marked required must be completed.</p>
          </div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="itemDescription">Item description <span aria-hidden="true">*</span></label>
              <input
                id="itemDescription"
                name="itemDescription"
                value={form.itemDescription}
                onChange={handleChange}
                aria-invalid={Boolean(errors.itemDescription)}
                aria-describedby={errors.itemDescription ? "itemDescription-error" : undefined}
                autoComplete="off"
                required
              />
              {errors.itemDescription && <p className={styles.fieldError} id="itemDescription-error" role="alert">{errors.itemDescription}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="manufacturer">Manufacturer <span>(optional)</span></label>
              <input
                id="manufacturer"
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="quantity">Required quantity <span aria-hidden="true">*</span></label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.quantity}
                onChange={handleChange}
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={errors.quantity ? "quantity-error" : undefined}
                required
              />
              {errors.quantity && <p className={styles.fieldError} id="quantity-error" role="alert">{errors.quantity}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="estimatedPrice">Total estimated cost (MWK) <span aria-hidden="true">*</span></label>
              <input
                id="estimatedPrice"
                name="estimatedPrice"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.estimatedPrice}
                onChange={handleChange}
                aria-invalid={Boolean(errors.estimatedPrice)}
                aria-describedby={errors.estimatedPrice ? "estimatedPrice-error" : undefined}
                required
              />
              {errors.estimatedPrice && <p className={styles.fieldError} id="estimatedPrice-error" role="alert">{errors.estimatedPrice}</p>}
            </div>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="request-information-title">
          <div className={styles.sectionHeading}>
            <h2 id="request-information-title">Request information</h2>
            <p>Assigned department and team cannot be changed in preview mode.</p>
          </div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="department">Department</label>
              <input id="department" value={teamLead.department} readOnly aria-readonly="true" />
            </div>
            <div className={styles.field}>
              <label htmlFor="team">Requesting team</label>
              <input id="team" value={teamLead.team ?? "Not assigned"} readOnly aria-readonly="true" />
            </div>
            <div className={styles.field}>
              <label htmlFor="project">Project <span aria-hidden="true">*</span></label>
              <select
                id="project"
                name="project"
                value={form.project}
                onChange={handleChange}
                aria-invalid={Boolean(errors.project)}
                aria-describedby={errors.project ? "project-error" : undefined}
                required
                disabled={projects.length === 0}
              >
                <option value="">Select a project</option>
                {projects.map((project) => <option key={project} value={project}>{project}</option>)}
              </select>
              {errors.project && <p className={styles.fieldError} id="project-error" role="alert">{errors.project}</p>}
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="summary">Request summary <span aria-hidden="true">*</span></label>
              <textarea
                id="summary"
                name="summary"
                rows={5}
                value={form.summary}
                onChange={handleChange}
                aria-invalid={Boolean(errors.summary)}
                aria-describedby={errors.summary ? "summary-error" : undefined}
                required
              />
              {errors.summary && <p className={styles.fieldError} id="summary-error" role="alert">{errors.summary}</p>}
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="rt-root rt-btn rt-btn--primary"
            disabled={isSubmitting || projects.length === 0}
          >
            {isSubmitting ? "Saving request..." : "Submit request"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmCancel}
        title="Discard this request?"
        message="Your entered request details will be lost if you leave this page."
        confirmLabel="Discard request"
        cancelLabel="Continue editing"
        destructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={discardAndLeave}
      />
    </section>
  );
}
