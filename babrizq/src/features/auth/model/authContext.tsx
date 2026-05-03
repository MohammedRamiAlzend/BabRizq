import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';

export interface MockUser {
  id: string;       // GUID (nameidentifier claim in JWT)
  name: string;
  nameAr: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Stable GUIDs per role — these serve as the "nameidentifier" claim in the simulated JWT
const ROLE_GUIDS: Record<UserRole, string> = {
  admin:        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  store_owner:  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  marketer:     'c3d4e5f6-a7b8-9012-cdef-123456789012',
  back_office:  'd4e5f6a7-b8c9-0123-defa-234567890123',
  delivery:     'e5f6a7b8-c9d0-1234-efab-345678901234',
  customer:     'f6a7b8c9-d0e1-2345-fabc-456789012345',
};

const MOCK_USERS: Record<UserRole, MockUser> = {
  admin:       { id: ROLE_GUIDS.admin,       name: 'System Admin',    nameAr: 'مدير النظام',       email: 'admin@babrizq.com',     role: 'admin' },
  store_owner: { id: ROLE_GUIDS.store_owner, name: 'Store Owner',     nameAr: 'صاحب المتجر',       email: 'store@babrizq.com',     role: 'store_owner' },
  marketer:    { id: ROLE_GUIDS.marketer,    name: 'Marketer',        nameAr: 'المسوّق',            email: 'marketer@babrizq.com',  role: 'marketer' },
  back_office: { id: ROLE_GUIDS.back_office, name: 'Back Office',     nameAr: 'المكتب الخلفي',     email: 'backoffice@babrizq.com', role: 'back_office' },
  delivery:    { id: ROLE_GUIDS.delivery,    name: 'Delivery Driver', nameAr: 'سائق التوصيل',      email: 'delivery@babrizq.com',  role: 'delivery' },
  customer:    { id: ROLE_GUIDS.customer,    name: 'Customer',        nameAr: 'العميل',             email: 'customer@babrizq.com',  role: 'customer' },
};

// ─── JWT Simulation ───────────────────────────────────────────────────────────
// Simulates a JWT token. The payload is a base64url-encoded JSON containing
// standard claims: `sub` / `nameidentifier` (user GUID), `role`, and `exp`.

function buildMockJwt(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    nameidentifier: user.id,        // GUID — the primary key claim
    sub: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 h
  }));
  const signature = btoa('mock-signature');             // not cryptographically valid
  return `${header}.${payload}.${signature}`;
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

// ─── Credential Validation ────────────────────────────────────────────────────
// Demo credentials: username "1", password "1" grants access to all roles.

export function validateCredentials(username: string, password: string): boolean {
  return username === '1' && password === '1';
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: MockUser | null;
  token: string | null;
  isAuthenticated: boolean;
  credentialsVerified: boolean;          // true once username/password step passes
  verifyCredentials: (username: string, password: string) => boolean;
  selectRole: (role: UserRole) => void;  // step 2 — pick a role after credentials
  logout: () => void;
  /** @deprecated Use selectRole() — kept for backward-compatibility only */
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
    const mockUser = MOCK_USERS[role];
    const jwt = buildMockJwt(mockUser);
    setToken(jwt);
    setUser(mockUser);

    // Optionally persist the token so the session survives page reloads.
    // In production this token would be validated server-side on every request.
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

  // Restore session on mount
  React.useEffect(() => {
    const storedToken = sessionStorage.getItem('babrizq_token');
    if (storedToken) {
      const payload = parseJwtPayload(storedToken);
      if (payload && payload.role) {
        const role = payload.role as UserRole;
        setUser(MOCK_USERS[role] ?? null);
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
      login: selectRole,  // backward-compat alias
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









