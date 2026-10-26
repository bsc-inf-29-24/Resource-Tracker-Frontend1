import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import type { UserRole } from "../../config/navigation";
import AppHeader from "./AppHeader";

const USER_SESSION_KEY = "resourceTrackerUser";
interface CurrentUser {
  name: string;
  role: UserRole;
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "TEAM_LEAD" ||
    value === "LINE_MANAGER" ||
    value === "DEPARTMENT_MANAGER" ||
    value === "SYSTEM_ADMIN"
  );
}

function getCurrentUser(): CurrentUser | null {
  const storedUser = sessionStorage.getItem(USER_SESSION_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedUser);

    if (typeof parsed !== "object" || parsed === null) {
      sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    const user = parsed as Record<string, unknown>;

    if (
      typeof user.name !== "string" ||
      user.name.trim() === "" ||
      !isUserRole(user.role)
    ) {
      sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    return {
      name: user.name,
      role: user.role,
    };
  } catch {
    sessionStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

//Creating a Shared Layout for the Dashboard with Sidebar and Header also main content part

function DashboardLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    sessionStorage.removeItem(USER_SESSION_KEY);
    navigate("/login", { replace: true });
  }

  if (!user) {
    return navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-layout">
      <AppHeader userName={user.name} onLogout={handleLogout} />

      <div className="dashboard-body">
        <AppSidebar role={user.role} />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
