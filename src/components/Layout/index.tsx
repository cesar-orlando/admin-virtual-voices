import React, { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Box,
  CssBaseline,
  Toolbar,
  useMediaQuery,
  Fade,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { getVirtualVoicesTheme } from "../../theme/virtualVoicesTheme";
import { AppHeader } from "./AppHeader";
import { NotificationPanel } from "./NotificationPanel";
import Sidebar from "../Sidebar";

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logoutUser } = useAuth();
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

  // Notifications
  const {
    notifications,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  // Handlers
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);
  
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleModeChange = () => setMode(mode === 'dark' ? 'light' : 'dark');
  
  const handleNotificationsToggle = () => setShowNotifications(!showNotifications);

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
        {/* App Header */}
        <AppHeader
          user={user}
          notifications={notifications}
          mode={mode}
          anchorEl={anchorEl}
          onDrawerToggle={handleDrawerToggle}
          onProfileClick={handleProfileClick}
          onMenuClose={handleMenuClose}
          onModeChange={handleModeChange}
          onNotificationsToggle={handleNotificationsToggle}
          onLogout={logoutUser}
          theme={theme}
        />

        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} mode={mode} onHoverChange={() => {}} />

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

        {/* Notification Panel */}
        <NotificationPanel
          notifications={notifications}
          isVisible={showNotifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onRemove={removeNotification}
          onClearAll={clearAll}
          theme={theme}
        />
      </Box>
    </ThemeProvider>
  );
}