import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Stack, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../services/api';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const formatTime = (t) => (t ? t.slice(0, 5) : '');

  const statusConfig = {
    pending: { color: 'warning', label: 'Pending Approval', icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} /> },
    approved: { color: 'success', label: 'Approved', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
    completed: { color: 'info', label: 'Completed', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
    cancelled: { color: 'error', label: 'Cancelled', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h4" color="secondary.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        My Bookings
      </Typography>

      {bookings.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>You haven't made any bookings yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {bookings.map((b) => {
            const config = statusConfig[b.status] || { color: 'default', label: b.status };
            return (
              <Card key={b.id} sx={{ border: b.status === 'pending' ? '2px solid #ff9800' : '1px solid #2a2a4a' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {b.service_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mt: 0.5, color: 'text.secondary', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventIcon fontSize="small" />
                        <Typography variant="body2">{b.booking_date?.split('T')[0]}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{formatTime(b.start_time)} – {formatTime(b.end_time)}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="secondary.main" fontWeight={600} sx={{ mt: 0.5 }}>
                      LKR {Number(b.price).toFixed(2)}
                    </Typography>
                    {b.status === 'pending' && (
                      <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                        Waiting for owner approval...
                      </Alert>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={config.icon}
                      label={config.label}
                      color={config.color}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {(b.status === 'approved' || b.status === 'pending') && (
                      <Button variant="outlined" color="error" size="small" onClick={() => handleCancel(b.id)}>
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
