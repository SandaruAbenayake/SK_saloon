import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow,
  TableCell, TextField, Button, Switch, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';

const empty = { name: '', duration: 30, price: '', description: '' };

export default function OwnerServicesPage() {
  const [services, setServices] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.services);
    } catch (err) {
      console.error('Fetch services error:', err);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const openAdd = () => { setEditing(null); setForm(empty); setDialog(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, duration: s.duration_minutes, price: s.price, description: s.description || '' });
    setDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = { name: form.name, duration: Number(form.duration), price: Number(form.price), description: form.description };
      if (editing) {
        await api.put(`/owner/services/${editing}`, payload);
        showMsg('Service updated!');
      } else {
        await api.post('/owner/services', payload);
        showMsg('Service created!');
      }
      setDialog(false);
      fetchServices();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Failed to save service', 'error');
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/owner/services/${s.id}`, {
        name: s.name, duration: s.duration_minutes, price: s.price, description: s.description,
        isActive: s.is_active ? 0 : 1,
      });
      fetchServices();
    } catch (err) {
      showMsg('Failed to toggle service', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" color="secondary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Services</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Service</Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{s.name}</Typography>
                    {s.description && <Typography variant="caption" color="text.secondary">{s.description}</Typography>}
                  </TableCell>
                  <TableCell>{s.duration_minutes} min</TableCell>
                  <TableCell>LKR {Number(s.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={s.is_active ? 'Active' : 'Inactive'} color={s.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton>
                    <Switch size="small" checked={!!s.is_active} onChange={() => toggleActive(s)} color="success" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required fullWidth />
          <TextField label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} required fullWidth />
          <TextField label="Price (LKR)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required fullWidth inputProps={{ step: '0.01' }} />
          <TextField label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
