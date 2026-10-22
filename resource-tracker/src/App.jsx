import { BrowserRouter, Routes, Route } from "react-router-dom";
import SystemAdminDashboard from "./assets/pages/system-admin/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SystemAdminDashboard />} />
        <Route path="/system-admin/dashboard" element={<SystemAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;