export type UserRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "SYSTEM_ADMIN";

export interface NavigationItem {
  label: string;
  path: string;
}
