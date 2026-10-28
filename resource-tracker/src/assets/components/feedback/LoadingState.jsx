/** Spinner for buttons/cards */
function Spinner({ size = 32, label = "Loading" }) {
  return (
    <span role="status" style={{ display: "inline-block" }}>
      <span className="rt-spinner" style={{ width: size, height: size, borderWidth: Math.max(2, size / 8) }} />
      <span className="rt-sr-only">{label}</span>
    </span>
  );
}

/** Placeholder rows shown while table/list data loads */
function Skeleton({ rows = 5 }) {
  return (
    <div className="rt-root rt-skeletons" role="status" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="rt-skeleton" />)}
      <span className="rt-sr-only">Loading</span>
    </div>
  );
}

/** Full-area loading message: <LoadingState label="Loading requests..." /> */
export default function LoadingState({ label, message }) {
  const loadingMessage = message ?? label ?? "Loading...";
  return (
    <div className="rt-root rt-state" role="status">
      <span className="rt-spinner" />
      <p className="rt-state__text">{loadingMessage}</p>
    </div>
  );
}
LoadingState.Spinner = Spinner;
LoadingState.Skeleton = Skeleton;
