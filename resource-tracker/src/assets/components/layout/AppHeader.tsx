import { useState } from "react";
import { UserRound, CircleUserRound } from "lucide-react";
//AppHeader component
interface AppHeaderProps {
  userName: string;
  onLogout: () => void;
}

// AppHeader component definition
function AppHeader({ userName, onLogout }: AppHeaderProps) {
  // State to manage the menu open/close status
  const [menuOpen, setMenuOpen] = useState(false);

  // Function to toggle the menu open/close status
  return (
    // Resource Tracker Application Brand, Profile Section and Logout Button
    <header className="app-header">
      <div className="app-brand">
        <span className="brand-icon">RT </span>
        <span className = "brand-name">Resource Tracker</span>
      </div>

      <div className="profile-section">
        <button
          className="profile-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
        >
       
          <span aria-hidden="true"><UserRound size={20} strokeWidth={2} aria-hidden = "true"/></span>
          <span>{userName}</span>
          
        </button>

        {menuOpen && (
          <div className="profile-menu">
            <span className="Remark">Thank you, for using RT</span>
            <button onClick={onLogout}>Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
