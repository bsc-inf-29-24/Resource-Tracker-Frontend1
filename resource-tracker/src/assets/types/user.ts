export type Role = 
        "TEAM_LEAD"|
        "LINE_MANAGER"|
        "DEPARTMENT_MANAGER"|
        "SYSTEM_ADMIN";


export interface user {
    id: string;
    name: string;
    email: string;
     password: string;
    role: Role;
    department: string;
    team?: string;
    isActive: boolean; 
}