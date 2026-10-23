import lazyPage from "./lazyPage";

const LineManagerDashboard = lazyPage(() => import("../pages/line-manager/LineManagerDashboard"));
const RequestToReviewPage = lazyPage(() => import("../pages/line-manager/RequestToReviewpage"));
const RequestReviewDetailsPage = lazyPage(() => import("../pages/line-manager/RequestReviewDetailsPage"));
const DecisionHistoryPage = lazyPage(() => import("../pages/line-manager/DecisionHistoryPage"));

const lineManagerRoutes = [
  { path: "/line-manager/dashboard", element: <LineManagerDashboard /> },
  { path: "/line-manager/requests", element: <RequestToReviewPage /> },
  { path: "/line-manager/requests/:id", element: <RequestReviewDetailsPage /> },
  { path: "/line-manager/decisions", element: <DecisionHistoryPage /> },
];

export default lineManagerRoutes;