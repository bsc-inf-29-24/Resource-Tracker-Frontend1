import type { Role } from "./user";

export interface NavItem {
    id : string;
    label: string;
    path: string;
    icon?: string;
}

export type RoleNavigation = Record<Role, NavItem[]>;