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
}

//Defining the the links displayed for each role.
export const navigationConfig: Record<UserRole, NavigationItem[]> = {
 // Navigation items for each user role: TEAM_LEAD
  TEAM_LEAD: [
    { label: "Dashboard", path: "/team-lead/dashboard" },
    { label: "New Request", path: "/team-lead/requests/new" },
    { label: "Request History", path: "/team-lead/requests" },
    { label: "My Project Team", path: "/team-lead/project-team" },

    
  ],
// Navigation items for each user role: LINE_MANAGER
  LINE_MANAGER: [
    { label: "Dashboard", path: "/line-manager/dashboard" },
    { label: "Requests to Review", path: "/line-manager/review" },
    { label: "Decision History", path: "/line-manager/history" },
  ],
// Navigation items for each user role: DEPARTMENT_MANAGER
  DEPARTMENT_MANAGER: [
    { label: "Dashboard", path: "/department-manager/dashboard" },
    { label: "Department Requests", path: "/department-manager/requests" },
    { label: "Spending Reports", path: "/department-manager/reports" },
    { label: "Resource Allocation", path: "/department-manager/allocation" },
  ],
// Navigation items for each user role: SYSTEM_ADMIN
  SYSTEM_ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "User Management", path: "/admin/users" },
    { label: "Create User", path: "/admin/users/new" },
  ],
};

