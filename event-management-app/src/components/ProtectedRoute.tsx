import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authHelper } from '../common/helper/authHelper';
import UserService from '../services/UserService';
import { ProgressSpinner } from 'primereact/progressspinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authHelper.getRawToken();
        if (!token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const userId = authHelper.getUserId();
        if (!userId) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Get user info to check if account is active
        const user = await UserService.getUserById(userId);
        if (user) {
          if (!user.active) {
            // Account is locked
            setIsLocked(true);
            setIsAuthorized(false);
          } else {
            // Account is active
            setIsAuthorized(true);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  // If account is locked, redirect to /locked
  if (isLocked) {
    return <Navigate to="/locked" state={{ from: location }} replace />;
  }

  // If not authorized, redirect to login
  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
