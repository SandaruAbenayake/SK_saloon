import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Typography, Button, Container, Grid, Card, CardContent, Stack,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SpaIcon from '@mui/icons-material/Spa';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const features = [
  { icon: <ContentCutIcon sx={{ fontSize: 40 }} />, title: 'Haircuts', desc: 'Classic & modern styles' },
  { icon: <FaceRetouchingNaturalIcon sx={{ fontSize: 40 }} />, title: 'Beard Grooming', desc: 'Trim, shape & style' },
  { icon: <ColorLensIcon sx={{ fontSize: 40 }} />, title: 'Hair Color', desc: 'Professional coloring' },
  { icon: <SpaIcon sx={{ fontSize: 40 }} />, title: 'Head Massage', desc: 'Relaxation therapy' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h2" fontWeight={800} color="secondary.main" gutterBottom>
        BarberBook
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mb: 5 }}>
        Premium men's grooming. Book your appointment online — fast, simple, and hassle-free.
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 8 }}>
        {user ? (
          user.role === 'owner' ? (
            <Button component={Link} to="/owner/dashboard" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
              Go to Dashboard
            </Button>
          ) : (
            <Button component={Link} to="/book" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
              Book Now
            </Button>
          )
        ) : (
          <>
            <Button component={Link} to="/login" variant="contained" size="large">Login</Button>
            <Button component={Link} to="/register" variant="outlined" size="large">Register</Button>
          </>
        )}
      </Stack>

      <Grid container spacing={3}>
        {features.map((f) => (
          <Grid size={{ xs: 6, sm: 3 }} key={f.title}>
            <Card sx={{ textAlign: 'center', py: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ color: 'secondary.main', mb: 1 }}>{f.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700} color="secondary.main">{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
