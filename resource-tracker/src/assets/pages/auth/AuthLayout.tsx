
import type { ReactNode } from "react";
//This lets three pages (Login, Register and Forgot Password) share the same layout and styling, 
// while still allowing each page to have its own unique content.

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    //Main content of the page, divided into two sections: the brand panel and the form panel. The brand panel contains the application logo, subtitle, description, and benefits. 
    // The form panel contains the authentication form passed as children.
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div>
          <p className="auth-brand">RT</p>
          <p className="auth-brand-subtitle">
            Real-time Resource Tracking System
          </p>
          <p className="auth-brand-description">
            Manage resource requests, review decisions and track
            resource allocation in one place.
          </p>

          <div className="auth-benefits">
            <span>Safe</span>
            <span>Trusted</span>
            <span>Efficient</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}

export default AuthLayout;
