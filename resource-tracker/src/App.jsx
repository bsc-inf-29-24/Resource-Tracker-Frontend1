import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./assets/pages/auth/LoginPage";
import ForgotPasswordPage from "./assets/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "./assets/pages/auth/ResetPasswordPage"

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";


/*
function LoginPage() {
  return (<div><h1 className="sigIN">Sign in</h1>
  <LoadingState message="Loading, Please wait..."/></div>);
 
   <Route path="/login" element={<LoginPage />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/team-lead/dashboard" replace />}
        />
}
import LineManagerDashboard from "./assets/pages/team-lead/LineManagerDashboard";
import DepartmentDashboard from "./assets/pages/team-lead/DepartmentDashboard";
import AdminDashboard from "./assets/pages/team-lead/AdminDashboard";

<Route path="/line-manager/dashboard" element={<LineManagerDashboard />} />
          <Route path="/department-manager/dashboard" element={<DepartmentDashboard />} />
          <Route path="/system-admin/dashboard" element={<AdminDashboard />} />
*/

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
