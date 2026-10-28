import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getRoleForPath, navigationConfig } from "../../config/navigation";
import { getCurrentDemoUser, signOutDemoUser } from "../../data/auth-store";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = getRoleForPath(pathname);
  const currentUser = getCurrentDemoUser();
  const showNavigation = role ? navigationConfig[role].length > 0 : false;
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const closeMobileNavigation = useCallback(() => {
    setMobileNavigationOpen(false);
    if (window.innerWidth <= 700) menuToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    closeMobileNavigation();
  }, [pathname, closeMobileNavigation]);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    function handleResize() {
      if (window.innerWidth > 700) closeMobileNavigation();
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileNavigationOpen, closeMobileNavigation]);

  if (!role) return <Navigate to="/login" replace />;

  return (
    <div className={styles.layout}>
      <AppHeader
        role={role}
        mobileNavigationOpen={mobileNavigationOpen}
        showMobileNavigation={showNavigation}
        menuToggleRef={menuToggleRef}
        onToggleMobileNavigation={() =>
          setMobileNavigationOpen((current) => !current)
        }
        userName={currentUser?.name}
        onSignOut={() => {
          signOutDemoUser();
          navigate("/login", { replace: true });
        }}
      />
      <div className={styles.body}>
        <AppSidebar
          role={role}
          open={mobileNavigationOpen}
          onClose={closeMobileNavigation}
        />
        <main className={styles.main} inert={mobileNavigationOpen}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
