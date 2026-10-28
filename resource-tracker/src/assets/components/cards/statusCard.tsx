import LoadingState from "../feedback/LoadingState";

/**
 * Summary tile: icon + label + big number (Total Request 32, Pending 12 ...).
 * Pass onClick to make it a button (e.g. filter the table by that status).
 */
export default function StatusCard({ label, value, icon, note, onClick, loading = false }: {
    label: string;
    value: any;
    icon?: any;
    note?: string;
    onClick?: any;
    loading?: boolean | undefined;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`rt-root rt-statcard ${onClick ? "rt-statcard--clickable" : ""}`}
      {...(onClick ? { type: "button", onClick } : {})}
    >
      {icon && <span className="rt-statcard__icon">{icon}</span>}
      <span>
        <span className="rt-statcard__label">{label}</span>
        <span className="rt-statcard__value" aria-live="polite">
          {loading ? <LoadingState.Spinner size={22} label={`Loading ${label}`} /> : value}
        </span>
        {note && <span className="rt-statcard__note">{note}</span>}
      </span>
    </Tag>
  );
}

export const StatusCardGrid = ({ children }) => <div className="rt-root rt-statcards">{children}</div>;
