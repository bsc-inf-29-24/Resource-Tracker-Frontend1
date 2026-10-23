import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import type { UserRole } from "../../config/navigation";
import AppHeader from "./AppHeader";

//Creating a Shared Layout for the Dashboard with Sidebar and Header also main content part
function DashboardLayout() {
  const navigate = useNavigate();

  //Temporary User details for the interface
  const [userName] = useState("Hezekiah Tokoma");
  //Allow the sidebar to changr according to user role
  const [userRole] = useState<UserRole>("TEAM_LEAD");

  function handleLogout() {
    // Temporary Logout behaviour
    navigate("/login");
  }
  //
  return (
    <div className="dashboard-layout">
      <AppHeader userName={userName} onLogout={handleLogout} />

      <div className="dashboard-body">
        <AppSidebar role={userRole} />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
