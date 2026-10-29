const TONES = {
  submitted: "neutral",
  approved: "approved",
  pending: "pending",
  queried: "queried",
  declined: "declined",
  rejected: "declined",
  active: "approved",
  inactive: "neutral",
};

const LABELS = {
  submitted: "Submitted",
  pending: "Pending",
  queried: "Queried",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
  active: "Active",
  inactive: "Inactive",
};

/** Colour-coded status pill; text remains available when the status has no mapped tone. */
export default function StatusLabel({ status }) {
  const key = String(status ?? "").trim().toLowerCase();
  const tone = TONES[key] ?? "neutral";
  const label = key
    ? LABELS[key] ?? String(status).trim()
    : "Status unavailable";
  return <span className={`rt-root rt-status rt-status--${tone}`}>{label}</span>;
}
