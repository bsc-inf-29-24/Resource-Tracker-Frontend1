import { AlertCircleIcon } from "../icons";
import Button from "../forms/Button";

export default function ErrorMessage({ message, title = "Something went wrong", variant = "block", onRetry, id }) {
  if (!message) return null;
  if (variant === "inline") {
    return (
      <p id={id} className="rt-root rt-error-inline" role="alert">
        <AlertCircleIcon /> {message}
      </p>
    );
  }
  return (
    <div className="rt-root rt-error-block" role="alert">
      <AlertCircleIcon />
      <div>
        <p className="rt-error-block__title">{title}</p>
        <p className="rt-error-block__text">{message}</p>
        {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
      </div>
    </div>
  );
}
