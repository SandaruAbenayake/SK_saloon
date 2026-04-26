import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/user/HomePage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import BookingPage from './pages/user/BookingPage';
import MyBookingsPage from './pages/user/MyBookingsPage';

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

      <Route path="*" element={<Navigate to="/" />} />
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
