import { createTheme } from '@mui/material/styles';

const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',      // Bright Blue - Professional for Admin
      light: '#64b5f6',
      dark: '#1565c0',
    },
    secondary: {
      main: '#00bcd4',      // Cyan - Complementary for Admin
      light: '#4dd0e1',
      dark: '#0097a7',
    },
    background: {
      default: '#0d47a1',
      paper: '#1a237e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    info: {
      main: '#2196f3',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
    divider: '#37474f',
  },
  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #37474f',
          background: 'linear-gradient(135deg, #263238 0%, #37474f 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(135deg, #0d47a1 0%, #1a237e 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          background: 'linear-gradient(180deg, #1a237e 0%, #0d47a1 100%)',
          borderRight: '1px solid #37474f',
        },
      },
    },
  },
});

export default adminTheme;
