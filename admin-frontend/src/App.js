import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import OwnerLayout from './components/OwnerLayout';
import LoginPage from './pages/LoginPage';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerSchedulePage from './pages/OwnerSchedulePage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import OwnerServicesPage from './pages/OwnerServicesPage';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role === 'owner') return <Navigate to="/owner/dashboard" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Owner Routes — uses sidebar layout */}
      <Route path="/owner" element={<PrivateRoute role="owner"><OwnerLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="bookings" element={<OwnerBookingsPage />} />
        <Route path="schedule" element={<OwnerSchedulePage />} />
        <Route path="services" element={<OwnerServicesPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function ThemeWrapper({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeWrapper>
          <AppRoutes />
        </ThemeWrapper>
      </AuthProvider>
    </Router>
  );
}
