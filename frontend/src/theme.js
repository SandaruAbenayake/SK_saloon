import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e94560',
      light: '#ff6b81',
      dark: '#c73650',
    },
    secondary: {
      main: '#d4a843',
      light: '#e0bf6e',
      dark: '#b8912e',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
    success: {
      main: '#27ae60',
    },
    error: {
      main: '#e74c3c',
    },
    text: {
      primary: '#eaeaea',
      secondary: '#a0a0b0',
    },
    divider: '#2a2a4a',
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
          border: '1px solid #2a2a4a',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
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
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: '1px solid #2a2a4a',
        },
      },
    },
  },
});

export default theme;
