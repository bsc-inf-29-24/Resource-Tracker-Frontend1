
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
    name: "Hezekiah Tokoma",
    email: "teamlead@gmail.com",
    password: "Password1234",
    role: "TEAM_LEAD",
  },
  {
    id: 2,
    name: "Wanangwa Nyirenda",
    email: "linemanager@gmail.com",
    password: "Password1234",
    role: "LINE_MANAGER",
  },
  {
    id: 3,
    name: "Grace Chima",
    email: "deptmanager@gmail.com",
    password: "Password1234",
    role: "DEPARTMENT_MANAGER",
  },
  {
    id: 4,
    name: "Benjamin Kanyemba",
    email: "admin@gmail.com",
    password: "Password1234",
    role: "SYSTEM_ADMIN",
  },

];
