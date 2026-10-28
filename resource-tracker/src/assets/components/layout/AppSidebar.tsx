import { useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { navigationConfig, type UserRole } from "../../config/navigation";
import styles from "./AppSidebar.module.css";

interface AppSidebarProps {
  role: UserRole | null;
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ role, open, onClose }: AppSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (!open || !role) return;

    const firstLink = sidebarRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sidebarRef.current) return;

      const links = Array.from(
        sidebarRef.current.querySelectorAll<HTMLAnchorElement>("a")
      );
      if (links.length === 0) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, role]);

  if (!role) return null;
  const navigationItems = navigationConfig[role];
  if (navigationItems.length === 0) return null;

  return (
    <>
      {open && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation menu"
          tabIndex={-1}
          onClick={onClose}
        />
      )}
      <aside
        id="application-sidebar"
        ref={sidebarRef}
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
        {...(open
          ? {
              role: "dialog",
              "aria-modal": true,
              "aria-label": "Main navigation",
            }
          : {})}
      >
        <p className={styles.label}>MAIN MENU</p>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigationItems.map((item) => {
            const isExact = pathname === item.path;
            const isNested =
              pathname.startsWith(`${item.path}/`) &&
              !(
                role === "SYSTEM_ADMIN" &&
                item.path === "/system-admin/users" &&
                pathname.startsWith("/system-admin/users/new")
              ) &&
              !(
                role === "TEAM_LEAD" &&
                item.path === "/team-lead/requests" &&
                pathname.startsWith("/team-lead/requests/new")
              );
            const isActive =
              isExact ||
              (isNested && !item.path.endsWith("/dashboard"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={onClose}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
