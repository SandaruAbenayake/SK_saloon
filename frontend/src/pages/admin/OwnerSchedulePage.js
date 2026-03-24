import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow,
  TableCell, Switch, TextField, Button, Snackbar, Alert, IconButton,
  Select, MenuItem, FormControl, InputLabel, Grid, Chip, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../services/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OwnerSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [closedDates, setClosedDates] = useState([]);
  const [newBreak, setNewBreak] = useState({ dayOfWeek: 1, breakType: 'lunch', startTime: '12:00', endTime: '13:00', label: '' });
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchAll = async () => {
    try {
      const res = await api.get('/schedule');
      setSchedules(res.data.schedules);
      setBreaks(res.data.breaks);
      setClosedDates(res.data.closedDates);
    } catch (err) {
      console.error('Fetch schedule error:', err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleScheduleUpdate = async (day) => {
    const sched = schedules.find((s) => s.day_of_week === day);
    if (!sched) return;
    try {
      await api.put(`/owner/schedule/${day}`, {
        openTime: sched.open_time.slice(0, 5),
        closeTime: sched.close_time.slice(0, 5),
        isOpen: sched.is_open,
      });
      showMsg(`${DAY_NAMES[day]} schedule updated!`);
    } catch (err) {
      showMsg('Failed to update schedule', 'error');
    }
  };

  const updateLocalSchedule = (day, field, value) => {
    setSchedules((prev) => prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)));
  };

  const handleAddBreak = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owner/breaks', newBreak);
      showMsg('Break added!');
      fetchAll();
    } catch (err) {
      showMsg('Failed to add break', 'error');
    }
  };

  const handleDeleteBreak = async (id) => {
    try {
      await api.delete(`/owner/breaks/${id}`);
      fetchAll();
    } catch (err) {
      showMsg('Failed to remove break', 'error');
    }
  };

  const handleAddClosedDate = async (e) => {
    e.preventDefault();
    if (!newClosedDate.date) return;
    try {
      await api.post('/owner/closed-dates', newClosedDate);
      showMsg('Closed date added!');
      setNewClosedDate({ date: '', reason: '' });
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Failed to add closed date', 'error');
    }
  };

  const handleDeleteClosedDate = async (id) => {
    try {
      await api.delete(`/owner/closed-dates/${id}`);
      fetchAll();
    } catch (err) {
      showMsg('Failed to remove closed date', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" color="secondary.main" gutterBottom>Schedule Management</Typography>

      {/* Daily Hours */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Daily Operating Hours</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Open</TableCell>
                <TableCell>Open Time</TableCell>
                <TableCell>Close Time</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.day_of_week}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{DAY_NAMES[s.day_of_week]}</Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!s.is_open}
                      onChange={(e) => updateLocalSchedule(s.day_of_week, 'is_open', e.target.checked ? 1 : 0)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={s.open_time?.slice(0, 5) || '10:00'}
                      onChange={(e) => updateLocalSchedule(s.day_of_week, 'open_time', e.target.value + ':00')}
                      sx={{ width: 130 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={s.close_time?.slice(0, 5) || '20:30'}
                      onChange={(e) => updateLocalSchedule(s.day_of_week, 'close_time', e.target.value + ':00')}
                      sx={{ width: 130 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleScheduleUpdate(s.day_of_week)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Breaks */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Breaks</Typography>
          {breaks.length > 0 && (
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breaks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{DAY_NAMES[b.day_of_week]}</TableCell>
                    <TableCell>
                      <Chip label={b.break_type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>{b.start_time?.slice(0, 5)}</TableCell>
                    <TableCell>{b.end_time?.slice(0, 5)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleDeleteBreak(b.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <form onSubmit={handleAddBreak}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Day</InputLabel>
                  <Select value={newBreak.dayOfWeek} label="Day" onChange={(e) => setNewBreak((b) => ({ ...b, dayOfWeek: e.target.value }))}>
                    {DAY_NAMES.map((d, i) => <MenuItem key={i} value={i}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={newBreak.breakType} label="Type" onChange={(e) => setNewBreak((b) => ({ ...b, breakType: e.target.value }))}>
                    <MenuItem value="lunch">Lunch</MenuItem>
                    <MenuItem value="tea">Tea</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField type="time" size="small" fullWidth label="From" value={newBreak.startTime}
                  onChange={(e) => setNewBreak((b) => ({ ...b, startTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField type="time" size="small" fullWidth label="To" value={newBreak.endTime}
                  onChange={(e) => setNewBreak((b) => ({ ...b, endTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Button type="submit" variant="contained" startIcon={<AddIcon />} fullWidth>Add Break</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Closed Dates */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Closed Dates (Holidays)</Typography>
          {closedDates.length > 0 && (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {closedDates.map((cd) => (
                <Box key={cd.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{cd.closed_date?.split('T')[0]}</Typography>
                    {cd.reason && <Typography variant="caption" color="text.secondary">{cd.reason}</Typography>}
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteClosedDate(cd.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
          <form onSubmit={handleAddClosedDate}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField type="date" size="small" fullWidth label="Date" value={newClosedDate.date}
                  onChange={(e) => setNewClosedDate((c) => ({ ...c, date: e.target.value }))} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField size="small" fullWidth label="Reason (optional)" value={newClosedDate.reason}
                  onChange={(e) => setNewClosedDate((c) => ({ ...c, reason: e.target.value }))} placeholder="e.g., Poya Day" />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Button type="submit" variant="contained" startIcon={<AddIcon />} fullWidth>Add</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
