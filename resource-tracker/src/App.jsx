import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  getDashboardPathForRole,
  getFrontendRoleFromBackendRole,
} from "./assets/data/auth-store";
import { getRoleForPath } from "./assets/config/navigation";
import AuthLayout from "./assets/components/layout/AuthLayout";
import DashboardLayout from "./assets/components/layout/DashboardLayout";
import { AuthProvider, useAuth } from "./assets/context/AuthContext";

function NotBuilt() {
  return <p style={{ padding: 24 }}>This page has not been built yet.</p>;
}

function page(loader) {
  return lazy(() =>
    loader().then((m) => (m.default ? m : { default: NotBuilt })),
  );
}

function ProtectedRoute({ children, requiredRole }) {
  const { pathname } = useLocation();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <p style={{ padding: 24 }}>Loading session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const expectedRole = requiredRole ?? getRoleForPath(pathname);
  const actualRole = getFrontendRoleFromBackendRole(user.role);
  if (!actualRole) {
    return (
      <section className="rt-root" role="alert">
        <h1>No frontend workspace for this account role</h1>
        <p>
          Your account is authenticated, but this frontend does not provide a
          dashboard for the backend role “{user.role}”.
        </p>
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </section>
    );
  }
  if (
    expectedRole &&
    actualRole !== expectedRole
  ) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return children;
}

