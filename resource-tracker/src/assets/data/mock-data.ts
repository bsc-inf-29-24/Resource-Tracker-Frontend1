
export type DemoRole =
  | "TEAM_LEAD"
  | "LINE_MANAGER"
  | "DEPARTMENT_MANAGER"
  | "SYSTEM_ADMIN";

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
}

export const mockUsers: DemoUser[] = [
  {
    id: 1,
    name: "Team Lead",
    email: "teamlead@resourcetracker.test",
    password: "Demo1234!",
    role: "TEAM_LEAD",
  },
  {
    id: 2,
    name: "Line Manager",
    email: "linemanager@resourcetracker.test",
    password: "Demo1234!",
    role: "LINE_MANAGER",
  },
  {
    id: 3,
    name: "Department Manager",
    email: "deptmanager@resourcetracker.test",
    password: "Demo1234!",
    role: "DEPARTMENT_MANAGER",
  },
  {
    id: 4,
    name: "System Admin",
    email: "admin@resourcetracker.test",
    password: "Demo1234!",
    role: "SYSTEM_ADMIN",
  },
];
