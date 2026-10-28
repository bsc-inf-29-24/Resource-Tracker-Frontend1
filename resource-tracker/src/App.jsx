import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./assets/pages/auth/LoginPage";
import ForgotPasswordPage from "./assets/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./assets/pages/auth/ResetPasswordPage";

import DashboardLayout from "./assets/components/layout/DashboardLayout";

import ResourceRequest from "./assets/pages/team-lead/ResourceRequest";
import DepartmentDashboard from "./assets/pages/department-manager/DepartmentDashboard";
import LineManagerDashboard from "./assets/pages/line-manager/LineManagerDashboard";
import DashboardPage from "./assets/pages/system-admin/DashboardPage";
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
           <Route
              path="/team-lead/dashboard"
              element={<ResourceRequest />}
            />
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

           <Route element={<RequireRole allowedRoles={["SYSTEM_ADMIN"]} />}>
            <Route
              path="/admin/dashboard"
              element={<DashboardPage />}
            />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
