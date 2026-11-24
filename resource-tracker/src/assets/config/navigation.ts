import type {   LucideIcon } from "lucide-react";

//Defining system user roles 
export type UserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "MANAGING_DIRECTOR"
  | "SYSTEM_ADMIN"
  | "TEAM_MEMBER";

export interface NavigationItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

export const navigationConfig: Record<UserRole, NavigationItem[]> = {
  TEAM_LEAD: [
    { label: "Dashboard", path: "/team-lead/dashboard" },
    { label: "Request History", path: "/team-lead/requests" },
    { label: "Teams", path: "/team-lead/teams" },
    { label: "Projects", path: "/team-lead/projects" },
    { label: "Notifications", path: "/notifications" },
  ],
  LINE_MANAGER: [
    { label: "Requests to Review", path: "/line-manager/requests" },
    { label: "Resource Allocations", path: "/line-manager/allocations" },
    { label: "Notifications", path: "/notifications" },
  ],
  DEPARTMENT_MANAGER: [
    { label: "Department Requests", path: "/department-manager/requests" },
    { label: "Department Spending", path: "/department-manager/spending" },
    // { label: "Resource Allocation", path: "/department-manager/allocation" },
    { label: "Teams", path: "/department-manager/teams" },
    { label: "Projects", path: "/department-manager/projects" },
    { label: "Reports", path: "/department-manager/reports" },
    { label: "Notifications", path: "/notifications" },
  ],
  MANAGING_DIRECTOR: [
    { label: "Dashboard", path: "/managing-director/dashboard" },
    { label: "Teams", path: "/managing-director/teams" },
    { label: "Projects", path: "/managing-director/projects" },
    { label: "Resources", path: "/managing-director/resources" },
    { label: "Notifications", path: "/notifications" },
  ],
  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/system-admin/dashboard" },
    { label: "Manage Users", path: "/system-admin/users" },
    { label: "Audit logs", path: "/system-admin/audit-logs" },
    { label: "Notifications", path: "/notifications" },
  ],
  TEAM_MEMBER: [
    { label: "Dashboard", path: "/team-member/dashboard" },
    { label: "Notifications", path: "/notifications" },
  ],
};

export function getRoleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/team-lead/")) return "TEAM_LEAD";
  if (pathname.startsWith("/line-manager/")) return "LINE_MANAGER";
  if (pathname.startsWith("/department-manager/")) return "DEPARTMENT_MANAGER";
  if (pathname.startsWith("/managing-director/")) return "MANAGING_DIRECTOR";
  if (pathname.startsWith("/system-admin/")) return "SYSTEM_ADMIN";
  if (pathname.startsWith("/team-member/")) return "TEAM_MEMBER";
  return null;
}

export const roleDisplayNames: Record<UserRole, string> = {
  TEAM_LEAD: "Team Lead",
  LINE_MANAGER: "Line Manager",
  DEPARTMENT_MANAGER: "Department Head",
  MANAGING_DIRECTOR: "Managing Director",
  SYSTEM_ADMIN: "System Administrator",
  TEAM_MEMBER: "Team Member",
};
