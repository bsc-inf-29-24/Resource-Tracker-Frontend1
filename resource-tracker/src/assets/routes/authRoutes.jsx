import lazyPage from "./lazyPage";

const LoginPage = lazyPage(() => import("../pages/auth/LoginPage"));
const ForgotPasswordPage = lazyPage(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazyPage(() => import("../pages/auth/ResetPasswordPage"));

// These pages have no sidebar or header.
const authRoutes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
];

export default authRoutes;