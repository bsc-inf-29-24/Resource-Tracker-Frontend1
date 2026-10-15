interface LoadingStateProps {
  message?: string;
}
//display a loading message and spinner while information is being retrieved
function LoadingState({
  message = "Loading, Please wait...",
}: LoadingStateProps) {
  return (
    <div className="feedback-state loading-state" role="status">
        <div className="loading-spinner"></div>
        <p>{message}</p>
    
    </div>
  );
}


export default LoadingState;