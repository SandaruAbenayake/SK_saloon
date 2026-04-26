import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, CardActionArea, Grid, TextField,
  Button, Stepper, Step, StepLabel, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../../services/api';
import Popup from '../../components/Popup';

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [popup, setPopup] = useState(null);
  const [booking, setBooking] = useState(false);

  const activeStep = selectedSlot ? 3 : selectedDate && selectedService ? 2 : selectedService ? 1 : 0;

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    api.get('/services').then((res) => setServices(res.data.services)).catch(console.error);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await api.get('/bookings/available-slots', {
        params: { date: selectedDate, serviceId: selectedService.id },
      });
      setSlots(res.data.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedService, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleSlotSelect = async (slot) => {
    setSelectedSlot(slot);
    try {
      const res = await api.post('/bookings/validate', {
        date: selectedDate, startTime: slot.start, serviceId: selectedService.id,
      });
      if (!res.data.available) {
        setPopup({ title: 'Slot Unavailable', message: res.data.reason, type: 'error' });
        setSelectedSlot(null);
        fetchSlots();
      }
    } catch {
      setPopup({ title: 'Validation Error', message: 'Could not validate this slot.', type: 'error' });
      setSelectedSlot(null);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedService || !selectedDate) return;
    setBooking(true);
    try {
      const res = await api.post('/bookings', {
        date: selectedDate, startTime: selectedSlot.start, serviceId: selectedService.id, notes,
      });
      setPopup({
        title: res.data.message,
        message: `${res.data.booking.service} on ${res.data.booking.date} from ${res.data.booking.startTime} to ${res.data.booking.endTime}\n\nStatus: ${res.data.booking.status.charAt(0).toUpperCase() + res.data.booking.status.slice(1)}`,
        type: 'success',
      });
      setSelectedSlot(null);
      setNotes('');
      fetchSlots();
    } catch (err) {
      setPopup({
        title: 'Booking Failed',
        message: err.response?.data?.reason || err.response?.data?.error || 'Booking failed',
        type: 'error',
      });
      setSelectedSlot(null);
      fetchSlots();
    } finally {
      setBooking(false);
    }
  };

  const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h4" color="secondary.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        Book an Appointment
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: { xs: 2, sm: 4 }, display: { xs: 'none', sm: 'flex' } }} alternativeLabel>
        {['Select Service', 'Pick Date', 'Choose Time', 'Confirm'].map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {/* Step 1: Service */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>1. Choose a Service</Typography>
          <Grid container spacing={2}>
            {services.map((svc) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={svc.id}>
                <Card
                  variant="outlined"
                  sx={{
                    border: selectedService?.id === svc.id ? 2 : 1,
                    borderColor: selectedService?.id === svc.id ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'secondary.main', transform: 'translateY(-2px)' },
                  }}
                >
                  <CardActionArea onClick={() => setSelectedService(svc)} sx={{ p: 2 }}>
                    {selectedService?.id === svc.id && (
                      <CheckCircleOutlineIcon sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main' }} />
                    )}
                    <Typography variant="subtitle1" fontWeight={600}>{svc.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: 'text.secondary' }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">{formatDuration(svc.duration_minutes)}</Typography>
                    </Box>
                    {svc.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {svc.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 700 }}>LKR</Typography>
                      <Typography variant="h6" color="secondary.main" fontWeight={700}>
                        {Number(svc.price).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Step 2: Date */}
      {selectedService && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>2. Pick a Date</Typography>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              inputProps={{ min: today }}
              sx={{ maxWidth: 250 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Time Slots */}
      {selectedService && selectedDate && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>3. Select a Time Slot</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Available slots for {selectedService.name} ({formatDuration(selectedService.duration_minutes)})
            </Typography>
            {loadingSlots ? (
              <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress /></Box>
            ) : slots.length === 0 ? (
              <Alert severity="warning">No available slots for this date. Please choose another day.</Alert>
            ) : (
              <FormControl fullWidth sx={{ maxWidth: 320 }}>
                <InputLabel id="time-slot-label">Available Times</InputLabel>
                <Select
                  labelId="time-slot-label"
                  value={selectedSlot ? selectedSlot.start : ''}
                  label="Available Times"
                  onChange={(e) => {
                    const slot = slots.find((s) => s.start === e.target.value);
                    if (slot) handleSlotSelect(slot);
                  }}
                  startAdornment={<AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />}
                >
                  {slots.map((slot) => (
                    <MenuItem key={slot.start} value={slot.start}>
                      {slot.start} – {slot.end}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {selectedSlot && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>4. Confirm Booking</Typography>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 5, sm: 6 }}><Typography variant="body2" color="text.secondary">Service</Typography></Grid>
                <Grid size={{ xs: 7, sm: 6 }}><Typography variant="body2" fontWeight={600}>{selectedService.name}</Typography></Grid>
                <Grid size={{ xs: 5, sm: 6 }}><Typography variant="body2" color="text.secondary">Date</Typography></Grid>
                <Grid size={{ xs: 7, sm: 6 }}><Typography variant="body2" fontWeight={600}>{selectedDate}</Typography></Grid>
                <Grid size={{ xs: 5, sm: 6 }}><Typography variant="body2" color="text.secondary">Time</Typography></Grid>
                <Grid size={{ xs: 7, sm: 6 }}><Typography variant="body2" fontWeight={600}>{selectedSlot.start} – {selectedSlot.end}</Typography></Grid>
                <Grid size={{ xs: 5, sm: 6 }}><Typography variant="body2" color="text.secondary">Price</Typography></Grid>
                <Grid size={{ xs: 7, sm: 6 }}><Typography variant="body2" fontWeight={600} color="secondary.main">LKR {Number(selectedService.price).toFixed(2)}</Typography></Grid>
              </Grid>
            </Box>
            <TextField
              label="Notes (optional)"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleBook}
              disabled={booking}
              fullWidth
              sx={{ px: 5 }}
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </CardContent>
        </Card>
      )}

      {popup && (
        <Popup title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup(null)} />
      )}
    </Box>
  );
}
