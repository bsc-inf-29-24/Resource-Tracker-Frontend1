import { useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Package,
  UsersRound,
} from "lucide-react";
import { navigationConfig, type UserRole } from "../../config/navigation";
import styles from "./AppSidebar.module.css";

function navigationIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("dashboard")) return LayoutDashboard;
  if (normalized.includes("notification")) return Bell;
  if (normalized.includes("team")) return UsersRound;
  if (normalized.includes("project")) return FolderKanban;
  if (normalized.includes("resource") || normalized.includes("allocation")) return Package;
  if (normalized.includes("report") || normalized.includes("spending")) return BarChart3;
  if (normalized.includes("audit")) return FileText;
  return ClipboardList;
}

interface AppSidebarProps {
  role: UserRole | null;
  open: boolean;
  collapsible?: boolean;
  onClose: () => void;
}

export default function AppSidebar({
  role,
  open,
  collapsible = false,
  onClose,
}: AppSidebarProps) {
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
        sidebarRef.current.querySelectorAll<HTMLAnchorElement>("a"),
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
        className={`${styles.sidebar} ${
          collapsible
            ? `${styles.drawer} ${
                open ? styles.drawerOpen : ""
              }`
            : open
              ? styles.sidebarOpen
              : ""
        }`}
        {...(open
          ? {
              role: "dialog",
              "aria-modal": true,
              "aria-label": "Main navigation",
            }
          : {})}
      >
        <div className={styles.brand} aria-label="Resource Tracker">
          <span className={styles.brandMark} aria-hidden="true">RT</span>
          <span className={styles.brandName}>Resource<br />Tracker</span>
        </div>
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
              isExact || (isNested && !item.path.endsWith("/dashboard"));
            const Icon = item.icon ?? navigationIcon(item.label);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={onClose}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <footer className={styles.footer}>
          <p className={styles.footerText}>Smarter resources<br />Better decisions.</p>
          <div className={styles.footerWaves} aria-hidden="true" />
        </footer>
      </aside>
    </>
  );
}
