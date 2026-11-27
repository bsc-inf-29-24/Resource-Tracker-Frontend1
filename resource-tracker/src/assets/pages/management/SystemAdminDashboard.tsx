import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
} from "lucide-react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../data/api-services";
import { getApiRecords, type ApiRecord } from "../../data/api-response";
import { getFrontendRoleFromBackendRole } from "../../data/auth-store";
import styles from "./SystemAdminDashboard.module.css";

type RegistrationMonth = {
  key: string;
  label: string;
  count: number;
};

type RoleSlice = {
  role: string;
  label: string;
  count: number;
  color: string;
};

const roleColors = ["#17734d", "#2373a8", "#d28a2f", "#b94b52", "#7663a8", "#348a83"];

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildRegistrationMonths(
  users: ApiRecord[],
  now: Date,
): RegistrationMonth[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
      count: 0,
    };
  });
  const counts = new Map(months.map((month) => [month.key, 0]));

  for (const user of users) {
    const value = user.createdAt ?? user.created_at;
    if (typeof value !== "string" && typeof value !== "number") continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return months.map((month) => ({ ...month, count: counts.get(month.key) ?? 0 }));
}

function displayRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export default function SystemAdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(getApiRecords(await usersApi.list()));
    } catch (requestError) {
      setUsers([]);
      setError(requestError instanceof Error ? requestError.message : "User totals could not be loaded.");
    } finally {
      setNow(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const registrationMonths = useMemo(
    () => buildRegistrationMonths(
      users.filter((record) => String(record.role ?? "").toUpperCase() !== "SYSTEM_ADMIN"),
      now,
    ),
    [users, now],
  );
  const registeredUserCount = users.filter(
    (record) => String(record.role ?? "").toUpperCase() !== "SYSTEM_ADMIN",
  ).length;
  const maxRegistrations = Math.max(1, ...registrationMonths.map(({ count }) => count));
  const registrationScale = Math.max(4, Math.ceil(maxRegistrations / 4) * 4);
  const registrationTicks = [registrationScale, registrationScale * 0.75, registrationScale * 0.5, registrationScale * 0.25, 0].map(Math.round);
  const roleDistribution = useMemo<RoleSlice[]>(() => {
    const counts = new Map<string, number>();
    for (const record of users) {
      const role = typeof record.role === "string" && record.role.trim()
        ? record.role.trim()
        : "UNKNOWN";
      if (role.toUpperCase() === "SYSTEM_ADMIN") continue;
      counts.set(role, (counts.get(role) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([role, count], index) => ({
      role,
      label: displayRole(role),
      count,
      color: roleColors[index % roleColors.length],
    }));
  }, [users]);
  const roleTotal = roleDistribution.reduce((total, slice) => total + slice.count, 0);
  let pieProgress = 0;
  const pieStops = roleDistribution.map((slice) => {
    const start = pieProgress;
    pieProgress += roleTotal ? (slice.count / roleTotal) * 100 : 0;
    return `${slice.color} ${start}% ${pieProgress}%`;
  });
  const pieBackground = roleTotal
    ? `conic-gradient(${pieStops.join(", ")})`
    : "conic-gradient(var(--rt-border) 0% 100%)";
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Administrator";
  const isSystemAdmin = getFrontendRoleFromBackendRole(user?.role) === "SYSTEM_ADMIN";
  const quickActions = isSystemAdmin
    ? [
        { label: "Create a user", detail: "Add an account to the system", href: "/system-admin/users/new", icon: UserPlus },
      ]
    : [];

  return (
    <section className={`rt-root ${styles.page}`}>
      <header className={styles.welcome}>
        <div>
          <h1>{greetingForHour(now.getHours())}, {firstName}</h1>
          <p className={styles.welcomeText}>Here is your system overview for today.</p>
        </div>
        <p className={styles.today}>
          {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now)}
        </p>
      </header>

      {error && <ErrorMessage title="Dashboard data incomplete" message={error} onRetry={() => void loadDashboard()} />}

      <div className={styles.visuals}>
        <section className={styles.chartPanel} aria-labelledby="roles-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="roles-title">Users by role</h2>
              <p>Current account distribution</p>
            </div>
            <span className={styles.chartTotal}>{loading ? "—" : roleTotal} users</span>
          </div>
          <div className={styles.pieLayout}>
            <div className={styles.pieChart} role="img" aria-label={`Users by role: ${roleDistribution.map((slice) => `${slice.label}, ${slice.count}`).join("; ") || "No user data"}`} style={{ background: pieBackground }}>
            </div>
            <ul className={styles.legend}>
              {roleDistribution.map((slice) => (
                <li key={slice.role}>
                  <span className={styles.legendDot} style={{ background: slice.color }} />
                  <span className={styles.legendLabel}>{slice.label}</span>
                  <strong>{slice.count} <small>{roleTotal ? Math.round((slice.count / roleTotal) * 100) : 0}%</small></strong>
                </li>
              ))}
              {!loading && roleDistribution.length === 0 && <li className={styles.noData}>No user records</li>}
            </ul>
          </div>
        </section>

        <section className={styles.chartPanel} aria-labelledby="registrations-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="registrations-title">User registrations</h2>
              <p>New accounts over the last six months</p>
            </div>
            <span className={styles.chartTotal}>{loading ? "—" : registeredUserCount} registered</span>
          </div>
          <div className={styles.chart} role="img" aria-label={`User registrations per month: ${registrationMonths.map((month) => `${month.label} ${month.count}`).join(", ")}`}>
            <div className={styles.yAxis} aria-hidden="true">
              {registrationTicks.map((tick, index) => <span key={`${tick}-${index}`}>{tick}</span>)}
            </div>
            <div className={styles.plot}>
              <div className={styles.gridLines} aria-hidden="true">
                {registrationTicks.map((tick, index) => <span key={`${tick}-${index}`} />)}
              </div>
              <div className={styles.bars}>
                {registrationMonths.map((month) => (
                  <div className={styles.barGroup} key={month.key}>
                    <span className={styles.barValue}>{loading ? "" : month.count}</span>
                    <div className={styles.barTrack}>
                      <span className={styles.bar} style={{ height: loading || month.count === 0 ? "0%" : `${(month.count / registrationScale) * 100}%` }} />
                    </div>
                    <span className={styles.monthLabel}>{month.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {quickActions.length > 0 && (
        <section className={styles.quickPanel} aria-labelledby="quick-actions-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="quick-actions-title">Admin tools</h2>
              <p>Common account and system tasks</p>
            </div>
          </div>
          <nav className={styles.quickActions} aria-label="Admin tools">
            {quickActions.map(({ label, detail, href, icon: Icon }) => (
              <Link className={styles.quickAction} to={href} key={href}>
                <span className={styles.quickIcon}><Icon aria-hidden="true" size={19} /></span>
                <span className={styles.quickCopy}>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </Link>
            ))}
          </nav>
        </section>
      )}
    </section>
  );
}
