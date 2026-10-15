interface EmptyStateProps {
  title?: string;
  message?: string;
}
//Creatin Empty state component. Useful when team lead has not submitted any request
function EmptyState({
  title = "No available data",
  message = "There is nothing to display here for now.",
}: EmptyStateProps) {

//replace 0: with an empty file icon
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
