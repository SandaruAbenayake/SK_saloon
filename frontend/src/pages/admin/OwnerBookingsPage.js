import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Chip, Stack,
  Avatar, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ClearIcon from '@mui/icons-material/Clear';
import api from '../../services/api';

const statusColor = { confirmed: 'info', completed: 'success', cancelled: 'error' };

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async (date) => {
    setLoading(true);
    try {
      const params = date ? { date } : {};
      const res = await api.get('/owner/bookings', { params });
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(dateFilter); }, [dateFilter]);

  const handleComplete = async (id) => {
    try {
      await api.put(`/owner/bookings/${id}/complete`);
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const fmt = (t) => (t ? t.slice(0, 5) : '');

  return (
    <Box>
      <Typography variant="h4" color="secondary.main" gutterBottom>All Bookings</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: '12px !important' }}>
          <Typography variant="body2" color="text.secondary">Filter by date:</Typography>
          <TextField type="date" size="small" value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          {dateFilter && (
            <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={() => setDateFilter('')}>
              Show All
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {bookings.length} booking{bookings.length !== 1 && 's'}
          </Typography>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : bookings.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary" align="center">No bookings found.</Typography></CardContent></Card>
      ) : (
        <Stack spacing={2}>
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, py: '12px !important' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 700 }}>
                    {b.customer_name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{b.customer_name}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventIcon sx={{ fontSize: 16 }} /> {b.booking_date?.split('T')[0]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 16 }} /> {fmt(b.start_time)} - {fmt(b.end_time)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {b.service_name} &bull; <strong>${Number(b.price).toFixed(2)}</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 14 }} /> {b.customer_phone}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} /> {b.customer_email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={b.status} color={statusColor[b.status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
                  {b.status === 'confirmed' && (
                    <>
                      <Tooltip title="Mark Complete">
                        <IconButton color="success" size="small" onClick={() => handleComplete(b.id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton color="error" size="small" onClick={() => handleCancel(b.id)}>
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
