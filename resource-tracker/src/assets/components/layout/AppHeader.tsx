import { Link, useLocation } from "react-router-dom";
import type { RefObject } from "react";
import { Bell } from "lucide-react";
import {
  navigationConfig,
  roleDisplayNames,
  type UserRole,
} from "../../config/navigation";
import UserProfileMenu from "./UserProfileMenu";
import styles from "./AppHeader.module.css";

//AppHeader component
interface AppHeaderProps {
  userName?: string | null;
  email?: string | null;
  role?: UserRole | null;
  mobileNavigationOpen: boolean;
  showMobileNavigation: boolean;
  onToggleMobileNavigation: () => void;
  menuToggleRef: RefObject<HTMLButtonElement | null>;
  onSignOut: () => void;
}

function getPageContext(pathname: string, role: UserRole | null | undefined) {
  if (!role) return "";
  const items = navigationConfig[role];
  const item = [...items]
    .sort((left, right) => right.path.length - left.path.length)
    .find(
      ({ path }) =>
        pathname === path ||
        (pathname.startsWith(`${path}/`) &&
          !(role === "SYSTEM_ADMIN" &&
            path === "/system-admin/users" &&
            pathname.startsWith("/system-admin/users/new")))
    );
  return item?.label ?? roleDisplayNames[role];
}

function getDashboardPath(role: UserRole | null | undefined) {
  return role
    ? navigationConfig[role].find((item) => item.label === "Dashboard")?.path ??
        {
          TEAM_LEAD: "/team-lead/dashboard",
          LINE_MANAGER: "/line-manager/dashboard",
          DEPARTMENT_MANAGER: "/department-manager/requests",
          MANAGING_DIRECTOR: "/managing-director/dashboard",
          SYSTEM_ADMIN: "/system-admin/dashboard",
          TEAM_MEMBER: "/team-member/dashboard",
        }[role]
    : "/login";
}

export default function AppHeader({
  userName,
  email,
  role,
  mobileNavigationOpen,
  showMobileNavigation,
  onToggleMobileNavigation,
  menuToggleRef,
  onSignOut,
}: AppHeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      {showMobileNavigation && (
        <button
          ref={menuToggleRef}
          type="button"
          className={styles.menuToggle}
          aria-label={mobileNavigationOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileNavigationOpen}
          aria-controls="application-sidebar"
          onClick={onToggleMobileNavigation}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileNavigationOpen ? (
              <path d="m18 6-12 12M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}
      <Link
        className={styles.brand}
        to={getDashboardPath(role)}
        aria-label="Resource Tracker dashboard"
        inert={mobileNavigationOpen}
      >
        <span className={styles.brandMark} aria-hidden="true">
          RT
        </span>
        <span className={styles.brandText}>Resource Tracker</span>
        {role === "TEAM_LEAD" && <span className={styles.workspaceLabel}>Team Lead</span>}
        {role === "MANAGING_DIRECTOR" && <span className={styles.workspaceLabel}>Managing Director</span>}
        {role === "LINE_MANAGER" && <span className={styles.workspaceLabel}>Line Manager</span>}
        {role === "DEPARTMENT_MANAGER" && <span className={styles.workspaceLabel}>Department Head</span>}
      </Link>
      {/* <span className={styles.pageContext} aria-current="page">
        {getPageContext(pathname, role)}
      </span> */}
      <Link
        className={styles.notificationsLink}
        to="/notifications"
        aria-label="Notifications"
        aria-current={pathname === "/notifications" ? "page" : undefined}
        title="Notifications"
        inert={mobileNavigationOpen}
      >
        <Bell aria-hidden="true" size={20} strokeWidth={1.8} />
      </Link>
      <UserProfileMenu
        userName={userName}
        email={email}
        roleLabel={role ? roleDisplayNames[role] : undefined}
        inert={mobileNavigationOpen}
        onSignOut={onSignOut}
      />
    </header>
  );
}
