import { useId } from "react";
import ErrorMessage from "../feedback/ErrorMessage";
import { SearchIcon } from "../icons";

/** Label + control + hint + error wrapper. `children` is a render function receiving aria props. */
export function FormField({ label, hint, error, required, optional, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const aria = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined,
    "aria-required": required || undefined,
  };
  return (
    <div className={`rt-root rt-field ${error ? "rt-field--invalid" : ""}`}>
      <label htmlFor={id} className="rt-field__label">
        {label}
        {required && <span className="rt-field__required" aria-hidden="true"> *</span>}
        {optional && <span className="rt-field__optional"> (Optional)</span>}
      </label>
      {children(aria)}
      {hint && !error && <span id={hintId} className="rt-field__hint">{hint}</span>}
      <ErrorMessage id={errId} variant="inline" message={error} />
    </div>
  );
}

/** <TextField label="Item Name" placeholder="e.g. Laptop, Projector" value onChange error /> */
export function TextField({ label, hint, error, required, optional, icon, className = "", ...input }) {
  return (
    <FormField {...{ label, hint, error, required, optional }}>
      {(aria) => (
        <span className="rt-input-wrap">
          {icon}
          <input className={`rt-input ${icon ? "rt-input--icon" : ""} ${className}`} {...aria} {...input} />
        </span>
      )}
    </FormField>
  );
}

/** options: [{ value, label }] or plain strings */
export function SelectField({ label, hint, error, required, optional, options = [], placeholder = "Select...", ...select }) {
  return (
    <FormField {...{ label, hint, error, required, optional }}>
      {(aria) => (
        <select className="rt-select" {...aria} {...select}>
          <option value="">{placeholder}</option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
      )}
    </FormField>
  );
}

/** Textarea with a live character counter (0/300) like the Purpose / Justification field */
export function TextAreaField({ label, hint, error, required, optional, maxLength = 300, value = "", ...area }) {
  return (
    <FormField {...{ label, hint, error, required, optional }}>
      {(aria) => (
        <>
          <textarea className="rt-textarea" maxLength={maxLength} value={value} {...aria} {...area} />
          <span className="rt-counter" aria-live="polite">{String(value).length}/{maxLength}</span>
        </>
      )}
    </FormField>
  );
}

export { SearchIcon };
