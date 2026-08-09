/**
 * Auth feature — Marketer application (single-role).
 *
 * Talks to the real Bab Rizq backend:
 *   POST /auth/login (email + password) → { accessToken, refreshToken }
 *   GET  /auth/me    (Bearer)            → user profile
 *
 * The access token (a JWT whose payload carries `sub`, `role`, `nameEn`,
 * `nameAr`, `email`, `status`) is persisted in sessionStorage via the shared
 * API client (`@/shared/lib/api`) and sent on every request. The session
 * survives reloads by re-hydrating the user from the stored token.
 *
 * The legacy mock members (`verifyCredentials`, `selectRole`, `login`,
 * `validateCredentials`) are kept exported for backward compatibility but are
 * deprecated — new code must use `loginWithPassword`.
 */
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  clearSession,
  fetchCurrentUser,
  loginWithPassword as apiLogin,
  setSession,
} from '@/shared/lib/api';

/** Union of every platform role — kept for type compatibility with shared UI. */
export type UserRole = 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';

/** Shape of the authenticated user (maps from the backend profile / JWT claims). */
export interface MockUser {
  id: string; // GUID — the "sub" / "nameidentifier" claim
  name: string;
  nameAr: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/** The single role this application serves. */
const APP_ROLE: UserRole = 'marketer';

/**
 * Demo user for the marketer role — kept only for the deprecated
 * `selectRole` shim. Real sessions come from the backend.
 */
const MOCK_USER: MockUser = {
  id: 'e5f6a7b8-c9d0-1e2f-3a4b-56789abcdef0',
  name: 'Marketer',
  nameAr: 'مسوّق',
  email: 'marketer@babrizq.com',
  role: 'marketer',
};

/**
 * @deprecated Legacy demo check (username "1" / password "1"). The real auth
 * flow uses `loginWithPassword` against the backend.
 */
export function validateCredentials(username: string, password: string): boolean {
  return username === '1' && password === '1';
}

/** @deprecated Mock-JWT builder — kept only for the `selectRole` shim. */
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

/** Decodes a JWT payload without verifying the signature (client-side display only). */
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
  /**
   * Real login: POST /auth/login then hydrate the session. Resolves `true`
   * on success, `false` on invalid credentials or network failure.
   */
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  /** @deprecated Legacy sync check — use `loginWithPassword`. */
  verifyCredentials: (username: string, password: string) => boolean;
  /** @deprecated Mock-role login — real auth is server-side now. */
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

  /** Hydrates the session from a (real) access token by decoding its claims. */
  const applyToken = useCallback((accessToken: string, role: UserRole): boolean => {
    const payload = parseJwtPayload(accessToken);
    if (!payload || payload.role !== role) return false;
    const id = (payload.nameidentifier as string) ?? (payload.sub as string) ?? '';
    setUser({
      id,
      name: (payload.name as string) ?? (payload.nameEn as string) ?? '',
      nameAr: (payload.nameAr as string) ?? '',
      email: (payload.email as string) ?? '',
      role: payload.role as UserRole,
    });
    setToken(accessToken);
    setCredentialsVerified(true);
    return true;
  }, []);

  const loginWithPassword = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const tokens = await apiLogin(email, password);
        setSession(tokens, APP_ROLE);
        if (!applyToken(tokens.accessToken, APP_ROLE)) return false;

        // Enrich with the freshest profile (silent — never fails the login).
        void fetchCurrentUser()
          .then(profile =>
            setUser(prev =>
              prev
                ? {
                    ...prev,
                    name: profile.nameEn,
                    nameAr: profile.nameAr,
                    email: profile.email,
                  }
                : prev
            )
          )
          .catch(() => undefined);
        return true;
      } catch {
        setCredentialsVerified(false);
        return false;
      }
    },
    [applyToken]
  );

  /** @deprecated Legacy mock login — kept so no consumer breaks. */
  const selectRole = (role: UserRole) => {
    if (role !== APP_ROLE) return; // this app only serves its own role
    console.warn('[auth] selectRole is deprecated — use loginWithPassword(email, password).');
    const jwt = buildMockJwt(MOCK_USER);
    setSession({ accessToken: jwt, refreshToken: '' }, role);
    applyToken(jwt, role);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
    setCredentialsVerified(false);
  };

  // Restore the session on mount from the persisted token.
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('babrizq_token');
      if (storedToken) applyToken(storedToken, APP_ROLE);
    } catch {
      // Non-browser environment — nothing to restore.
    }
  }, [applyToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        credentialsVerified,
        loginWithPassword,
        verifyCredentials: validateCredentials,
        selectRole,
        logout,
        login: selectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
