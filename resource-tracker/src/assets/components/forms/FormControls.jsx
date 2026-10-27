import { useId } from 'react';
import { ChevronDownIcon } from '../icons/Icons';

/** Label + control + error wrapper used by every field. `children` receives the props the control needs. */
export function FormField({ label, optional = false, error, hint, fullWidth = false, children }) {
  const id = useId();
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={`rt-field${fullWidth ? ' is-full' : ''}`}>
      {label && (
        <label className="rt-field__label" htmlFor={id}>
          {label}{optional && <span className="rt-field__optional"> (Optional)</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': errId })}
      {hint && !error && <span className="rt-field__counter">{hint}</span>}
      {error && <p id={errId} className="rt-field__error">{error}</p>}
    </div>
  );
}

export function TextInput({ label, optional, error, hint, fullWidth, ...rest }) {
  return (
    <FormField label={label} optional={optional} error={error} hint={hint} fullWidth={fullWidth}>
      {(a11y) => <input className="rt-control" {...a11y} {...rest} />}
    </FormField>
  );
}

/** options: ['Finance', 'ICT'] or [{ value, label }] */
export function SelectInput({ label, optional, error, fullWidth, options = [], placeholder = 'Select…', ...rest }) {
  return (
    <FormField label={label} optional={optional} error={error} fullWidth={fullWidth}>
      {(a11y) => (
        <select className="rt-control" {...a11y} {...rest}>
          <option value="">{placeholder}</option>
          {options.map((o) => {
            const v = typeof o === 'object' ? o.value : o;
            const l = typeof o === 'object' ? o.label : o;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
      )}
    </FormField>
  );
}

/** Text area with a live "0/300" counter. */
export function TextArea({ label, optional, error, maxLength = 300, value = '', fullWidth = true, ...rest }) {
  return (
    <FormField label={label} optional={optional} error={error} hint={`${value.length}/${maxLength}`} fullWidth={fullWidth}>
      {(a11y) => <textarea className="rt-control" maxLength={maxLength} value={value} {...a11y} {...rest} />}
    </FormField>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Day / Month / Year dropdown row. value: { day, month, year } (month is 1-12). */
export function DateSelect({ label = 'Date', value, onChange, error, years = 5 }) {
  const thisYear = new Date().getFullYear();
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const cell = (name, opts, text) => (
    <div>
      <select className="rt-control" aria-label={`${label} ${name}`} value={value[name] ?? ''} onChange={set(name)}>
        {opts}
      </select>
      <small>{text}</small>
    </div>
  );
  return (
    <div className="rt-field">
      <span className="rt-field__label">{label}</span>
      <div className="rt-date-row" role="group" aria-label={label}>
        {cell('day', Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>), 'Day')}
        {cell('month', MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>), 'Month')}
        {cell('year', Array.from({ length: years }, (_, i) => <option key={i} value={thisYear + i}>{thisYear + i}</option>), 'Year')}
      </div>
      {error && <p className="rt-field__error">{error}</p>}
    </div>
  );
}

/** White card that groups related fields: icon + title + one-line hint, then a two-column grid. */
export function FormSection({ icon, title, hint, children }) {
  return (
    <section className="rt-form-section">
      <div className="rt-form-section__head">
        {icon}
        <div>
          <h2 className="rt-form-section__title">{title}</h2>
          {hint && <p className="rt-form-section__hint">{hint}</p>}
        </div>
      </div>
      <div className="rt-form-grid">{children}</div>
    </section>
  );
}

/** Bottom row: Reset on the left, main action on the right. */
export function FormActions({ children }) {
  return <div className="rt-form-actions">{children}</div>;
}

export { ChevronDownIcon };
