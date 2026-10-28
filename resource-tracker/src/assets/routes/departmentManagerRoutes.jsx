import lazyPage from "./lazyPage";

const DepartmentDashboard = lazyPage(() => import("../pages/department-manager/DepartmentDashboard"));
const DepartmentRequestPage = lazyPage(() => import("../pages/department-manager/DepartmentRequestPage"));
const DepartmentRequestDetailsPage = lazyPage(() => import("../pages/department-manager/DepartmentRequestDetailsPage"));
const SpendingReportsPage = lazyPage(() => import("../pages/department-manager/SpendingReportsPage"));
const ResourceAllocationPage = lazyPage(() => import("../pages/department-manager/ResourceAllocationPage"));

const departmentManagerRoutes = [
  { path: "/department-manager/dashboard", element: <DepartmentDashboard /> },
  { path: "/department-manager/requests", element: <DepartmentRequestPage /> },
  { path: "/department-manager/requests/:id", element: <DepartmentRequestDetailsPage /> },
  { path: "/department-manager/spending", element: <SpendingReportsPage /> },
  { path: "/department-manager/allocation", element: <ResourceAllocationPage /> },
];

export default departmentManagerRoutes;