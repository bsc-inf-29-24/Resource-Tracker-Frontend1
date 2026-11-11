import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentDemoUser,
  restoreAuthenticatedSession,
  signInDemoUser,
  signOutDemoUser,
  type AuthenticatedUser,
} from "../data/auth-store";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthenticatedUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => getCurrentDemoUser() ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setSessionError("Your session expired. Sign in again.");
      setIsLoading(false);
    }
    window.addEventListener(
      "resource-tracker:session-expired",
      handleSessionExpired,
    );
    return () =>
      window.removeEventListener(
        "resource-tracker:session-expired",
        handleSessionExpired,
      );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const sessionUser = await restoreAuthenticatedSession();
        if (!cancelled) {
          setUser(sessionUser);
          setSessionError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setUser(null);
          setSessionError(
            error instanceof Error
              ? error.message
              : "The saved session could not be restored.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const authenticatedUser = await signInDemoUser(email, password);
    setUser(authenticatedUser);
    setSessionError(null);
    setIsLoading(false);
    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await signOutDemoUser();
    } finally {
      setUser(null);
      setSessionError(null);
    }
  };

  const refreshSession = async () => {
    const authenticatedUser = await restoreAuthenticatedSession();
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      sessionError,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
