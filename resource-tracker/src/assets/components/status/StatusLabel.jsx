const TONES = {
  approved: "approved",
  pending: "pending",
  queried: "queried",
  declined: "declined",
  rejected: "declined",
};

/** Colour-coded pill for a request status. Unknown statuses fall back to a neutral green. */
export default function StatusLabel({ status }) {
  const key = String(status ?? "").trim().toLowerCase();
  const tone = TONES[key] ?? "neutral";
  return <span className={`rt-root rt-status rt-status--${tone}`}>{status}</span>;
}
