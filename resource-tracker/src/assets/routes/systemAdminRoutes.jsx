import lazyPage from "./lazyPage";

const SystemAdminDashboard = lazyPage(() => import("../pages/system-admin/DashboardPage"));
const UserManagementPage = lazyPage(() => import("../pages/system-admin/UserManagementPage"));
const CreateUserPage = lazyPage(() => import("../pages/system-admin/CreateUserPage"));
const UserDetailsPage = lazyPage(() => import("../pages/system-admin/UserDetailsPage"));
const EditUserPage = lazyPage(() => import("../pages/system-admin/EditUserPage"));

const systemAdminRoutes = [
  { path: "/system-admin/dashboard", element: <SystemAdminDashboard /> },
  { path: "/system-admin/users", element: <UserManagementPage /> },
  { path: "/system-admin/users/new", element: <CreateUserPage /> },
  { path: "/system-admin/users/:id", element: <UserDetailsPage /> },
  { path: "/system-admin/users/:id/edit", element: <EditUserPage /> },
];

export default systemAdminRoutes;