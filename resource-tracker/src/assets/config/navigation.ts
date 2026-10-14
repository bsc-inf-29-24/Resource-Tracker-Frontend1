export type UserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "SYSTEM_ADMIN";

export interface NavigationItem {
  label: string;
  path: string;
}


export const navigationConfig: Record<UserRole, NavigationItem[]> = {
  TEAM_LEAD: [
    { label: "Dashboard", path: "/team-lead/dashboard" },
    { label: "New Request", path: "/team-lead/requests/new" },
    { label: "Request History", path: "/team-lead/requests" },
  ],

  LINE_MANAGER: [
    { label: "Dashboard", path: "/line-manager/dashboard" },
    { label: "Requests to Review", path: "/line-manager/review" },
    { label: "Decision History", path: "/line-manager/history" },
  ],

  DEPARTMENT_MANAGER: [
    { label: "Dashboard", path: "/department-manager/dashboard" },
    { label: "Department Requests", path: "/department-manager/requests" },
    { label: "Spending Reports", path: "/department-manager/reports" },
    { label: "Resource Allocation", path: "/department-manager/allocation" },
  ],

  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "User Management", path: "/admin/users" },
    { label: "Create User", path: "/admin/users/new" },
  ],
};

