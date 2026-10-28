import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DEMO_PASSWORD, signInDemoUser } from "../../data/auth-store";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import styles from "./AuthPage.module.css";
import AuthLayout from "./AuthLayout";
import { mockUsers } from "../../data/mock-data"; 
import { Eye, EyeOff } from "lucide-react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleHome: Record<string, string> = {
  "team-lead": "/team-lead/dashboard",
  "line-manager": "/line-manager/dashboard",
  "department-manager": "/department-manager/dashboard",
  "system-admin": "/system-admin/dashboard",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const emailError = submitted
    ? !email.trim()
      ? "Enter your email address."
      : !emailPattern.test(email.trim())
        ? "Enter a valid email address."
        : ""
    : "";
  const passwordError = submitted && !password ? "Enter your password." : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");

    if (!email.trim() || !emailPattern.test(email.trim()) || !password) return;

    setBusy(true);
    try {
      const account = await signInDemoUser(email.trim(), password);
      navigate(roleHome[account.role], { replace: true });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Sign-in failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`rt-root ${styles.card}`} aria-labelledby="login-title">
      <p className={styles.eyebrow}>Resource Tracker</p>
      <h1 id="login-title" className={styles.title}>
        Sign in
      </h1>
      
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            required
          />
          {emailError && (
            <p className={styles.fieldError} id="login-email-error" role="alert">
              {emailError}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password">Password</label>
          <div className={styles.passwordControl}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "login-password-error" : undefined}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError && (
            <p className={styles.fieldError} id="login-password-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/forgot-password">Forgot your password?</Link>
        <Link to="/register">Create a test account</Link>
      </div>
    </section>
  );
}



/*defining the dashboard routes for each user role, 
 which will be used to navigate to the appropriate dashboard after a successful login.*/
const dashboardRoutes: Record<string, string> = {
  TEAM_LEAD: "/team-lead/dashboard",
  LINE_MANAGER: "/line-manager/dashboard",
  DEPARTMENT_MANAGER: "/department-manager/dashboard",
  SYSTEM_ADMIN: "/admin/dashboard",
};

//LoginPage component handles user login functionality
// function LoginPage() {
//   const navigate = useNavigate();

//   //these creates state variables to manage the email, password, showPassword and error states of the login form.
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");

//   //This function handles the form submission event, validates the input fields, checks the credentials against the mock user data
//   //  and navigates to the appropriate dashboard if the login is successful.
//   function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError("");// Crearing prevoius error messages before validating the form inputs.

//     const normalizedEmail = email.trim().toLowerCase();

//     //Checking if the email and password fields are empty
//     if (!normalizedEmail || !password) {
//       setError("Please enter your email and password.");
//       return;
//     }

//     //Checking if the email format is valid using a regular expression. (Regex checks for a valid email format)
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[[a-zA-Z]{2,}$/;
//     if (!normalizedEmail.match(emailRegex)) {
//       setError("Please enter a valid email address.");
//       return;
//     }

//     //Searching for a user in the mockUsers array that matches the provided email and password.
//     const user = mockUsers.find(
//       (item) =>
//         item.email.toLowerCase() === normalizedEmail &&
//         item.password === password
//     );

//     //If no matching user is found, an error message is displayed.
//     if (!user) {
//       setError("Invalid email or password. Please try again.");
//       return;
//     }

//     // Demo only: store the signed-in user for this browser session.
//     sessionStorage.setItem(
//       "resourceTrackerUser",//Storing the user information in the session storage to maintain the user's login state across different pages during the session.under the key "resourceTrackerUser".
//       JSON.stringify({
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       })
//     );

//     //Redirecting to the correct dashboard
//     navigate(dashboardRoutes[user.role] ?? "/login", {
//       replace: true,
//     });
//   }

//   //Displaying the login form with email and password fields, a "Forgot password?" link, and a submit button.
//   return (
//     <AuthLayout>
//       <h1>Welcome back</h1>
//       <p className="auth-description">
//         Login to start your session.
//       </p>

//       <h2 className="login">Login</h2>
    
//       <form className="auth-form" onSubmit={handleSubmit} noValidate>
//         <div className="auth-field">
//           <label htmlFor="email">Email</label>
//           <input
//             id="email"
//             type="email"
//             autoComplete="username"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(event) => setEmail(event.target.value)}
//             required
//           />
//         </div>

//         <div className="auth-field">
//           <label htmlFor="password">Password</label>
//           <div className="auth-password-wrapper">
//             <input
//               id="password"
//               type={showPassword ? "text" : "password"}
//               autoComplete="current-password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               required
//             />
//             <button
//               className="eye-button"
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? <EyeOff/> : <Eye/>}
//             </button>
            
//           </div>
//         </div>

//         <div className="auth-link-row">
//           <Link to="/forgot-password">Forgot password?</Link>
//         </div>

//         {error && (
//           <p className="auth-error" role="alert">
//             {error}
//           </p>
//         )}

//         <button className="auth-submit" type="submit">
//           Log in
//         </button>
//       </form>

//       <div className="auth-footer">
//         Staff Access Only
//       </div>
//     </AuthLayout>
//   );
// }

// export default LoginPage;
