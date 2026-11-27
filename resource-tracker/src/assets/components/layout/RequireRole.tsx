import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "../../config/navigation";
import { useAuth } from "../../context/AuthContext";
import { getFrontendRoleFromBackendRole } from "../../data/auth-store";

const dashboardRoutes: Record<UserRole, string> = {
  TEAM_LEAD: "/team-lead/dashboard",
  LINE_MANAGER: "/line-manager/dashboard",
  DEPARTMENT_MANAGER: "/department-manager/dashboard",
  MANAGING_DIRECTOR: "/managing-director/dashboard",
  SYSTEM_ADMIN: "/system-admin/dashboard",
  TEAM_MEMBER: "/team-member/dashboard",
};

interface RequireRoleProps {
  allowedRoles: UserRole[];
}

function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = getFrontendRoleFromBackendRole(user.role);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={dashboardRoutes[role]} replace />;
  }

  return <Outlet />;
}

export default RequireRole;
