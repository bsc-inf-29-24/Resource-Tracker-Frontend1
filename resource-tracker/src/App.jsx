
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";
import SystemAdminDashboard from "./assets/pages/system-admin/DashboardPage";

function LoginPage() {
  return <h1>Resource Tracker System</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* System Administrator Dashboard */}
        <Route
          path="/system-admin/dashboard"
          element={<SystemAdminDashboard />}
        />

        {/* Team Lead Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/team-lead/dashboard"
            element={<TeamLeadDashboard />}
          />
        </Route>

        {/* Default page */}
        <Route
          path="/"
          element={<Navigate to="/system-admin/dashboard" replace />}
        />

        {/* Unknown URLs */}
        <Route
          path="*"
          element={<Navigate to="/system-admin/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

