import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Analytics } from '@vercel/analytics/react';


import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Meetings from './pages/Meetings';
import Staff from './pages/Staff';
import Roles from './pages/Roles';
import Departments from './pages/Departments';
import Venues from './pages/Venues';
import MeetingTypes from './pages/MeetingTypes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meetings" element={<Meetings />} />

              {/* Admin Routes */}
              <Route path="/staff" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><Staff /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><Roles /></ProtectedRoute>} />
              <Route path="/departments" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><Departments /></ProtectedRoute>} />
              <Route path="/venues" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><Venues /></ProtectedRoute>} />
              <Route path="/meeting-types" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><MeetingTypes /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          <Analytics />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
