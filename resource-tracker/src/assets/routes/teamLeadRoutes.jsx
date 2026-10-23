import lazyPage from "./lazyPage";

const TeamLeadDashboard = lazyPage(() => import("../pages/team-lead/TeamLeadDashboard"));
const NewRequestPage = lazyPage(() => import("../pages/team-lead/NewRequestPage"));
const RequestHistoryPage = lazyPage(() => import("../pages/team-lead/RequestHistoryPage"));
const QueryResponsePage = lazyPage(() => import("../pages/team-lead/QueryResponsePage"));

const teamLeadRoutes = [
  { path: "/team-lead/dashboard", element: <TeamLeadDashboard /> },
  { path: "/team-lead/requests/new", element: <NewRequestPage /> },
  { path: "/team-lead/requests", element: <RequestHistoryPage /> },
  { path: "/team-lead/requests/:id/respond", element: <QueryResponsePage /> },
];

export default teamLeadRoutes;