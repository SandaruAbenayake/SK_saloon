import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Chip,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Owner uses sidebar layout — no top navbar needed
  if (user?.role === 'owner') return null;

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
        <ContentCutIcon sx={{ color: 'secondary.main', mr: 1 }} />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: 'secondary.main', fontWeight: 700, textDecoration: 'none', flexGrow: 1 }}
        >
          BarberBook
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <Chip
                avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{user.name?.[0]?.toUpperCase()}</Avatar>}
                label={user.name}
                variant="outlined"
                sx={{ borderColor: 'secondary.main', color: 'secondary.main', mr: 1 }}
              />
              <Button
                color="primary"
                startIcon={<BookOnlineIcon />}
                component={RouterLink}
                to="/book"
              >
                Book Now
              </Button>
              <Button
                color="inherit"
                startIcon={<ListAltIcon />}
                component={RouterLink}
                to="/my-bookings"
              >
                My Bookings
              </Button>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<LoginIcon />}
                component={RouterLink}
                to="/login"
              >
                Login
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                component={RouterLink}
                to="/register"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
