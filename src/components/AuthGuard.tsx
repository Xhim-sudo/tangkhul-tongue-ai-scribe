
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
    console.log('🛡️ AuthGuard check:', { user: !!user, loading, requireAuth, path: location.pathname });
    
    if (!loading) {
      if (requireAuth && !user) {
        console.log('🔒 Redirecting to auth - authentication required');
        navigate('/auth', { replace: true });
      } else if (!requireAuth && user && location.pathname === '/auth') {
        console.log('🏠 Redirecting to home - user already authenticated');
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, requireAuth, navigate, location.pathname]);

  // Show loading spinner with timeout indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-orange-600">Loading authentication...</p>
          <p className="text-sm text-gray-500">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    console.log('🚫 Access denied - redirecting to auth');
    return null; // Will redirect to auth page
  }

  if (!requireAuth && user && location.pathname === '/auth') {
    console.log('🚫 Already authenticated - redirecting to home');
    return null; // Will redirect to home page
  }

  console.log('✅ AuthGuard passed - rendering children');
  return <>{children}</>;
};

export default AuthGuard;
