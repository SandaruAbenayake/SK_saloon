import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

export default function Popup({ title, message, type, onClose, onConfirm, open = true }) {
  const icon = type === 'success' ? <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
    : type === 'error' ? <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />
    : <InfoIcon sx={{ fontSize: 40, color: 'secondary.main' }} />;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        {icon}
        <br />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ textAlign: 'center' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
        {onConfirm && (
          <Button variant="contained" color="primary" onClick={onConfirm}>Confirm</Button>
        )}
        <Button variant={onConfirm ? 'outlined' : 'contained'} onClick={onClose}>
          {onConfirm ? 'Cancel' : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
