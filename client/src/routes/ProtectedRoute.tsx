import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui';
export function ProtectedRoute({ roles }: { roles?: string[] }) { const { user, loading } = useAuth(); if (loading) return <div className="p-8"><Skeleton className="h-96"/></div>; if (!user) return <Navigate to="/login" replace/>; if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace/>; return <Outlet/>; }
