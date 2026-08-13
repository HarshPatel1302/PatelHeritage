'use client';

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  lastError: string | null;
  /** True when the server signed us in automatically because demo mode is on. */
  demoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Server user -> the shape the existing pages already read (lowercase role, `flat`). */
interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  flatId: string | null;
  mustChangePassword: boolean;
}

function toLegacyUser(u: ServerUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    flat: u.flatId ?? '',
    role: u.role.toLowerCase() as User['role'],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  // The session is an httpOnly cookie, so the client cannot read it directly —
  // it asks the server who it is. This also means a deactivated account loses
  // access on the next check rather than lingering in localStorage forever.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        setMustChangePassword(false);
        return;
      }
      const data = await res.json();
      setDemoMode(Boolean(data.demoMode));
      if (data.user) {
        setUser(toLegacyUser(data.user));
        setMustChangePassword(Boolean(data.user.mustChangePassword));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setLastError(null);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setLastError(data.error ?? 'Login failed.');
          return false;
        }
        await refresh();
        return true;
      } catch {
        setLastError('Cannot reach the server.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setMustChangePassword(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refresh,
        isLoading,
        isAuthenticated: !!user,
        mustChangePassword,
        lastError,
        demoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
