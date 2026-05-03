import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = 'super_admin' }) => {
  // Get user data from localStorage
  const userData = localStorage.getItem('currentUser');
  
  if (!userData) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  try {
    const parsed = JSON.parse(userData);
    const user = parsed.user || parsed;
    const userRole = user.role || 'staff';

    // Check if user has required role
    if (userRole !== requiredRole) {
      // Not authorized - redirect to dashboard
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Authorized - render the protected component
    return children;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return <Navigate to="/admin/dashboard" replace />;
  }
};

export default ProtectedRoute;