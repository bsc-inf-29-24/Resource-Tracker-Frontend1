import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./assets/components/layout/DashboardLayout";
import TeamLeadDashboard from "./assets/pages/team-lead/TeamLeadDashboard";
import LoadingState from "./assets/components/feedback/LoadingState";

function LoginPage() {
  return (<div><h1 className="sigIN">Sign in</h1>
  <LoadingState message="Loading, Please wait..."/></div>);
  
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
export default App;
