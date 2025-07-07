
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to auth page if authentication is required but user is not logged in
        navigate('/auth', { replace: true });
      } else if (!requireAuth && user && location.pathname === '/auth') {
        // Redirect to home if user is logged in but trying to access auth page
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, requireAuth, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to auth page
  }

  if (!requireAuth && user && location.pathname === '/auth') {
    return null; // Will redirect to home page
  }

  return <>{children}</>;
};

export default AuthGuard;
