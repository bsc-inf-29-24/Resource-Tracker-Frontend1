export interface TeamLeadTeam {
  id: string;
  name: string;
  department: string;
}

export interface TeamLeadProject {
  id: string;
  name: string;
}

export const teamLeadTeams: TeamLeadTeam[] = [
  {
    id: "computer-science-software-development",
    name: "Software Development",
    department: "Computer Science",
  },
  {
    id: "computer-science-data-engineering",
    name: "Data Engineering",
    department: "Computer Science",
  },
  {
    id: "computer-science-research",
    name: "Research",
    department: "Computer Science",
  },
  {
    id: "data-science-ml-platform",
    name: "ML platform",
    department: "Data Science",
  },
  {
    id: "data-science-data-engineering",
    name: "Data Engineering",
    department: "Data Science",
  },
  {
    id: "data-science-analytics",
    name: "Analytics",
    department: "Data Science",
  },
  { id: "finance-accounts", name: "Accounts", department: "Finance" },
  {
    id: "finance-budget-planning",
    name: "Budget Planning",
    department: "Finance",
  },
  { id: "finance-procurement", name: "Procurement", department: "Finance" },
  { id: "hr-operations", name: "HR Operations", department: "HR" },
  { id: "hr-recruitment", name: "Recruitment", department: "HR" },
  {
    id: "hr-staff-development",
    name: "Staff Development",
    department: "HR",
  },
  {
    id: "information-systems-administration",
    name: "Systems Administration",
    department: "Information Systems",
  },
  {
    id: "information-systems-business-analysis",
    name: "Business Analysis",
    department: "Information Systems",
  },
  {
    id: "information-systems-support",
    name: "Support",
    department: "Information Systems",
  },
  { id: "it-infrastructure", name: "Infrastructure", department: "IT" },
  { id: "it-cybersecurity", name: "Cybersecurity", department: "IT" },
  { id: "it-support", name: "IT Support", department: "IT" },
];

export const teamLeadProjects: TeamLeadProject[] = [
  { id: "fraud-detection", name: "Fraud Detection" },
  { id: "resource-tracker-upgrade", name: "Resource Tracker Upgrade" },
  {
    id: "student-performance-analytics",
    name: "Student Performance Analytics",
  },
  {
    id: "campus-network-modernization",
    name: "Campus Network Modernization",
  },
  { id: "digital-library", name: "Digital Library" },
];

export const TEAM_LEAD_TEAM_STATUS_STORAGE_KEY =
  "resource-tracker.team-lead-team-status.v1";
