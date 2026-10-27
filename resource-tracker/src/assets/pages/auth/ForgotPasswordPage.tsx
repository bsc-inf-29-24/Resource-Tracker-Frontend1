
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

    //Checking if the email format is valid using a regular expression. (Regex checks for a valid email format)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[[a-zA-Z]{2,}$/;
    if (!normalizedEmail.match(emailRegex)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Just Example: no email is actually sent.
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

      <h1>Reset Password</h1>
      <p className="auth-description">
        Enter your email and we'll show you a 
        password reset confirmation.
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
            This email belongs to a demo account, a reset
            request would be processed. No email was sent because
            this system version does not have a backend.
            <p>
              <Link to="/reset-password">
                Continue to reset Password page
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
