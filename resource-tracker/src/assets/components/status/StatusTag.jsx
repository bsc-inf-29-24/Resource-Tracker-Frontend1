import { SendIcon, ClockIcon, QuestionIcon, CheckCircleIcon, CrossCircleIcon } from '../icons/Icons';

/**
 * One consistent look per status: tinted pill + an icon that takes the same colour as the text.
 * Any status text from the backend is mapped here ("Declined" is shown as a Rejected-style tag).
 */
const MAP = {
  submitted: { cls: 'submitted', Icon: SendIcon },
  pending: { cls: 'pending', Icon: ClockIcon },
  queried: { cls: 'queried', Icon: QuestionIcon },
  approved: { cls: 'approved', Icon: CheckCircleIcon },
  rejected: { cls: 'rejected', Icon: CrossCircleIcon },
  declined: { cls: 'rejected', Icon: CrossCircleIcon },
};

export default function StatusTag({ status }) {
  const { cls, Icon } = MAP[String(status).toLowerCase()] ?? MAP.submitted;
  return (
    <span className={`rt-tag rt-tag--${cls}`}>
      <Icon size={17} />
      {status}
    </span>
  );
}
