export const mockUsers = [
  { id: "1", name: "John Banda", email: "john@mubas.ac.mw", role: "DEPARTMENT_MANAGER", department: "IT", status: "Active", createdAt: "2024-01-10" },
  { id: "2", name: "Sarah Phiri", email: "sarah@mubas.ac.mw", role: "LINE_MANAGER", department: "HR", status: "Active", createdAt: "2024-02-15" },
  { id: "3", name: "Peter Mwale", email: "peter@mubas.ac.mw", role: "TEAM_LEAD", department: "Computer Science", status: "Active", createdAt: "2024-03-20" },
  { id: "4", name: "Mary Nkhoma", email: "mary@mubas.ac.mw", role: "TEAM_LEAD", department: "Information Systems", status: "Inactive", createdAt: "2024-01-22" },
  { id: "5", name: "Admin User", email: "admin@tracker.com", role: "SYSTEM_ADMIN", department: "IT", status: "Active", createdAt: "2023-12-01" },
  { id: "6", name: "Grace Tembo", email: "grace@mubas.ac.mw", role: "LINE_MANAGER", department: "Finance", status: "Inactive", createdAt: "2024-04-05" },
];

// For Task 3 - Department Information
export const mockDepartments = [
  { id: "1", name: "Computer Science", code: "CS", manager: "Dr. Phiri", totalUsers: 2, activeResources: 45, status: "Active" },
  { id: "2", name: "Information Systems", code: "IS", manager: "Prof. Banda", totalUsers: 1, activeResources: 32, status: "Active" },
  { id: "3", name: "IT", code: "IT", manager: "Mr. Mwale", totalUsers: 2, activeResources: 67, status: "Active" },
  { id: "4", name: "HR", code: "HR", manager: "Mrs. Phiri", totalUsers: 1, activeResources: 12, status: "Active" },
  { id: "5", name: "Finance", code: "FIN", manager: "Mr. Tembo", totalUsers: 1, activeResources: 23, status: "Active" },
];