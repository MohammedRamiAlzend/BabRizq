/**
 * Auth feature — Platform Admin application (single-role).
 *
 * Simulates `POST /api/auth/login` with demo credentials (username "1" / password "1")
 * and issues a mock JWT (payload mirrors the real contract: `nameidentifier` = user GUID,
 * `role`, `name`, `email`, `exp`). The session survives reloads via sessionStorage.
 *
 * TODO(migration): replace `verifyCredentials`/`selectRole` with a real call to
 * `POST /api/auth/login` and validate the returned JWT server-side on every request.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

/** Union of every platform role — kept for type compatibility with shared UI. */
export type UserRole = 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';

/** Shape of the authenticated user (matches the JWT payload of the real API). */
export interface MockUser {
  id: string; // GUID — the "nameidentifier" claim
  name: string;
  nameAr: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/** The single role this application serves. */
const APP_ROLE: UserRole = 'admin';

/** Demo user for the admin role. */
const MOCK_USER: MockUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'System Admin',
  nameAr: 'مدير النظام',
  email: 'admin@babrizq.com',
  role: 'admin',
};

/** Demo credentials — same as the legacy app. */
export function validateCredentials(username: string, password: string): boolean {
  return username === '1' && password === '1';
}

/** Builds a mock JWT (base64url header + payload + fake signature). */
function buildMockJwt(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    nameidentifier: user.id,
    sub: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8h
  }));
  return `${header}.${payload}.${btoa('mock-signature')}`;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: MockUser | null;
  token: string | null;
  isAuthenticated: boolean;
  credentialsVerified: boolean;
  verifyCredentials: (username: string, password: string) => boolean;
  /** Logs in the app's single role. Any other role is ignored. */
  selectRole: (role: UserRole) => void;
  logout: () => void;
  /** @deprecated alias of selectRole — kept for compatibility. */
  login: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  const verifyCredentials = (username: string, password: string): boolean => {
    const ok = validateCredentials(username, password);
    if (ok) setCredentialsVerified(true);
    return ok;
  };

  const selectRole = (role: UserRole) => {
    if (role !== APP_ROLE) return; // this app only serves its own role
    const jwt = buildMockJwt(MOCK_USER);
    setToken(jwt);
    setUser(MOCK_USER);
    sessionStorage.setItem('babrizq_token', jwt);
    sessionStorage.setItem('babrizq_role', role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCredentialsVerified(false);
    sessionStorage.removeItem('babrizq_token');
    sessionStorage.removeItem('babrizq_role');
  };

  // Restore the session on mount.
  React.useEffect(() => {
    const storedToken = sessionStorage.getItem('babrizq_token');
    if (storedToken) {
      const payload = parseJwtPayload(storedToken);
      if (payload && payload.role === APP_ROLE) {
        setUser(MOCK_USER);
        setToken(storedToken);
        setCredentialsVerified(true);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      credentialsVerified,
      verifyCredentials,
      selectRole,
      logout,
      login: selectRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
