interface LoadingStateProps {
  message?: string;
  label?: string;
}
<<<<<<< HEAD

function Spinner({
  size = 32,
  label = "Loading",
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span role="status" style={{ display: "inline-block" }}>
      <span
        className="rt-spinner"
        style={{ width: size, height: size, borderWidth: Math.max(2, size / 8) }}
      />
      <span className="rt-sr-only">{label}</span>
    </span>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rt-root rt-skeletons" role="status" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rt-skeleton" />
      ))}
      <span className="rt-sr-only">Loading</span>
=======
//display a loading message and spinner while information is being retrieved. it will allow input of a dispaly message to show which operation is being awaited for
function LoadingState({
  message = "Loading, Please wait...",
}: LoadingStateProps) {
  return (
    <div className="feedback-state loading-state" role="status">
        <div className="loading-spinner"></div>
        <p>{message}</p>
>>>>>>> 63854794c0b67b7236447ffaaa01104b8a53fe85
    </div>
  );
}

const LoadingState = Object.assign(
  function LoadingState({ message, label }: LoadingStateProps) {
    const loadingMessage = message ?? label ?? "Loading...";
    return (
      <div className="rt-root rt-state" role="status">
        <span className="rt-spinner" />
        <p className="rt-state__text">{loadingMessage}</p>
      </div>
    );
  },
  { Spinner, Skeleton }
);

export default LoadingState;