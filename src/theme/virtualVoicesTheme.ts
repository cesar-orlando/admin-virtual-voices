import { createTheme } from "@mui/material/styles";

const common = {
  typography: {
    fontFamily: 'Montserrat, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
};

const paletteLight = {
  mode: 'light',
  primary: { main: '#8B5CF6' },
  secondary: { main: '#E05EFF' },
  background: {
    default: '#F4F6FB',
    paper: 'rgba(255,255,255,0.85)',
  },
  text: {
    primary: '#181A20',
    secondary: '#3B82F6',
  },
};

const paletteDark = {
  mode: 'dark',
  primary: { main: '#8B5CF6' },
  secondary: { main: '#E05EFF' },
  background: {
    default: '#181A20',
    paper: 'rgba(30,30,40,0.85)',
  },
  text: {
    primary: '#fff',
    secondary: '#E05EFF',
  },
};

export function getVirtualVoicesTheme(mode: 'light' | 'dark') {
  return createTheme({
    ...common,
    palette: mode === 'light' ? paletteLight : paletteDark,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            background: mode === 'dark'
              ? 'rgba(30,30,40,0.85)'
              : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
          },
        },
      },
    },
  });
} 