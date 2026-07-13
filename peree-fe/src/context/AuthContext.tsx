import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';


interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}


const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'auth_token';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
  }, []);

  const value: AuthContextValue = {
    token,
    isAuthenticated: !!token,
    setToken,
    logout,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}


export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
