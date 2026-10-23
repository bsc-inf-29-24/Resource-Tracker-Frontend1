import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./assets/components/layout/DashboardLayout";

// Shown when a page file is empty (no default export yet).
function NotBuilt() {
  return <p style={{ padding: 24 }}>This page has not been built yet.</p>;
}

function page(loader) {
  return lazy(() =>
    loader().then((m) => (m.default ? m : { default: NotBuilt }))
  );
}

// Auth
const LoginPage = page(() => import("./assets/pages/auth/LoginPage"));
const ForgotPasswordPage = page(() => import("./assets/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = page(() => import("./assets/pages/auth/ResetPasswordPage"));

// Team Lead
const TeamLeadDashboard = page(() => import("./assets/pages/team-lead/TeamLeadDashboard"));
const NewRequestPage = page(() => import("./assets/pages/team-lead/NewRequestPage"));
const RequestHistoryPage = page(() => import("./assets/pages/team-lead/RequestHistoryPage"));
const QueryResponsePage = page(() => import("./assets/pages/team-lead/QueryResponsePage"));

// Line Manager
const LineManagerDashboard = page(() => import("./assets/pages/line-manager/LineManagerDashboard"));
const RequestToReviewPage = page(() => import("./assets/pages/line-manager/RequestToReviewpage"));
const RequestReviewDetailsPage = page(() => import("./assets/pages/line-manager/RequestReviewDetailsPage"));
const DecisionHistoryPage = page(() => import("./assets/pages/line-manager/DecisionHistoryPage"));

// Department Manager
const DepartmentDashboard = page(() => import("./assets/pages/department-manager/DepartmentDashboard"));
const DepartmentRequestPage = page(() => import("./assets/pages/department-manager/DepartmentRequestPage"));
const SpendingReportsPage = page(() => import("./assets/pages/department-manager/SpendingReportsPage"));
const ResourceAllocationPage = page(() => import("./assets/pages/department-manager/ResourceAllocationPage"));

// System Admin
const SystemAdminDashboard = page(() => import("./assets/pages/system-admin/DashboardPage"));
const UserManagementPage = page(() => import("./assets/pages/system-admin/UserManagementPage"));
const CreateUserPage = page(() => import("./assets/pages/system-admin/CreateUserPage"));
const UserDetailsPage = page(() => import("./assets/pages/system-admin/UserDetailsPage"));
const EditUserPage = page(() => import("./assets/pages/system-admin/EditUserPage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
        <Routes>
          {/* Pages without the sidebar and header */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* System admin pages (they bring their own layout for now) */}
          <Route path="/system-admin/dashboard" element={<SystemAdminDashboard />} />
          <Route path="/system-admin/users" element={<UserManagementPage />} />
          <Route path="/system-admin/users/new" element={<CreateUserPage />} />
          <Route path="/system-admin/users/:id" element={<UserDetailsPage />} />
          <Route path="/system-admin/users/:id/edit" element={<EditUserPage />} />

          {/* Pages inside the dashboard layout */}
          <Route element={<DashboardLayout />}>
            {/* Team Lead */}
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
            <Route path="/team-lead/requests/new" element={<NewRequestPage />} />
            <Route path="/team-lead/requests" element={<RequestHistoryPage />} />
            <Route path="/team-lead/requests/:id/respond" element={<QueryResponsePage />} />

            {/* Line Manager */}
            <Route path="/line-manager/dashboard" element={<LineManagerDashboard />} />
            <Route path="/line-manager/requests" element={<RequestToReviewPage />} />
            <Route path="/line-manager/requests/:id" element={<RequestReviewDetailsPage />} />
            <Route path="/line-manager/decisions" element={<DecisionHistoryPage />} />

            {/* Department Manager */}
            <Route path="/department-manager/dashboard" element={<DepartmentDashboard />} />
            <Route path="/department-manager/requests" element={<DepartmentRequestPage />} />
            <Route path="/department-manager/spending" element={<SpendingReportsPage />} />
            <Route path="/department-manager/allocation" element={<ResourceAllocationPage />} />
          </Route>

          {/* Default page and unknown URLs */}
          <Route path="*" element={<Navigate to="/system-admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
