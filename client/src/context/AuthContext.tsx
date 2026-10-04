import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/auth.service';
type AuthState = { user: User | null; loading: boolean; login: (identifier: string, password: string, remember?: boolean) => Promise<void>; logout: () => Promise<void>; updateProfile: (data: Pick<User, 'fullName' | 'phone' | 'avatar'>) => Promise<void>; };
const AuthContext = createContext<AuthState>({ user: null, loading: true, login: async () => undefined, logout: async () => undefined, updateProfile: async () => undefined });
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const token = localStorage.getItem('huru_access_token'); if (!token) { setLoading(false); return; } authService.me().then((r) => setUser(r.data.data)).catch(() => localStorage.removeItem('huru_access_token')).finally(() => setLoading(false)); }, []);
  const login = async (identifier: string, password: string, remember = false) => { const r = await authService.login({ identifier, password, remember }); localStorage.setItem('huru_access_token', r.data.data.accessToken); setUser(r.data.data.user); };
  const logout = async () => { try { await authService.logout(); } finally { localStorage.removeItem('huru_access_token'); setUser(null); } };
  const updateProfile = async (data: Pick<User, 'fullName' | 'phone' | 'avatar'>) => { const r = await authService.updateProfile(data); setUser(r.data.data); };
  return <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
