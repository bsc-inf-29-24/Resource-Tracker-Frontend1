interface LoadingStateProps {
  message?: string;
}

function LoadingState({
  message = "Loading, Please wait...",
}: LoadingStateProps) {
  return (
    <div className="feedback-state loading-state" role="status">
      <div className="loading-spinner">
        <p>{message}</p>
      </div>
    </div>
  );
}


export default LoadingState;