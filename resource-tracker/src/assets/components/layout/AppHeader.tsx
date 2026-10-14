import { useState } from "react";
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
        <span className="brand-icon">RT</span>
        <span>Resource Tracker</span>
      </div>

      <div className="profile-section">
        <button
          className="profile-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
        >
          <span className="avatar">{userName.charAt(0).toUpperCase()}</span>

          <span>{userName}</span>
          <span aria-hidden="true">▾</span>
        </button>

        {menuOpen && (
          <div className="profile-menu">
            <button onClick={() => setMenuOpen(false)}>Logout</button>
            <button onClick={onLogout}>Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
