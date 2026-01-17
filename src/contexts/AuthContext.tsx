import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthKey } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie helpers
const setCookie = (name: string, value: string, expiresAt: Date) => {
  const expires = expiresAt.toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure`;
};

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const AUTH_TOKEN_COOKIE = 'auth_token';
const AUTH_EXPIRY_COOKIE = 'auth_expiry';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing token in cookies
    const savedToken = getCookie(AUTH_TOKEN_COOKIE);
    const savedExpiry = getCookie(AUTH_EXPIRY_COOKIE);
    
    if (savedToken && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      if (expiryDate > new Date()) {
        setToken(savedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired, clear it
        deleteCookie(AUTH_TOKEN_COOKIE);
        deleteCookie(AUTH_EXPIRY_COOKIE);
      }
    }
  }, []);

  const login = async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await useAuthKey(key);
      const expiryDate = new Date(response.expiresAt);
      
      setCookie(AUTH_TOKEN_COOKIE, response.token, expiryDate);
      setCookie(AUTH_EXPIRY_COOKIE, response.expiresAt, expiryDate);
      
      setToken(response.token);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  };

  const logout = () => {
    deleteCookie(AUTH_TOKEN_COOKIE);
    deleteCookie(AUTH_EXPIRY_COOKIE);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export cookie getter for API service
export const getAuthTokenFromCookie = (): string | null => {
  return getCookie(AUTH_TOKEN_COOKIE);
};
