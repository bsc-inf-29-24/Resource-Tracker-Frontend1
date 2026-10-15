//Display error message and optionally a button to retry an operation to retry an operation
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

function ErrorMessage({
  title = "Something went wrong",
  message = "We couldn't load the information. Please try again.",
  onRetry,
}: ErrorStateProps) {
  //replace !: with a right icon

  return (
    <div className="feedback-state error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">
        !
      </div>
      <h3>{title}</h3>
      <p>{message}</p>

      {onRetry && (
        <button type="button" className="retry-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