// Auth
const LoginPage = page(() => import("./assets/pages/auth/LoginPage"));
const ForgotPasswordPage = page(
  () => import("./assets/pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = page(
  () => import("./assets/pages/auth/ResetPasswordPage"),
);

// Team Lead
const TeamLeadDashboardPage = page(
  () => import("./assets/pages/team-lead/TeamLeadDashboard"),
);
const NewRequestPage = page(
  () => import("./assets/pages/team-lead/NewApiRequestPage"),
);
const TeamLeadRequestHistoryPage = page(
  () => import("./assets/pages/team-lead/RequestHistoryPage"),
);
const TeamLeadQueryResponsePage = page(
  () => import("./assets/pages/team-lead/QueryResponsePage"),
);
const TeamLeadTeamsPage = page(
  () => import("./assets/pages/team-lead/TeamLeadTeamsPage"),
);
const TeamLeadProjectsPage = page(
  () => import("./assets/pages/team-lead/TeamLeadProjectsPage"),
);

const SpendingReportsPage = page(() =>
  import("./assets/pages/management/ReportsPage").then((module) => ({
    default: module.DepartmentSpendingReportPage,
  })),
);
const DepartmentReportsPage = page(() =>
  import("./assets/pages/management/ReportsPage").then((module) => ({
    default: module.DepartmentReportsPage,
  })),
);
const ResourceAllocationPage = page(() =>
  import("./assets/pages/management/ReportsPage").then((module) => ({
    default: module.AllocationHistoryReportPage,
  })),
);
const ManagingDirectorResourcesPage = page(
  () => import("./assets/pages/management/ResourcesPage"),
);
const LineManagerResourceAllocationsPage = page(
  () => import("./assets/pages/line-manager/ResourceAllocationsPage"),
);

// System Admin
const SystemAdminDashboard = page(
  () => import("./assets/pages/management/SystemAdminDashboard"),
);
const ManagingDirectorDashboard = page(
  () => import("./assets/pages/management/ManagingDirectorDashboard"),
);
const ResourceRequestsDashboard = page(
  () => import("./assets/pages/management/ResourceRequestsDashboard"),
);
const UserManagementPage = page(
  () => import("./assets/pages/management/UsersPage"),
);
const CreateUserPage = page(
  () => import("./assets/pages/system-admin/CreateUserPage"),
);
const UserDetailsPage = page(
  () => import("./assets/pages/management/UserDetailsPage"),
);
const EditUserPage = page(
  () => import("./assets/pages/management/EditUserPage"),
);
const DepartmentsPage = page(
  () => import("./assets/pages/management/DepartmentsPage"),
);
const ManagingDirectorTeamsPage = page(
  () => import("./assets/pages/management/ManagingDirectorTeamsPage"),
);
const ManagingDirectorProjectsPage = page(
  () => import("./assets/pages/management/ManagingDirectorProjectsPage"),
);
const TeamsPage = page(() => import("./assets/pages/management/TeamsPage"));
const ProjectsPage = page(
  () => import("./assets/pages/management/ProjectsPage"),
);
const NotificationsPage = page(
  () => import("./assets/pages/management/NotificationsPage"),
);
const ReportsPage = page(
  () => import("./assets/pages/management/ReportsPage"),
);
const AuditLogsPage = page(
  () => import("./assets/pages/management/AuditLogsPage"),
);
const AccountSettingsPage = page(
  () => import("./assets/pages/account/AccountSettingsPage"),
);
const TeamMemberDashboard = page(
  () => import("./assets/pages/team-member/TeamMemberDashboard"),
);
const LineManagerDashboardPage = page(
  () => import("./assets/pages/line-manager/LineManagerDashboard"),
);
const LineManagerReviewQueuePage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.LineManagerReviewQueuePage,
  })),
);
const LineManagerReviewDetailsPage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.LineManagerReviewDetailsPage,
  })),
);
const LineManagerAllRequestsPage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.LineManagerAllRequestsPage,
  })),
);
const LineManagerDecisionHistoryPage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.LineManagerDecisionHistoryPage,
  })),
);
const LineManagerTeamsPage = page(
  () => import("./assets/pages/line-manager/LineManagerTeamsPage"),
);
const LineManagerReportsPage = page(
  () => import("./assets/pages/line-manager/LineManagerReportsPage"),
);
const LineManagerActivityPage = page(
  () => import("./assets/pages/line-manager/LineManagerActivityPage"),
);
const LineManagerResourceAllocationDetailsPage = page(
  () => import("./assets/pages/line-manager/ResourceAllocationDetailsPage"),
);
const DepartmentRequestListPage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.DepartmentRequestListPage,
  })),
);
const DepartmentRequestDetailsPageApi = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.DepartmentRequestDetailsPage,
  })),
);
const ManagingDirectorRequestDetailsPage = page(() =>
  import("./assets/pages/management/ResourceRequestPages").then((module) => ({
    default: module.ManagingDirectorRequestDetailsPage,
  })),
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/register"
                element={
                  <ProtectedRoute requiredRole="SYSTEM_ADMIN">
                    <CreateUserPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/account" element={<AccountSettingsPage />} />
              {/* System Admin */}
              <Route
                path="/system-admin/dashboard"
                element={<SystemAdminDashboard />}
              />
              <Route
                path="/system-admin/users"
                element={<UserManagementPage />}
              />
              <Route
                path="/system-admin/users/new"
                element={<CreateUserPage />}
              />
              <Route
                path="/system-admin/users/:id"
                element={<UserDetailsPage />}
              />
              <Route
                path="/system-admin/users/:id/edit"
                element={<EditUserPage />}
              />
              <Route
                path="/system-admin/audit-logs"
                element={<AuditLogsPage />}
              />
              <Route
                path="/managing-director/dashboard"
                element={<ManagingDirectorDashboard />}
              />
              <Route
                path="/managing-director/users"
                element={<Navigate to="/managing-director/dashboard" replace />}
              />
              <Route
                path="/managing-director/departments"
                element={<DepartmentsPage />}
              />
              <Route
                path="/managing-director/teams"
                element={<ManagingDirectorTeamsPage />}
              />
              <Route
                path="/managing-director/projects"
                element={<ManagingDirectorProjectsPage />}
              />
              <Route
                path="/managing-director/resources"
                element={<ManagingDirectorResourcesPage />}
              />
              <Route
                path="/managing-director/reports"
                element={<ReportsPage />}
              />
              <Route
                path="/department-manager/teams"
                element={<TeamsPage />}
              />
              <Route
                path="/department-manager/projects"
                element={<ProjectsPage />}
              />
              <Route
                path="/managing-director/requests"
                element={
                  <ResourceRequestsDashboard
                    title="Managing Director Requests"
                    description="Requests returned by the backend scope for the authenticated Managing Director."
                    detailsPath="/managing-director/requests"
                  />
                }
              />
              <Route
                path="/managing-director/requests/:id"
                element={<ManagingDirectorRequestDetailsPage />}
              />
              <Route
                path="/team-member/dashboard"
                element={<TeamMemberDashboard />}
              />

              {/* Team Lead */}
              <Route
                path="/team-lead/dashboard"
                element={<TeamLeadDashboardPage />}
              />
              <Route
                path="/team-lead/requests/new"
                element={<NewRequestPage />}
              />
              <Route
                path="/team-lead/requests"
                element={<TeamLeadRequestHistoryPage />}
              />
              <Route
                path="/team-lead/requests/:id"
                element={<TeamLeadRequestHistoryPage />}
              />
              <Route
                path="/team-lead/requests/:id/respond"
                element={<TeamLeadQueryResponsePage />}
              />
              <Route path="/team-lead/teams" element={<TeamLeadTeamsPage />} />
              <Route path="/team-lead/projects" element={<TeamLeadProjectsPage />} />

              {/* Line Manager */}
              <Route
                path="/line-manager/dashboard"
                element={<LineManagerDashboardPage />}
              />
              <Route
                path="/line-manager/requests"
                element={<LineManagerReviewQueuePage />}
              />
              <Route
                path="/line-manager/requests/:id"
                element={<LineManagerReviewDetailsPage />}
              />
              <Route
                path="/line-manager/all-requests"
                element={<LineManagerAllRequestsPage />}
              />
              <Route
                path="/line-manager/decisions"
                element={<LineManagerDecisionHistoryPage />}
              />
              <Route
                path="/line-manager/teams"
                element={<LineManagerTeamsPage />}
              />
              <Route
                path="/line-manager/reports"
                element={<LineManagerReportsPage />}
              />
              <Route
                path="/line-manager/activity"
                element={<LineManagerActivityPage />}
              />
              <Route
                path="/line-manager/allocations"
                element={<LineManagerResourceAllocationsPage />}
              />
              <Route
                path="/line-manager/allocations/:id"
                element={<LineManagerResourceAllocationDetailsPage />}
              />

              {/* Department Head */}
              <Route
                path="/department-manager/dashboard"
                element={<Navigate to="/department-manager/requests" replace />}
              />
              <Route
                path="/department-manager/requests"
                element={<DepartmentRequestListPage />}
              />
              <Route
                path="/department-manager/requests/:id"
                element={<DepartmentRequestDetailsPageApi />}
              />
              <Route
                path="/department-manager/spending"
                element={<SpendingReportsPage />}
              />
              <Route
                path="/department-manager/allocation"
                element={<ResourceAllocationPage />}
              />
              <Route
                path="/department-manager/reports"
                element={<DepartmentReportsPage />}
              />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
