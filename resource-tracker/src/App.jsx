import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";
import DepartmentDashboard from "./assets/pages/department-manager/DepartmentDashboard";

function LoginPage() {
  return <h1>Resource Tracker System</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
          <Route path="/department-manager/dashboard" element={<DepartmentDashboard />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/department-manager/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}