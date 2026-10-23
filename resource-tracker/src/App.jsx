import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./assets/pages/auth/LoginPage";
import ForgotPasswordPage from "./assets/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./assets/pages/auth/ResetPasswordPage"

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<DashboardLayout />}>
          <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
      
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
