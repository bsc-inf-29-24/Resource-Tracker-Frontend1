import { ResourceRequest } from "../types/resource-request";
import { user } from "../types/user";

export const mockUsers: user[] = [
    {id: "u1", name: "Chikondi Banda", email: "chikondi@gmail.com",  password: "password", role: "TEAM_LEAD", department: "Data Science", team: "ML platform", isActive: true},
    {id: "u2", name: "Tamandani Longwe", email: "tamandani@gmail.com",password: "password", role: "LINE_MANAGER", department: "Data Science", isActive: true},
    {id: "u3", name: "Grace Phiri", email: "grace@gmail.com",password: "password", role: "DEPARTMENT_MANAGER", department: "Data Science", isActive: true},
    {id: "u4", name: "Admin User", email: "admin@gmail.com",password: "password", role: "SYSTEM_ADMIN", department: "IT", isActive: true},
];

export const mockRequests: ResourceRequest[] = [
    {
        id: "REQ-001",
        itemDescription: "GPU workstation",
        manufacturer: "DELL",
        quantity: 2,
        estimatedPrice: 4500000,
        department: "Data Science",
        project: "Fraud Detection",
        team: "ML platform",
        summary: "Needed to train larger models faster.",
        status: "Pending",
        submittedAt: "2026-10-15T09:00:00Z",
        requestedById: "u1",
        comments: [],
        history:  [
            
              {  status: "Submitted", changedAt: "2026-10-15T09:00:00Z", changedBy: "u1" },
               {status: "Pending", changedAt: "2026-10-15T09:01:00Z", changedBy: "system"}, 
            
        ],
    },
] ;    

