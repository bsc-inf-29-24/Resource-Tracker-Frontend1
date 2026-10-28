import { Link, useLocation } from "react-router-dom";
import type { RefObject } from "react";
import {
  navigationConfig,
  roleDisplayNames,
  type UserRole,
} from "../../config/navigation";
import UserProfileMenu from "./UserProfileMenu";
import styles from "./AppHeader.module.css";

import { useState } from "react";
import { UserRound, CircleUserRound } from "lucide-react";

//AppHeader component
interface AppHeaderProps {
  userName?: string | null;
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
          DEPARTMENT_MANAGER: "/department-manager/dashboard",
          SYSTEM_ADMIN: "/system-admin/dashboard",
        }[role]
    : "/login";
}

export default function AppHeader({
  userName,
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
          <span aria-hidden="true">{mobileNavigationOpen ? "×" : "☰"}</span>
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
        <span>Resource Tracker</span>
      </Link>
      <span className={styles.pageContext} aria-current="page">
        {getPageContext(pathname, role)}
      </span>
      <UserProfileMenu
        userName={userName}
        roleLabel={role ? roleDisplayNames[role] : undefined}
        inert={mobileNavigationOpen}
        onSignOut={onSignOut}
      />
    </header>
  );
}
