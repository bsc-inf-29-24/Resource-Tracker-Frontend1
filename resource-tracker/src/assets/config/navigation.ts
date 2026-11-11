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
    { label: "New Request", path: "/team-lead/requests/new" },
    { label: "Request History", path: "/team-lead/requests" },
    { label: "Notifications", path: "/notifications" },
  ],
  LINE_MANAGER: [
    { label: "Dashboard", path: "/line-manager/dashboard" },
    { label: "Requests to Review", path: "/line-manager/requests" },
    { label: "Decision History", path: "/line-manager/decisions" },
    { label: "Resource Allocations", path: "/line-manager/allocations" },
    { label: "Notifications", path: "/notifications" },
  ],
  DEPARTMENT_MANAGER: [
    { label: "Dashboard", path: "/department-manager/dashboard" },
    { label: "Requests", path: "/department-manager/requests" },
    { label: "Spending", path: "/department-manager/spending" },
    { label: "Allocation", path: "/department-manager/allocation" },
    { label: "Teams", path: "/department-manager/teams" },
    { label: "Projects", path: "/department-manager/projects" },
    { label: "Notifications", path: "/notifications" },
  ],
  MANAGING_DIRECTOR: [
    { label: "Dashboard", path: "/managing-director/dashboard" },
    { label: "Users", path: "/managing-director/users" },
    { label: "Departments", path: "/managing-director/departments" },
    { label: "Teams", path: "/managing-director/teams" },
    { label: "Projects", path: "/managing-director/projects" },
    { label: "Resources", path: "/managing-director/resources" },
    { label: "Requests", path: "/managing-director/requests" },
    { label: "Reports", path: "/managing-director/reports" },
    { label: "Notifications", path: "/notifications" },
  ],
  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/system-admin/dashboard" },
    { label: "User Management", path: "/system-admin/users" },
    { label: "Create User", path: "/system-admin/users/new" },
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
