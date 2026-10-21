
import { useState} from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { mockUsers } from "../../data/mock-data";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    //Checking if the netered email is valid email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Demo only: no email is actually sent.
    // Use a generic message to avoid revealing registered accounts.
    const accountExists = mockUsers.some(
      (user) => user.email.toLowerCase() === normalizedEmail
    );

    if (accountExists) {
      sessionStorage.setItem("demoResetEmail", normalizedEmail);
    }

    setSuccess(true);
  }

  return (
    <AuthLayout>
      <Link className="auth-back-link" to="/login">
        ← Back to login
      </Link>

      <h1>Reset Password</h1>
      <p className="auth-description">
        Enter your email address and we'll show a simulated
        password-reset confirmation.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <div className="auth-success" role="status">
            If this email belongs to a demo account, a reset
            request would be processed. No email was sent because
            this version does not have a backend.
            <p>
              <Link to="/reset-password">
                Continue to the demo reset page
              </Link>
            </p>
          </div>
        )}

        <button className="auth-submit" type="submit">
          Send reset link →
        </button>
      </form>

      <div className="auth-footer">
        Remembered your password?{" "}
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
