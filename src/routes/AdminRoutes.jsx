import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Requests from '../pages/Requests';
import RequestDetails from '../pages/RequestDetails';
// ❌ REMOVED: import SMSLogs from '../pages/SMSLogs';
import ActivityLogs from '../pages/ActivityLogs';
import AdminUsers from '../pages/AdminUsers';
import Settings from '../pages/Settings';
import ProtectedRoute from '../components/ProtectedRoute';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/:id" element={<RequestDetails />} />
        {/* ❌ REMOVED: <Route path="sms-logs" element={<SMSLogs />} /> */}
        <Route path="activity-logs" element={<ActivityLogs />} />
        
        {/* Protected Admin Users route - only super_admin can access */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;