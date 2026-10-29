
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import styles from "./AuthPage.module.css";

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <section className={`rt-root ${styles.card}`} aria-labelledby="reset-title">
      <Link className={styles.backLink} to="/login">
        ← Back to Sign in
      </Link>

      <h1 className={styles.title} id="reset-title">
        Create new password
      </h1>
      <p className={styles.description}>
        Both passwords must match containing at least 8 characters.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="new-password">Password</label>
          <div className={styles.passwordControl}>
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
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff/> : <Eye/>}
            </button>
          </div>
         
        </div>

        <div className={styles.field}>
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className={styles.passwordControl}>
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
              type="button"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showConfirmPassword}
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              {showPassword ? <EyeOff/> : <Eye/>}
            </button>
          </div>

        </div>

        {error && (
          <p className={styles.fieldError} role="alert">
            {error}
          </p>
        )}

        {success && (
          <div className={styles.success} role="status">
            Password validation passed. In this System Version, no actual
            password has been changed.
            <p>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => navigate("/login")}
              >
                Return to login
              </button>
            </p>
          </div>
        )}

        <button className={styles.submit} type="submit">
          Reset Password
        </button>
      </form>
    </section>
  );
}

export default ResetPasswordPage;
