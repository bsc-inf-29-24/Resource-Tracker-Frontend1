import { Suspense } from "react";
import { BrowserRouter, Navigate, useRoutes } from "react-router-dom";
import DashboardLayout from "./assets/components/layout/DashboardLayout";
import authRoutes from "./assets/routes/authRoutes";
import teamLeadRoutes from "./assets/routes/teamLeadRoutes";
import lineManagerRoutes from "./assets/routes/lineManagerRoutes";
import departmentManagerRoutes from "./assets/routes/departmentManagerRoutes";
import systemAdminRoutes from "./assets/routes/systemAdminRoutes";

function AppRoutes() {
  return useRoutes([
    // Pages without the sidebar and header
    ...authRoutes,

    // Pages inside the dashboard layout
    {
      element: <DashboardLayout />,
      children: [
        ...teamLeadRoutes,
        ...lineManagerRoutes,
        ...departmentManagerRoutes,
        ...systemAdminRoutes,
      ],
    },

    { path: "*", element: <Navigate to="/team-lead/dashboard" replace /> },
  ]);
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

