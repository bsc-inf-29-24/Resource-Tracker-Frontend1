import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getRoleForPath, navigationConfig } from "../../config/navigation";
import {
  getFrontendRoleFromBackendRole,
  getDashboardPathForRole,
} from "../../data/auth-store";
import { useAuth } from "../../context/AuthContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import ToastViewport from "../feedback/ToastViewport";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isLoading, logout } = useAuth();
  const routeRole = getRoleForPath(pathname);
  const role = routeRole ?? getFrontendRoleFromBackendRole(user?.role);
  const showNavigation = role ? navigationConfig[role].length > 0 : false;
  const collapsibleNavigation = Boolean(role);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const closeMobileNavigation = useCallback(() => {
    setMobileNavigationOpen(false);
    if (collapsibleNavigation || window.innerWidth <= 700) {
      menuToggleRef.current?.focus();
    }
  }, [collapsibleNavigation]);

  useEffect(() => {
    closeMobileNavigation();
  }, [pathname, closeMobileNavigation]);

  useEffect(() => {
    if (!mobileNavigationOpen || collapsibleNavigation) return;
    function handleResize() {
      if (window.innerWidth > 700) closeMobileNavigation();
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileNavigationOpen, closeMobileNavigation, collapsibleNavigation]);

  if (isLoading) {
    return <p style={{ padding: 24 }}>Loading session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return (
    <div className={styles.layout}>
      <ToastViewport />
      <AppHeader
        role={role}
        mobileNavigationOpen={mobileNavigationOpen}
        showMobileNavigation={showNavigation}
        menuToggleRef={menuToggleRef}
        onToggleMobileNavigation={() =>
          setMobileNavigationOpen((current) => !current)
        }
        userName={user.fullName}
        email={user.email}
        onSignOut={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
      />
      <div className={styles.body}>
        <AppSidebar
          role={role}
          open={mobileNavigationOpen}
          collapsible={collapsibleNavigation}
          onClose={closeMobileNavigation}
        />
        <main className={styles.main} inert={mobileNavigationOpen}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
