import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import OwnerLayout from './components/OwnerLayout';
import HomePage from './pages/user/HomePage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import BookingPage from './pages/user/BookingPage';
import MyBookingsPage from './pages/user/MyBookingsPage';
import OwnerDashboard from './pages/admin/OwnerDashboard';
import OwnerSchedulePage from './pages/admin/OwnerSchedulePage';
import OwnerBookingsPage from './pages/admin/OwnerBookingsPage';
import OwnerServicesPage from './pages/admin/OwnerServicesPage';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'owner' ? '/owner/dashboard' : '/book'} />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><HomePage /></>} />
      <Route path="/login" element={<><Navbar /><GuestRoute><LoginPage /></GuestRoute></>} />
      <Route path="/register" element={<><Navbar /><GuestRoute><RegisterPage /></GuestRoute></>} />

      {/* Customer Routes */}
      <Route path="/book" element={<><Navbar /><PrivateRoute role="customer"><BookingPage /></PrivateRoute></>} />
      <Route path="/my-bookings" element={<><Navbar /><PrivateRoute role="customer"><MyBookingsPage /></PrivateRoute></>} />

      {/* Owner Routes — uses sidebar layout */}
      <Route path="/owner" element={<PrivateRoute role="owner"><OwnerLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="bookings" element={<OwnerBookingsPage />} />
        <Route path="schedule" element={<OwnerSchedulePage />} />
        <Route path="services" element={<OwnerServicesPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
