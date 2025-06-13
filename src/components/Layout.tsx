import React, { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
import { useAuth } from "../context/AuthContext";
import { getVirtualVoicesTheme } from "../theme/virtualVoicesTheme";
import { ThemeProvider } from "@mui/material/styles";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { logout } = useAuth();
  const menuOpen = Boolean(anchorEl);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isMobile = useMediaQuery("(max-width:600px)");
  const location = useLocation();

  // Dark/Light mode state
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vv-theme') as 'light' | 'dark') || 'light';
  });
  useEffect(() => {
    localStorage.setItem('vv-theme', mode);
  }, [mode]);
  const theme = useMemo(() => getVirtualVoicesTheme(mode), [mode]);

  // Notificaciones de ejemplo
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

  // Animación de entrada para el contenido
  const [contentVisible, setContentVisible] = useState(false);
  useEffect(() => {
    setContentVisible(false);
    const timeout = setTimeout(() => setContentVisible(true), 80);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", background: theme.palette.background.default }}>
        {/* AppBar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: 1201,
            background: theme.palette.mode === 'dark'
              ? 'rgba(30,30,40,0.92)'
              : 'rgba(255,255,255,0.92)',
            color: theme.palette.text.primary,
            borderBottom: "2px solid #8B5CF6",
            backdropFilter: "blur(16px)",
            boxShadow: '0 4px 24px #8B5CF655',
            transition: 'background 0.5s',
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* Menú hamburguesa solo en móvil */}
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: "none" } }}
                aria-label="Abrir menú lateral"
              >
                <MenuIcon />
              </IconButton>
              {/* Logo y nombre */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #E05EFF 0%, #8B5CF6 60%, #3B82F6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px #8B5CF6AA",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 1 }}>V</Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    letterSpacing: 2,
                    fontFamily: 'Montserrat, Arial, sans-serif',
                  }}
                >
                  VIRTUAL VOICES
                </Typography>
              </Box>
            </Box>
            {/* Header derecho: Notificaciones, Switch de tema, usuario, avatar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Bell de notificaciones */}
              <Tooltip title="Notificaciones">
                <IconButton color="inherit" onClick={() => setShowNotif((s) => !s)} aria-label="Ver notificaciones">
                  <Badge badgeContent={notifications.length} color="secondary" variant="dot" overlap="circular">
                    <NotificationsIcon sx={{ fontSize: 26, color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              {/* Switch de tema */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LightModeIcon sx={{ color: mode === 'light' ? '#E05EFF' : '#BDBDBD', fontSize: 22, transition: 'color 0.3s' }} />
                <MuiSwitch
                  checked={mode === 'dark'}
                  onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  color="secondary"
                  inputProps={{ 'aria-label': 'Cambiar modo de tema' }}
                  sx={{
                    '& .MuiSwitch-thumb': {
                      background: mode === 'dark'
                        ? 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)'
                        : 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                      transition: 'background 0.3s',
                    },
                  }}
                />
                <DarkModeIcon sx={{ color: mode === 'dark' ? '#8B5CF6' : '#BDBDBD', fontSize: 22, transition: 'color 0.3s' }} />
              </Box>
              {/* Usuario y avatar */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
                onClick={handleProfileClick}
                aria-label="Abrir menú de usuario"
              >
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {user?.name || "Usuario"}
                </Typography>
                <Avatar sx={{
                  bgcolor: "#8B5CF6",
                  width: 36,
                  height: 36,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 8px #8B5CF6AA',
                }}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                  sx: {
                    borderRadius: 1,
                    minWidth: 180,
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: "0 4px 24px #8B5CF633",
                  },
                }}
              >
                <MenuItem disabled>{user?.email}</MenuItem>
                <MenuItem
                  onClick={() => {
                    logout();
                    handleClose();
                  }}
                  sx={{ color: "#E05EFF", fontWeight: 700 }}
                >
                  Cerrar sesión
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} mode={mode} />
        {/* Contenido principal con animación */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isMobile ? 1 : 3,
            width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
            minHeight: "100vh",
            background: theme.palette.background.default,
            transition: 'background 0.5s',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <Toolbar />
          <Fade in={contentVisible} timeout={600}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Outlet />
            </Box>
          </Fade>
          {/* Footer sticky */}
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
              position: 'sticky',
              bottom: 0,
              zIndex: 1100,
            }}
          >
            © {new Date().getFullYear()} Virtual Voices. Todos los derechos reservados.
          </Box>
        </Box>
        {/* Notificaciones visuales (simulado) */}
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