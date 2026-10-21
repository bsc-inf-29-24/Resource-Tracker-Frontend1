
import { useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!password || !confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Both passwords must match.");
      return;
    }

    // Demo only: no real account password is changed.
    setSuccess(true);
  }

  return (
    <AuthLayout>
      <Link className="auth-back-link" to="/login">
        ← Back to login
      </Link>

      <h1>Create new password</h1>
      <p className="auth-description">
        Your new password must contain at least 8 characters.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="new-password">Password</label>
          <div className="auth-password-wrapper">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter a new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="auth-text-button"
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <span className="auth-hint">
            Must be at least 8 characters.
          </span>
        </div>

        <div className="auth-field">
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="auth-password-wrapper">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
            />
            <button
              className="auth-text-button"
              type="button"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          <span className="auth-hint">
            Both passwords must match.
          </span>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <div className="auth-success" role="status">
            Password validation passed. In this demo, no actual
            password has been changed.
            <p>
              <button
                type="button"
                className="auth-text-button"
                onClick={() => navigate("/login")}
              >
                Return to login
              </button>
            </p>
          </div>
        )}

        <button className="auth-submit" type="submit">
          Reset Password
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
