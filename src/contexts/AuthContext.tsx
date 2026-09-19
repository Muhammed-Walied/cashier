import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session
    const saved = localStorage.getItem('casher_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('casher_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      if (!window.electronAPI) {
        // Fallback for browser preview if testing without electron
        const mockAdmin: User = {
          id: 1,
          username: 'admin',
          display_name: 'المدير العام',
          role: 'admin',
          is_active: 1,
          created_at: new Date().toISOString(),
        };
        setUser(mockAdmin);
        localStorage.setItem('casher_user', JSON.stringify(mockAdmin));
        return { success: true };
      }

      const res = await window.electronAPI.login({ username, password });
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('casher_user', JSON.stringify(res.data));
        return { success: true };
      } else {
        return { success: false, error: res.error || 'خطأ في تسجيل الدخول' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('casher_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
