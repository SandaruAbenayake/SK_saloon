import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Chip, Stack,
  Avatar, CircularProgress, IconButton, Tooltip, Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ClearIcon from '@mui/icons-material/Clear';
import api from '../services/api';

const statusColor = {
  pending: 'warning',
  approved: 'success',
  completed: 'success',
  cancelled: 'error',
};

const paymentConfig = {
  unpaid: { color: 'default', label: 'Unpaid' },
  pending: { color: 'warning', label: 'Payment Pending' },
  paid: { color: 'success', label: 'Payment Confirmed' },
  failed: { color: 'error', label: 'Payment Failed' },
};

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async (date) => {
    setLoading(true);
    setError('');
    try {
      const params = date ? { date } : {};
      const res = await api.get('/owner/bookings', { params });
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(dateFilter); }, [dateFilter]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/owner/bookings/${id}/approve`);
      setError('');
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.response?.data?.error || 'Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) return;
    try {
      await api.put(`/owner/bookings/${id}/reject`);
      setError('');
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Reject error:', err);
      setError('Failed to reject booking');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/owner/bookings/${id}/complete`);
      setError('');
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Complete error:', err);
      setError('Failed to complete booking');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setError('');
      fetchBookings(dateFilter);
    } catch (err) {
      console.error('Cancel error:', err);
      setError('Failed to cancel booking');
    }
  };

  const fmt = (t) => (t ? t.slice(0, 5) : '');
  const formatDateString = (d) => {
    if (!d) return '';
    // If a string, extract ISO date or first 10 chars
    if (typeof d === 'string') {
      return d.includes('T') ? d.split('T')[0] : d.slice(0, 10);
    }

    // If a Date object (or convertible), format using local date parts to avoid timezone shifts
    try {
      const dt = d instanceof Date ? d : new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return String(d).slice(0, 10);
    }
  };
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;
  const paidPendingCount = bookings.filter(b => b.status === 'pending' && b.payment_status === 'paid').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          All Bookings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {pendingCount > 0 && (
            <Chip label={`${pendingCount} Pending`} color="warning" variant="outlined" sx={{ fontWeight: 'bold' }} />
          )}
          {paidPendingCount > 0 && (
            <Chip label={`${paidPendingCount} Ready to Approve`} color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
          )}
          <Chip label={`${approvedCount} Approved`} color="success" variant="outlined" />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
          {bookings.map((b) => {
            const payment = paymentConfig[b.payment_status] || { color: 'default', label: b.payment_status || 'Unpaid' };
            const canApprove = b.status === 'pending' && b.payment_status === 'paid';

            return (
              <Card key={b.id} sx={{ border: b.status === 'pending' ? '2px solid #ff9800' : '1px solid #37474f' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, py: '12px !important', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 700 }}>
                      {b.customer_name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{b.customer_name}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EventIcon sx={{ fontSize: 16 }} /> {formatDateString(b.booking_date)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 16 }} /> {fmt(b.start_time)} - {fmt(b.end_time)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {b.service_name} &bull; <strong>LKR {Number(b.price).toFixed(2)}</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14 }} /> {b.customer_phone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14 }} /> {b.customer_email}
                        </Typography>
                      </Box>
                      {b.payment_status === 'paid' && b.status === 'pending' && (
                        <Alert severity="success" sx={{ mt: 1, py: 0.5 }}>
                          Mock payment confirmed. Safe for admin approval.
                        </Alert>
                      )}
                      {b.payment_status !== 'paid' && b.status === 'pending' && (
                        <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                          Wait for mock payment confirmation before approving.
                        </Alert>
                      )}
                      {b.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                          Notes: {b.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {/* Admin sees payment and booking status separately before deciding. */}
                    <Chip
                      label={payment.label}
                      color={payment.color}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                      label={b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      color={statusColor[b.status] || 'default'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {b.status === 'pending' && (
                      <>
                        <Tooltip title={canApprove ? 'Approve Booking' : 'Payment must be confirmed first'}>
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<ThumbUpIcon />}
                              onClick={() => handleApprove(b.id)}
                              disabled={!canApprove}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject Booking">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<ThumbDownIcon />}
                            onClick={() => handleReject(b.id)}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      </>
                    )}
                    {b.status === 'approved' && (
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
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
