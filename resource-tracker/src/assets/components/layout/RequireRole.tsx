//Add a route guard that checks the signed-in user’s role before rendering each dashboard. 
// This controls what the frontend displays
import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "../../config/navigation";

const USER_SESSION_KEY = "resourceTrackerUser";

const dashboardRoutes: Record<UserRole, string> = {
  TEAM_LEAD: "/team-lead/dashboard",
  LINE_MANAGER: "/line-manager/dashboard",
  DEPARTMENT_MANAGER: "/department-manager/dashboard",
  SYSTEM_ADMIN: "/admin/dashboard",
};

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "TEAM_LEAD" ||
    value === "LINE_MANAGER" ||
    value === "DEPARTMENT_MANAGER" ||
    value === "SYSTEM_ADMIN"
  );
}

function getStoredRole(): UserRole | null {
  const storedUser = sessionStorage.getItem(USER_SESSION_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedUser);

    if (typeof parsed !== "object" || parsed === null) {
      sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    const role = (parsed as Record<string, unknown>).role;

    if (!isUserRole(role)) {
      sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    return role;
  } catch {
    sessionStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

interface RequireRoleProps {
  allowedRoles: UserRole[];
}

function RequireRole({ allowedRoles }: RequireRoleProps) {
  const role = getStoredRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={dashboardRoutes[role]} replace />;
  }

  return <Outlet />;
}

export default RequireRole;