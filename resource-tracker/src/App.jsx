import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
//import LineManagerDashboard from "./assets/pages/line-manager/LineManagerDashboard";
import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";

function LoginPage() {
  return <h1>Resource Tracker System</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/team-lead/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App()

