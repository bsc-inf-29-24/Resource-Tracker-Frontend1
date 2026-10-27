/** Maps any status text from the backend to one consistent look. */
const MAP = {
  submitted: 'submitted',
  pending: 'pending',
  queried: 'queried',
  approved: 'approved',
  rejected: 'rejected',
  declined: 'rejected',
};

export default function StatusTag({ status }) {
  const key = MAP[String(status).toLowerCase()] ?? 'submitted';
  return <span className={`rt-tag rt-tag--${key}`}>{status}</span>;
}
