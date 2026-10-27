import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./assets/pages/auth/LoginPage";
import ForgotPasswordPage from "./assets/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./assets/pages/auth/ResetPasswordPage";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import DepartmentDashboard from "./assets/pages/department-manager/DepartmentDashboard";
import LineManagerDashboard from "./assets/pages/line-manager/LineManagerDashboard";
import RequireRole from "./assets/components/layout/RequireRole";

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<DashboardLayout />}>
          <Route element={<RequireRole allowedRoles={["TEAM_LEAD"]} />}>
          </Route>

          <Route
            element={<RequireRole allowedRoles={["DEPARTMENT_MANAGER"]} />}
          >
            <Route
              path="/department-manager/dashboard"
              element={<DepartmentDashboard />}
            />
          </Route>

          <Route element={<RequireRole allowedRoles={["LINE_MANAGER"]} />}>
            <Route
              path="/line-manager/dashboard"
              element={<LineManagerDashboard />}
            />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
