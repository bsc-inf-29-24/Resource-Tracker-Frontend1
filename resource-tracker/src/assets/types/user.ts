export type Role = 
        "team-lead"|
        "line-manager"|
        "department-manager"|
        "system-admin";

export type AccountStatus = "Active" | "Inactive";

export interface user {
    id: string;
    name: string;
    email: string;
    role: Role;
    department: string;
    team?: string;
    isActive?: boolean;
    status?: AccountStatus;
    createdAt?: string;
}

export type UserAccount = user & {
    isActive: boolean;
    status: AccountStatus;
};