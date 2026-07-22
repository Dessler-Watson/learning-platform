'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { User, LoginCredentials } from '@/types';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = authService.getUser();
      if (storedUser && authService.isAuthenticated()) {
        return storedUser;
      }
    }
    return null;
  });
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      authService.setAuthData(response);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
