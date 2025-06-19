import React, { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  Switch as MuiSwitch,
  Fade,
  Badge,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Sidebar from "./Sidebar";
import { useAuth } from "../hooks/useAuth";
import { getVirtualVoicesTheme } from "../theme/virtualVoicesTheme";
import { ThemeProvider } from "@mui/material/styles";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const collapsedWidth = 72;
const expandedWidth = 240;

// Objeto para mantener el estado de cada ruta
const routeStates = new Map();

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { logoutUser } = useAuth();
  const menuOpen = Boolean(anchorEl);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isMobile = useMediaQuery("(max-width:600px)");
  const location = useLocation();

  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vv-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('vv-theme', mode);
  }, [mode]);
  
  const theme = useMemo(() => getVirtualVoicesTheme(mode), [mode]);

  const [notifications] = useState([
    { id: 1, text: "Nuevo usuario registrado" },
    { id: 2, text: "IA actualizada" },
  ]);
  const [showNotif, setShowNotif] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Estado para la transición del contenido
  const [contentVisible, setContentVisible] = useState(false);

  // Efecto para manejar las transiciones de página
  useEffect(() => {
    routeStates.set(location.pathname, {
      scrollPosition: window.scrollY,
      content: document.querySelector('main')?.innerHTML
    });

    setContentVisible(false);
    const showTimeout = setTimeout(() => {
      setContentVisible(true);
      const savedState = routeStates.get(location.pathname);
      if (savedState?.scrollPosition) {
        window.scrollTo(0, savedState.scrollPosition);
      }
    }, 80);

    return () => clearTimeout(showTimeout);
  }, [location.pathname]);

  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", background: theme.palette.background.default }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { sm: `calc(100% - ${sidebarHover ? expandedWidth : collapsedWidth}px)` },
            ml: { sm: `${sidebarHover ? expandedWidth : collapsedWidth}px` },
            transition: 'all 0.2s ease-out',
            zIndex: theme.zIndex.drawer - 1,
            background: 'transparent',
            borderBottom: 'none',
            backdropFilter: "blur(8px)",
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ 
            justifyContent: "flex-end",
            minHeight: { xs: 64, sm: 72 },
            px: { xs: 2, sm: 3 },
          }}>
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 2,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(30,30,40,0.3)' 
                : 'rgba(255,255,255,0.3)',
              borderRadius: 3,
              p: 1,
              backdropFilter: "blur(8px)",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                : '0 4px 24px rgba(139, 92, 246, 0.05)',
            }}>
              <Tooltip title="Notificaciones">
                <IconButton 
                  color="inherit" 
                  onClick={() => setShowNotif((s) => !s)} 
                  aria-label="Ver notificaciones"
                  sx={{
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(30,30,40,0.5)' 
                      : 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'rgba(139, 92, 246, 0.05)',
                    }
                  }}
                >
                  <Badge badgeContent={notifications.length} color="secondary" variant="dot" overlap="circular">
                    <NotificationsIcon sx={{ fontSize: 22, color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(30,30,40,0.5)' 
                  : 'rgba(255,255,255,0.5)',
                borderRadius: 2,
                p: 0.5,
              }}>
                <LightModeIcon sx={{ color: mode === 'light' ? '#E05EFF' : '#BDBDBD', fontSize: 20 }} />
                <MuiSwitch
                  checked={mode === 'dark'}
                  onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  color="secondary"
                  size="small"
                  sx={{
                    '& .MuiSwitch-thumb': {
                      background: mode === 'dark'
                        ? 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)'
                        : 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                    },
                  }}
                />
                <DarkModeIcon sx={{ color: mode === 'dark' ? '#8B5CF6' : '#BDBDBD', fontSize: 20 }} />
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Sidebar 
          mobileOpen={mobileOpen} 
          onClose={handleDrawerToggle} 
          mode={mode}
          onHoverChange={setSidebarHover}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isMobile ? 1 : 3,
            pt: { xs: 9, sm: 10 },
            width: { sm: `calc(100% - ${sidebarHover ? expandedWidth : collapsedWidth}px)` },
            minHeight: '100vh',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(to right, rgba(30,30,40,0.95), rgba(30,30,40,0.92))'
              : 'linear-gradient(to right, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            ml: { xs: 0, sm: `${sidebarHover ? expandedWidth : collapsedWidth}px` },
            borderLeft: 'none',
          }}
        >
          <Fade in={contentVisible} timeout={600}>
            <Box sx={{ 
              flex: 1, 
              width: '100%',
              position: 'relative',
            }}>
              <Outlet />
            </Box>
          </Fade>
          <Box
            component="footer"
            sx={{
              width: '100%',
              textAlign: 'center',
              color: '#BDBDBD',
              fontSize: 13,
              fontFamily: 'Montserrat, Arial, sans-serif',
              py: 2,
              mt: 'auto',
              background: 'transparent',
              position: 'relative',
            }}
          >
            © {new Date().getFullYear()} Virtual Voices. Todos los derechos reservados.
          </Box>
        </Box>
        {showNotif && (
          <Box
            sx={{
              position: 'fixed',
              top: 80,
              right: 32,
              zIndex: 2000,
              minWidth: 260,
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderRadius: 2,
              boxShadow: '0 4px 24px #8B5CF655',
              p: 2,
              transition: 'all 0.3s',
            }}
            role="alert"
            aria-live="polite"
          >
            <Typography fontWeight={700} mb={1} color="#E05EFF">Notificaciones</Typography>
            {notifications.map((n) => (
              <Typography key={n.id} fontSize={15} mb={0.5}>• {n.text}</Typography>
            ))}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}