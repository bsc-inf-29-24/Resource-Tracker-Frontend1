import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";

function LoginPage() {
  return <h1>Resource Tracker System</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
      </Route>
    </BrowserRouter>
  );
}
export default App;
