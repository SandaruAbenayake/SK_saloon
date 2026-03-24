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
import api from '../../services/api';

export default function OwnerDashboard() {
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get('/owner/bookings', { params: { date: today } })
      .then((res) => {
        setTodayBookings(res.data.bookings.filter((b) => b.status === 'confirmed'));
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
      <Typography variant="h4" color="secondary.main" gutterBottom>Dashboard</Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="primary.main">{todayBookings.length}</Typography>
              <Typography variant="body2" color="text.secondary">Today's Appointments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 36, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="secondary.main">
                {new Set(todayBookings.map((b) => b.customer_id)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">Unique Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700} color="success.main">
                {todayBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0)} min
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Scheduled Time</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Appointments */}
      <Typography variant="h5" gutterBottom>Today's Appointments</Typography>
      {todayBookings.length === 0 ? (
        <Alert severity="info">No appointments for today.</Alert>
      ) : (
        <Stack spacing={2}>
          {todayBookings.map((b) => (
            <Card key={b.id}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
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
                <Box sx={{ display: 'flex', gap: 1 }}>
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
