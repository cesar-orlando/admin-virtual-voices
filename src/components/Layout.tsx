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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Sidebar from "./Sidebar";
import { useAuth } from "../hooks/useAuth";
import { getVirtualVoicesTheme } from "../theme/virtualVoicesTheme";
import { ThemeProvider } from "@mui/material/styles";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsIcon from '@mui/icons-material/Settings';
import Loading from './Loading';
import { getCompanyConfig, updateCompanyConfig } from '../api/servicios/aiConfigServices';

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
  const isMobile = useMediaQuery("(max-width:900px)"); // Cambiado a 900px para tablets y móviles
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

  // Estado de empresa
  const [companyConfigOpen, setCompanyConfigOpen] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  const [companyStatuses, setCompanyStatuses] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');

  // Cargar datos reales de la empresa al abrir el modal
  useEffect(() => {
    if (companyConfigOpen) {
      setCompanyLoading(true);
      getCompanyConfig(user.companySlug)
        .then(data => {
          console.log("data company", data)
          setCompanyLogo(data.logoUrl || '');
          setCompanyDisplayName(data.displayName || '');
          setCompanyStatuses(data.statuses || ["Activo", "Inactivo"]);
        })
        .finally(() => setCompanyLoading(false));
    }
  }, [companyConfigOpen, user.companySlug]);

  // Guardar cambios en la base de datos
  const handleSaveCompanyConfig = async () => {
    setCompanyLoading(true);
    try {
      await updateCompanyConfig(user.companySlug, {
        displayName: companyDisplayName,
        logoUrl: companyLogo,
        statuses: companyStatuses
      });
      setCompanyConfigOpen(false);
    } catch (err) {
      alert('Error al guardar la configuración de la empresa.');
    } finally {
      setCompanyLoading(false);
    }
  };

  // Siempre mantener el menú cerrado en móviles/tabletas
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
    // eslint-disable-next-line
  }, [isMobile]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", background: theme.palette.background.default }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { xs: '100%', sm: `calc(100% - ${sidebarHover ? expandedWidth : collapsedWidth}px)` },
            ml: { xs: 0, sm: `${sidebarHover ? expandedWidth : collapsedWidth}px` },
            transition: 'all 0.2s ease-out',
            zIndex: theme.zIndex.drawer - 1,
            background: 'transparent',
            borderBottom: 'none',
            // Quitar el blur de la barra superior
            //backdropFilter: "blur(8px)",
            boxShadow: 'none',
          }}
        >
          <Toolbar
            sx={{
              justifyContent: { xs: "space-between", sm: "flex-end" },
              minHeight: { xs: 56, sm: 72 },
              px: { xs: 2, sm: 3 }, // Aumenta padding horizontal en mobile
            }}
          >
            {/* Botón de menú hamburguesa solo en mobile/tablet */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="Abrir menú"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  mr: 2,
                  display: { xs: "inline-flex", sm: "none" },
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(30,30,40,0.5)'
                    : 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.1)'
                      : 'rgba(139, 92, 246, 0.05)',
                  },
                  p: { xs: 1.2, sm: 1 }, // Padding más grande en mobile para área táctil
                  borderRadius: 2, // Más redondeado en mobile
                  alignSelf: "flex-start",
                }}
              >
                <MenuIcon sx={{ fontSize: 28, color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6' }} />
              </IconButton>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
                background: theme.palette.mode === 'dark'
                  ? 'rgba(30,30,40,0.3)'
                  : 'rgba(255,255,255,0.3)',
                borderRadius: 3,
                p: { xs: 0.5, sm: 1 },
                backdropFilter: "blur(8px)",
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                  : '0 4px 24px rgba(139, 92, 246, 0.05)',
              }}
            >
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
              {/* Configuración de empresa solo para admin */}
              {user.role === 'Administrador' && (
                <Tooltip title="Configuración de empresa">
                  <IconButton
                    color="inherit"
                    onClick={() => setCompanyConfigOpen(true)}
                    aria-label="Configuración de empresa"
                    sx={{
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(30,30,40,0.5)' 
                        : 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(139, 92, 246, 0.1)'
                          : 'rgba(139, 92, 246, 0.05)',
                      },
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 22, color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6' }} />
                  </IconButton>
                </Tooltip>
              )}
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
            p: { xs: 1.5, sm: 3 },
            pt: { xs: 8, sm: 10 },
            width: { xs: '100%', sm: `calc(100% - ${sidebarHover ? expandedWidth : collapsedWidth}px)` },
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
            fontSize: { xs: '1.08rem', sm: '1rem' }, // Tamaño de fuente mayor en mobile
          }}
        >
          <Fade in={contentVisible} timeout={600}>
            <Box
              sx={{
                flex: 1,
                width: '100%',
                position: 'relative',
                px: { xs: 0, sm: 0 },
                fontSize: { xs: '1.08rem', sm: '1rem' }, // Tamaño de fuente mayor en mobile
              }}
            >
              <Outlet />
            </Box>
          </Fade>
          <Box
            component="footer"
            sx={{
              width: '100%',
              textAlign: 'center',
              color: '#BDBDBD',
              fontSize: { xs: 12, sm: 13 },
              fontFamily: 'Montserrat, Arial, sans-serif',
              py: { xs: 1, sm: 2 },
              mt: 'auto',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 1,
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
        {/* Modal de configuración de empresa */}
        <Dialog open={companyConfigOpen} onClose={() => setCompanyConfigOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: '#8B5CF6', fontFamily: 'Montserrat, Arial, sans-serif' }}>
            Configuración de Empresa
          </DialogTitle>
          <DialogContent dividers>
            {companyLoading ? (
              <Loading overlay message="Cargando configuración de empresa..." />
            ) : (
            <Stack spacing={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={companyLogo} sx={{ width: 64, height: 64, border: '2px solid #8B5CF6' }} />
                <Button variant="outlined" component="label" sx={{ color: '#8B5CF6', borderColor: '#8B5CF6' }}>
                  Subir Logo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          if (typeof ev.target?.result === 'string') setCompanyLogo(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
              </Box>
              <TextField
                label="Nombre visible de la empresa"
                value={companyDisplayName}
                onChange={e => setCompanyDisplayName(e.target.value)}
                fullWidth
              />
              <Box>
                <Typography fontWeight={600} mb={1} color="#8B5CF6">Estatus permitidos</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {companyStatuses.map((status, idx) => (
                    <Chip
                      key={status}
                      label={status}
                      color="secondary"
                      onDelete={companyStatuses.length > 2 ? () => setCompanyStatuses(companyStatuses.filter((_, i) => i !== idx)) : undefined}
                      sx={{ mb: 1, fontWeight: 600, background: '#E05EFF11', color: '#8B5CF6' }}
                    />
                  ))}
                </Stack>
                <Box display="flex" gap={1} mt={2}>
                  <TextField
                    label="Nuevo estatus"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    disabled={!newStatus.trim()}
                    onClick={() => {
                      if (newStatus && !companyStatuses.includes(newStatus)) {
                        setCompanyStatuses([...companyStatuses, newStatus]);
                        setNewStatus('');
                      }
                    }}
                    sx={{ background: '#8B5CF6', color: '#fff', fontWeight: 700 }}
                  >
                    Agregar
                  </Button>
                </Box>
              </Box>
            </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompanyConfigOpen(false)} color="secondary" disabled={companyLoading}>Cancelar</Button>
            <Button variant="contained" sx={{ background: '#8B5CF6', fontWeight: 700 }} onClick={handleSaveCompanyConfig} disabled={companyLoading}>
              {companyLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}