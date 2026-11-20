import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { usersApi, resourceRequestsApi } from "../../data/api-services";
import type {
  CreateResourceRequestInput,
} from "../../data/api-services";
import { getApiRecords, isApiRecord, unwrapApiResponse } from "../../data/api-response";
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

type LineManager = {
  id: string;
  fullName: string;
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

const fields: {
  name: keyof RequestForm;
  label: string;
  numeric?: boolean;
}[] = [
  { name: "itemDescription", label: "Item description" },
  { name: "batchNumber", label: "Batch number" },
  { name: "quantity", label: "Quantity", numeric: true },
  { name: "expectedDurationDays", label: "Expected duration (days)", numeric: true },
  { name: "projectName", label: "Project name" },
  { name: "lineManagerName", label: "Line Manager" },
  { name: "teamName", label: "Team name" },
];

function isLineManager(value: Record<string, unknown>): value is Record<string, unknown> & LineManager {
  return typeof value.id === "string" && typeof value.fullName === "string";
}

export default function NewApiRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [lineManagers, setLineManagers] = useState<LineManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [managerError, setManagerError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadLineManagers() {
    setLoadingManagers(true);
    setManagerError("");
    try {
      const response = unwrapApiResponse(await usersApi.lineManagers());
      const records = getApiRecords(response);
      if (!Array.isArray(response) || records.length !== response.length || !records.every(isLineManager)) {
        throw new Error("The Line Manager endpoint returned an unexpected response.");
      }
      setLineManagers(records);
    } catch (error) {
      setLineManagers([]);
      setManagerError(
        error instanceof Error ? error.message : "Line Managers could not be loaded.",
      );
    } finally {
      setLoadingManagers(false);
    }
  }

  useEffect(() => {
    void loadLineManagers();
  }, []);

  function updateField<K extends keyof RequestForm>(name: K, value: RequestForm[K]) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError("");
    setSuccess("");
  }

  function validate() {
    const next: Partial<Record<keyof RequestForm, string>> = {};
    for (const field of fields) {
      const value = form[field.name].trim();
      if (!value) {
        next[field.name] = "This field is required.";
      } else if (
        field.numeric &&
        (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
      ) {
        next[field.name] = "Enter a positive whole number.";
      }
    }
    if (
      form.lineManagerName &&
      !lineManagers.some((manager) => manager.fullName === form.lineManagerName)
    ) {
      next.lineManagerName = "Select an active Line Manager from the list.";
    }
    return next;
  }

  function toPayload(): CreateResourceRequestInput {
    return {
      itemDescription: form.itemDescription.trim(),
      batchNumber: form.batchNumber.trim(),
      quantity: Number(form.quantity),
      expectedDurationDays: Number(form.expectedDurationDays),
      projectName: form.projectName.trim(),
      lineManagerName: form.lineManagerName,
      teamName: form.teamName.trim(),
    };
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSubmitError("");
    setSuccess("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setReviewing(false);
      return;
    }

    setBusy(true);
    try {
      const result = unwrapApiResponse(await resourceRequestsApi.create(toPayload()));
      const record = isApiRecord(result) ? result : null;
      const id = record && (typeof record.id === "string" || typeof record.id === "number")
        ? String(record.id)
        : "";
      setSuccess(id ? `Request ${id} was submitted.` : "Your request was submitted.");
      setForm(initialForm);
      setReviewing(false);
      if (id) navigate(`/team-lead/requests?requestId=${encodeURIComponent(id)}`, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The request could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.page}`}>
      {/* <PageHeader
        title="Submit a resource request"
        description="Use project and team names exactly as configured; the backend verifies that the project is assigned to the team."
        supplementary={<Link to="/team-lead/requests">Request history</Link>}
      /> */}
      {submitError && <ErrorMessage title="Request not submitted" message={submitError} />}
      {success && <p className={styles.notice} role="status">{success}</p>}
      {managerError && (
        <ErrorMessage
          title="Line Managers unavailable"
          message={managerError}
          onRetry={() => void loadLineManagers()}
        />
      )}
      {loadingManagers ? (
        <LoadingState message="Loading active Line Managers..." />
      ) : (
        <form className={`rt-root ${formStyles.form}`} onSubmit={(event) => {
          if (!reviewing) {
            event.preventDefault();
            const nextErrors = validate();
            setErrors(nextErrors);
            if (!Object.keys(nextErrors).length) setReviewing(true);
          } else {
            void submitRequest(event);
          }
        }} noValidate>
          <section className={formStyles.card}>
            <div className={formStyles.sectionHeading}>
              <h2>{reviewing ? "Review request" : "Request details"}</h2>
            </div>
            {reviewing ? (
              <dl className={formStyles.reviewGrid}>
                {fields.map(({ name, label }) => (
                  <div className={formStyles.reviewField} key={name}>
                    <dt className={formStyles.reviewLabel}>{label}</dt>
                    <dd className={formStyles.reviewValue}>{form[name]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className={formStyles.grid}>
                {fields.map(({ name, label, numeric }) => (
                  <div className={formStyles.field} key={name}>
                    <label htmlFor={`request-${name}`}>{label} *</label>
                    {name === "lineManagerName" ? (
                      <select
                        id={`request-${name}`}
                        value={form[name]}
                                             
                        onChange={(event) => updateField(name, event.target.value)}
                        aria-invalid={Boolean(errors[name])}
                        required
                      >
                        <option value="">Select a Line Manager</option>
                        {lineManagers.map((manager) => (
                          <option key={manager.id} value={manager.fullName}>
                            {manager.fullName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`request-${name}`}
                        type={numeric ? "number" : "text"}
                        min={numeric ? "1" : undefined}
                        step={numeric ? "1" : undefined}
                        value={form[name]}
                        onChange={(event) => updateField(name, event.target.value)}
                        aria-invalid={Boolean(errors[name])}
                        required
                      />
                    )}
                    {errors[name] && (
                      <p className={formStyles.fieldError} role="alert">{errors[name]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className={formStyles.actions}>
              <button
                type="button"
                className="rt-root rt-btn rt-btn--outline"
                onClick={() => reviewing ? setReviewing(false) : navigate("/team-lead/dashboard")}
                disabled={busy}
              >
                {reviewing ? "Back to edit" : "Cancel"}
              </button>
              <button
                type="submit"
                className="rt-root rt-btn rt-btn--primary"
                disabled={busy || lineManagers.length === 0}
              >
                {busy ? "Submitting..." : reviewing ? "Submit request" : "Review request"}
              </button>
            </div>
          </section>
        </form>
      )}
    </section>
  );
}
