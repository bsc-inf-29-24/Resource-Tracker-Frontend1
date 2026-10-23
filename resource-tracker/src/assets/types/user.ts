export type Role = 
        "team-lead"|
        "line-manager"|
        "department-manager"|
        "system-admin";


export interface user {
    id: string;
    name: string;
    email: string;
    role: Role;
    department: string;
    team?: string;
    isActive: boolean; 
}