import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Stack, Avatar,
  CircularProgress, Alert,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function OwnerDashboard() {
  const [allBookings, setAllBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all bookings
    api.get('/owner/bookings')
      .then((res) => {
        const all = res.data.bookings;
        setAllBookings(all);
        
        // Today's approved bookings
        setTodayBookings(all.filter((b) => b.booking_date === today && b.status === 'approved'));
        
        // Pending bookings
        setPendingBookings(all.filter((b) => b.status === 'pending'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (t) => (t ? t.slice(0, 5) : '');

  const handleComplete = async (id) => {
    try {
      await api.put(`/owner/bookings/${id}/complete`);
      setTodayBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setTodayBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" color="primary.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        Dashboard
      </Typography>

      {/* Warning for pending bookings */}
      {pendingBookings.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/owner/bookings')}
            >
              View Pending
            </Button>
          }
        >
          <WarningIcon /> You have <strong>{pendingBookings.length}</strong> pending booking{pendingBookings.length !== 1 ? 's' : ''} awaiting approval!
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 } }} onClick={() => navigate('/owner/bookings')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="warning.main" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                {pendingBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                {todayBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Today's Appointments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 36, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="secondary.main" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                {new Set(todayBookings.map((b) => b.customer_id)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">Unique Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                {todayBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0)} min
              </Typography>
              <Typography variant="body2" color="text.secondary">Scheduled Today</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Appointments */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Today's Appointments</Typography>
      {todayBookings.length === 0 ? (
        <Alert severity="info">No appointments for today.</Alert>
      ) : (
        <Stack spacing={2}>
          {todayBookings.map((b) => (
            <Card key={b.id}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', color: '#000', width: 44, height: 44, fontWeight: 'bold' }}>
                    {b.customer_name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{b.customer_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {b.service_name} • {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{b.customer_phone}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleComplete(b.id)}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancel(b.id)}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
