import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
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