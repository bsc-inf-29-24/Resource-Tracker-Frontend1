import type {   LucideIcon } from "lucide-react";

//Defining system user roles 
export type UserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "SYSTEM_ADMIN";

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
  ],
  LINE_MANAGER: [
    { label: "Dashboard", path: "/line-manager/dashboard" },
    { label: "Requests to Review", path: "/line-manager/requests" },
    { label: "Decision History", path: "/line-manager/decisions" },
  ],
  DEPARTMENT_MANAGER: [
    { label: "Dashboard", path: "/department-manager/dashboard" },
    { label: "Requests", path: "/department-manager/requests" },
    { label: "Spending", path: "/department-manager/spending" },
    { label: "Allocation", path: "/department-manager/allocation" },
  ],
  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/system-admin/dashboard" },
    { label: "User Management", path: "/system-admin/users" },
    { label: "Create User", path: "/system-admin/users/new" },
  ],
};

export function getRoleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/team-lead/")) return "TEAM_LEAD";
  if (pathname.startsWith("/line-manager/")) return "LINE_MANAGER";
  if (pathname.startsWith("/department-manager/")) return "DEPARTMENT_MANAGER";
  if (pathname.startsWith("/system-admin/")) return "SYSTEM_ADMIN";
  return null;
}

export const roleDisplayNames: Record<UserRole, string> = {
  TEAM_LEAD: "Team Lead",
  LINE_MANAGER: "Line Manager",
  DEPARTMENT_MANAGER: "Department Manager",
  SYSTEM_ADMIN: "System Administrator",
};
