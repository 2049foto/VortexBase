'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  api,
  setToken,
  setRefreshToken,
  clearToken,
  getRefreshToken,
  type User,
  type AuthTokens,
} from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (wallet: string, signature: string, message: string, fid?: number) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const tokens = await api.refresh(refreshToken);
          setToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          
          // Fetch user data
          const userData = await api.getUser();
          setUser(userData);
        }
      } catch {
        // Not authenticated
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (wallet: string, signature: string, message: string, fid?: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Verify signature and get tokens
        const tokens: AuthTokens = await api.verify(wallet, message, signature, fid);
        
        setToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);

        // Fetch user data
        const userData = await api.getUser();
        setUser(userData);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setError(null);
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logout();
        return false;
      }

      const tokens = await api.refresh(refreshToken);
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        refresh,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
