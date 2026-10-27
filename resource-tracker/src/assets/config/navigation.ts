import type {   LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FilePlus,
  History,
  UsersRound,
  ClipboardCheck,
  ClipboardList,
  ChartNoAxesCombined,
  Package,
  Users,
  UserPlus,
} from "lucide-react";

//Defining system user roles 
export type UserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "SYSTEM_ADMIN";

//Defining the structure of a navigation item
  export interface NavigationItem {
  label: string;
  path: string;
   icon: LucideIcon;
}

//Defining the the links displayed for each role.
export const navigationConfig: Record<UserRole, NavigationItem[]> = {
 // Navigation items for each user role: TEAM_LEAD
  TEAM_LEAD: [
    {label: "Dashboard", path: "/team-lead/dashboard", icon: LayoutDashboard},
    { label: "New Request", path: "/team-lead/requests/new", icon: LayoutDashboard },
    { label: "Request History", path: "/team-lead/requests", icon: LayoutDashboard },
    { label: "My Project Team", path: "/team-lead/project-team" , icon: LayoutDashboard},

    
  ],
// Navigation items for each user role: LINE_MANAGER
  LINE_MANAGER: [
    { label: "Dashboard", path: "/line-manager/dashboard", icon: LayoutDashboard },
    { label: "Requests to Review", path: "/line-manager/review", icon: LayoutDashboard },
    { label: "Decision History", path: "/line-manager/history" , icon: LayoutDashboard},
  ],
// Navigation items for each user role: DEPARTMENT_MANAGER
  DEPARTMENT_MANAGER: [
    { label: "Dashboard", path: "/department-manager/dashboard", icon: LayoutDashboard },
    { label: "Department Requests", path: "/department-manager/requests", icon: LayoutDashboard },
    { label: "Spending Reports", path: "/department-manager/reports", icon: LayoutDashboard },
    { label: "Resource Allocation", path: "/department-manager/allocation", icon: LayoutDashboard },
  ],
// Navigation items for each user role: SYSTEM_ADMIN
  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", path: "/admin/users" , icon: LayoutDashboard},
    { label: "Departments", path: "/admin/departments" , icon: LayoutDashboard},
    { label: "Teams", path: "/admin/teams", icon: LayoutDashboard },
    { label: "Projects", path: "/admin/projects" , icon: LayoutDashboard },
    { label: "Resources", path: "/admin/resources" , icon: LayoutDashboard},
    { label: "All Requests", path: "/admin/requests", icon: LayoutDashboard },
    { label: "Reports", path: "/admin/reports", icon: LayoutDashboard },
    { label: "Audit Log", path: "/admin/audit-log" , icon: LayoutDashboard },
    { label: "Settings", path: "/admin/settings", icon: LayoutDashboard },
  ],
};

