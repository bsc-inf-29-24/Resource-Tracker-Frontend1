interface EmptyStateProps {
  title?: string;
  message?: string;
}

function EmptyState({
  title = "No available data",
  message = "There is nothing to display here for now.",
}: EmptyStateProps) {
  return (
    <div className="feedback-state empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        0
      </div>

      <h3>{title}</h3>

      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
