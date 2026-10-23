import { NavLink } from "react-router-dom";
import { navigationConfig, type UserRole } from "../../config/navigation";
import { Icon } from "lucide-react";

// AppSidebar component definition
interface AppSidebarProps {
  role: UserRole;
}
// AppSidebar: display the corect links according to the logged-in user's role
function AppSidebar({ role }: AppSidebarProps) {
  const navigationItems = navigationConfig[role];

  return (
    <aside className="app-sidebar">
      <p className="sidebar-label">MAIN MENU</p>

      <nav aria-label="Main navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AppSidebar;
