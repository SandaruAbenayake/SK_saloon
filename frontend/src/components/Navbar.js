import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Chip, IconButton,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  // Owner uses sidebar layout — no top navbar needed
  if (user?.role === 'owner') return null;

  const mobileMenuItems = user
    ? [
        { text: 'Book Now', icon: <BookOnlineIcon />, path: '/book' },
        { text: 'My Bookings', icon: <ListAltIcon />, path: '/my-bookings' },
      ]
    : [
        { text: 'Login', icon: <LoginIcon />, path: '/login' },
        { text: 'Register', icon: <PersonAddIcon />, path: '/register' },
      ];

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 1, sm: 2 } }}>
          <ContentCutIcon sx={{ color: 'secondary.main', mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'secondary.main', fontWeight: 700, textDecoration: 'none', flexGrow: 1 }}
          >
            BarberBook
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            {user ? (
              <>
                <Chip
                  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{user.name?.[0]?.toUpperCase()}</Avatar>}
                  label={user.name}
                  variant="outlined"
                  sx={{ borderColor: 'secondary.main', color: 'secondary.main', mr: 1 }}
                />
                <Button color="primary" startIcon={<BookOnlineIcon />} component={RouterLink} to="/book">
                  Book Now
                </Button>
                <Button color="inherit" startIcon={<ListAltIcon />} component={RouterLink} to="/my-bookings">
                  My Bookings
                </Button>
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" color="primary" startIcon={<LoginIcon />} component={RouterLink} to="/login">
                  Login
                </Button>
                <Button variant="contained" color="primary" startIcon={<PersonAddIcon />} component={RouterLink} to="/register">
                  Register
                </Button>
              </>
            )}
          </Box>

          {/* Mobile hamburger */}
          <IconButton
            sx={{ display: { xs: 'flex', sm: 'none' }, color: 'text.primary' }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { sm: 'none' }, '& .MuiDrawer-paper': { width: 250 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="secondary.main" fontWeight={700}>BarberBook</Typography>
        </Box>
        <Divider />
        {user && (
          <>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>{user.name?.[0]?.toUpperCase()}</Avatar>
              <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
            </Box>
            <Divider />
          </>
        )}
        <List>
          {mobileMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => { navigate(item.path); setDrawerOpen(false); }}
              sx={{ borderRadius: 1, mx: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
          {user && (
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, mx: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          )}
        </List>
      </Drawer>
    </>
  );
}
