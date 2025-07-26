import { useEffect, useState, useRef } from "react";
import {
  Box, Button, TextField, Stack, Card, Typography, IconButton, Dialog, DialogContent, Snackbar, Alert, CircularProgress, useTheme, useMediaQuery, MenuItem, Select, FormControl, InputLabel, Chip, Avatar, Divider, Grid, Paper, LinearProgress
} from '@mui/material';
import { QRCodeCanvas } from "qrcode.react";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { requestNewQr, fetchSessions, fetchAllAiConfigs, updateSession, deleteSession } from "../api/servicios";
import io from "socket.io-client";
import type { UserProfile, WhatsAppSession, AIConfig } from '../types';
import Loading from '../components/Loading';
import Logo from '../assets/VirtualVoice.svg';

const LOADING_MESSAGES = [
  "Inicializando sesión...",
  "Cargando tus chats...",
  "Sincronizando mensajes...",
  "Esto puede tardar unos minutos si tienes muchos chats",
  "¡Gracias por tu paciencia!"
];

export default function Whatsapp() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
  const [qr, setQr] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [showFullscreenLoading, setShowFullscreenLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dynamicLoadingMsg, setDynamicLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [dotCount, setDotCount] = useState(1);
  const loadingMsgInterval = useRef<NodeJS.Timeout | null>(null);
  const dotInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    
    console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);
    console.log('User companySlug:', user.companySlug);
    console.log('User id:', user.id);
    console.log('Listening for QR event:', `whatsapp-qr-${user.companySlug}-${user.id}`);
    
    // Debug: eventos de conexión
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    // Evento QR: mostrar QR y abrir modal
    socket.on(`whatsapp-qr-${user.companySlug}-${user.id}`, (data) => {
      console.log('QR event received:', data);
      setQr(data);
      setShowQR(true);
      setQrLoading(false);
      setShowFullscreenLoading(false);
      setLoadingMessage("Escanea el código QR");
      setLoadingPercent(0);
      setQrModalOpen(true); // ABRIR MODAL SOLO CUANDO LLEGA EL QR
    });
    
    // Debug: escuchar el evento específico del backend
    socket.on('whatsapp-qr-grupo-milkasa-686bcf967c3d33781b55c1bb', (data) => {
      console.log('Backend QR event received:', data);
      setQr(data);
      setShowQR(true);
      setQrLoading(false);
      setShowFullscreenLoading(false);
      setLoadingMessage("Escanea el código QR");
      setLoadingPercent(0);
      setQrModalOpen(true);
    });

    // Evento de estado
    socket.on(`whatsapp-status-${user.companySlug}-${user.id}`, async (data) => {
      const { status, session, message, loadingPercent: percent } = data;
      const fetchedSessions = await fetchSessions(user);
      setSessions(fetchedSessions);
      
      switch(status) {
        case 'waiting_qr':
        case 'qr_ready':
          setShowQR(true);
          setShowFullscreenLoading(false);
          setLoadingMessage("Escanea el código QR");
          setLoadingPercent(0);
          setQrModalOpen(true);
          break;
        case 'qr_scanned':
        case 'authenticated':
          setShowQR(false);
          setShowFullscreenLoading(true);
          setLoadingMessage(message || "Cargando WhatsApp...");
          setLoadingPercent(percent || 0);
          setQrModalOpen(false);
          if (status === 'authenticated') {
            setSnackbar({ open: true, message: '¡QR escaneado exitosamente!', severity: 'success' });
          }
          break;
        case 'ready':
          setShowQR(false);
          setShowFullscreenLoading(true);
          setLoadingMessage(message || "WhatsApp conectado y listo para usar");
          setLoadingPercent(percent || 100);
          setQrModalOpen(false);
          setSnackbar({ open: true, message: 'WhatsApp conectado y listo para usar', severity: 'success' });
          break;
        case 'connected':
          setShowQR(false);
          setShowFullscreenLoading(false);
          setQrModalOpen(false);
          setSessionName("");
          setQr("");
          setQrLoading(false);
          setLoadingMessage("");
          setLoadingPercent(0);
          setSnackbar({ open: true, message: `¡WhatsApp ${session || 'conectado'} y listo!`, severity: 'success' });
          break;
        case 'disconnected':
        case 'error':
          setShowQR(false);
          setShowFullscreenLoading(false);
          setQrLoading(false);
          setLoadingMessage("");
          setLoadingPercent(0);
          setQrModalOpen(false);
          setSnackbar({ open: true, message: `Error: ${message || 'Sesión terminada'}`, severity: 'error' });
          break;
        default:
          break;
      }
    });

    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedSessions, fetchedAiConfigs] = await Promise.all([
          fetchSessions(user),
          fetchAllAiConfigs(user)
        ]);
        setSessions(fetchedSessions);
        setAiConfigs(fetchedAiConfigs);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      socket.disconnect();
      if (loadingMsgInterval.current) clearInterval(loadingMsgInterval.current);
      if (dotInterval.current) clearInterval(dotInterval.current);
    };
  }, []);

  // Animación de los mensajes de carga y puntos
  useEffect(() => {
    if (showFullscreenLoading) {
      loadingMsgInterval.current = setInterval(() => {
        setDynamicLoadingMsg(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
        });
      }, 3000);

      dotInterval.current = setInterval(() => {
        setDotCount(prev => (prev % 3) + 1);
      }, 800);

      return () => {
        if (loadingMsgInterval.current) clearInterval(loadingMsgInterval.current);
        if (dotInterval.current) clearInterval(dotInterval.current);
      };
    }
  }, [showFullscreenLoading]);

  const handleRequestQr = async () => {
    try {
      setQrLoading(true);
      setError(null);
      setShowFullscreenLoading(true);
      setLoadingMessage("Preparando conexión...");
      setLoadingPercent(0);
      await requestNewQr(sessionName, user);
      setSnackbar({ open: true, message: 'Código QR solicitado', severity: 'success' });
    } catch (err) {
      console.error('Error requesting QR:', err);
      setError('Error al solicitar el código QR');
      setQrLoading(false);
      setShowFullscreenLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      case 'waiting_qr': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'disconnected': return 'Desconectado';
      case 'waiting_qr': return 'Esperando QR';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return <Loading message="Cargando WhatsApp Manager..." />;
  }

  return (
    <>
      {/* Fullscreen Loading Component - Aparece cuando se solicita QR o autenticación */}
      {showFullscreenLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1e1e28',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              backgroundImage: 'radial-gradient(circle, #E05EFF 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              animation: 'moveDots 20s linear infinite',
              opacity: 0.1,
              '@keyframes moveDots': {
                '0%': { transform: 'translate(0, 0)' },
                '100%': { transform: 'translate(-50px, -50px)' },
              },
            }}
          />
          <Box
            sx={{
              textAlign: 'center',
              zIndex: 10,
              maxWidth: { xs: '90%', md: 400 },
              px: { xs: 2, md: 0 }
            }}
          >
            <img 
              src={Logo} 
              alt="Virtual Voice" 
              style={{ 
                width: isMobile ? 120 : 180, 
                height: 'auto', 
                marginBottom: 24, 
                filter: 'drop-shadow(0 4px 16px rgba(224, 94, 255, 0.3))' 
              }} 
            />
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                color: '#fff',
                fontWeight: 700,
                mb: 2,
                fontFamily: 'Montserrat, Arial, sans-serif',
                letterSpacing: 1,
                textAlign: 'center',
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {dynamicLoadingMsg}
              <Box component="span" sx={{ color: '#8B5CF6', fontWeight: 900, fontSize: '1.5em', ml: 0.5, verticalAlign: 'middle', letterSpacing: 0 }}>
                {'.'.repeat(dotCount)}
              </Box>
            </Typography>
            {/* Barra de progreso justo debajo del mensaje */}
            <Box sx={{ width: '100%', mt: 2 }}>
              {loadingPercent > 0 ? (
                <LinearProgress 
                  variant="determinate" 
                  value={loadingPercent} 
                  sx={{
                    height: { xs: 8, md: 10 },
                    borderRadius: 5,
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #E05EFF 0%, #8B5CF6 100%)',
                      borderRadius: 5,
                    }
                  }}
                />
              ) : (
                <LinearProgress 
                  sx={{
                    height: { xs: 8, md: 10 },
                    borderRadius: 5,
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #E05EFF 0%, #8B5CF6 100%)',
                      borderRadius: 5,
                    }
                  }}
                />
              )}
            </Box>
            {/* Porcentaje visible y elegante */}
            {loadingPercent > 0 && (
              <Typography
                variant="body1"
                sx={{
                  mt: 1.5,
                  color: '#8B5CF6',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', md: '1.1em' },
                  textAlign: 'center',
                  letterSpacing: 1,
                  textShadow: '0 2px 8px #1e1e28',
                }}
              >
                {loadingPercent}% completado
              </Typography>
            )}
            {/* Mensaje motivacional extra */}
            <Typography
              variant="body2"
              sx={{
                mt: 2.5,
                color: '#bdbdfc',
                fontWeight: 400,
                textAlign: 'center',
                fontStyle: 'italic',
                letterSpacing: 0.5,
                opacity: 0.85,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              No cierres esta ventana, estamos preparando todo para ti 🚀
            </Typography>
          </Box>
        </Box>
      )}

      <Box 
        component="main"
        sx={{
          width: '100%',
          minHeight: { xs: '100vh', md: '80vh' },
          height: { xs: '100%', md: '80vh' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: { xs: 2, md: 3 }, 
          flexShrink: 0 
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: { xs: '1.5rem', md: '2.125rem' }
            }}
          >
            WhatsApp Manager
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Gestiona tus sesiones de WhatsApp y configuraciones de IA de manera profesional
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden', 
          px: { xs: 2, md: 3 }, 
          pb: { xs: 2, md: 3 }, 
          display: 'flex' 
        }}>
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ height: '100%' }}>
            {/* QR Request Section */}
            <Grid item xs={12} md={4} sx={{ height: '100%' }}>
              <Paper 
                sx={{ 
                  p: { xs: 2, md: 3 }, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: { xs: 2, md: 3 },
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                    : '0 4px 24px rgba(139, 92, 246, 0.05)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: { xs: 2, md: 3 } 
                }}>
                  <Avatar 
                    sx={{ 
                      mr: { xs: 1.5, md: 2 },
                      background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <QrCodeIcon fontSize={isMobile ? "small" : "medium"} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                    >
                      Nueva Sesión
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    >
                      Conecta un nuevo WhatsApp
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={{ xs: 2, md: 2.5 }}>
                  <TextField
                    label="Nombre de la sesión"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    placeholder="Ej: Ventas Principal"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleRequestQr}
                    disabled={!sessionName || qrLoading}
                    startIcon={<QrCodeIcon fontSize={isMobile ? "small" : "medium"} />}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      py: { xs: 1.2, md: 1.5 },
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      borderRadius: 2,
                      backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
                      '&:hover': {
                        backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                        transform: { xs: 'scale(1.02)', md: 'translateY(-2px)' },
                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                      },
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    {qrLoading ? 'Generando QR...' : 'Solicitar QR'}
                  </Button>
                  {error && <Alert severity="error" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{error}</Alert>}
                </Stack>

                {/* Stats */}
                <Divider sx={{ my: { xs: 2, md: 3 } }} />
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  fontWeight={600} 
                  gutterBottom 
                  sx={{ 
                    mb: 2,
                    fontSize: { xs: '1.125rem', md: '1.25rem' }
                  }}
                >
                  Estadísticas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ 
                      p: { xs: 1.5, md: 2 }, 
                      textAlign: 'center', 
                      borderRadius: 2 
                    }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="success.main" 
                        fontWeight={700}
                        sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                      >
                        {sessions.length}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        Sesiones
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ 
                      p: { xs: 1.5, md: 2 }, 
                      textAlign: 'center', 
                      borderRadius: 2 
                    }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="primary.main" 
                        fontWeight={700}
                        sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                      >
                        {aiConfigs.length}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        Configs IA
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sessions List Section */}
            <Grid item xs={12} md={8} sx={{ 
              height: '100%', 
              overflowY: 'auto'
            }}>
              <Paper 
                sx={{ 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: { xs: 2, md: 3 },
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                    : '0 4px 24px rgba(139, 92, 246, 0.05)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Avatar 
                    sx={{ 
                      mr: { xs: 1.5, md: 2 },
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <WhatsAppIcon fontSize={isMobile ? "small" : "medium"} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                    >
                      Sesiones Registradas
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    >
                      {sessions.length} sesión(es) • {sessions.filter(s => s.status === 'connected').length} conectada(s)
                    </Typography>
                  </Box>
                </Box>

                {sessions.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: { xs: 4, md: 8 } 
                  }}>
                    <WhatsAppIcon sx={{ 
                      fontSize: { xs: 48, md: 64 }, 
                      color: 'text.secondary', 
                      mb: 2, 
                      opacity: 0.5 
                    }} />
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                    >
                      No hay sesiones registradas
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      Crea tu primera sesión para empezar
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {sessions.map((session: WhatsAppSession, idx: number) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Card
                          variant='outlined'
                          sx={{
                            p: { xs: 2, md: 2.5 },
                            borderRadius: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.3s ease-out',
                            '&:hover': {
                              transform: { xs: 'none', md: 'translateY(-4px)' },
                              boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(139,92,246,0.15)'}`,
                              borderColor: '#8B5CF6'
                            },
                          }}
                        >
                          <Box>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start', 
                              mb: 2,
                              flexWrap: { xs: 'wrap', sm: 'nowrap' },
                              gap: { xs: 1, sm: 0 }
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                flex: 1,
                                minWidth: 0
                              }}>
                                <Avatar sx={{ 
                                  mr: 1.5, 
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  width: { xs: 32, md: 40 },
                                  height: { xs: 32, md: 40 }
                                }}>
                                  <WhatsAppIcon fontSize={isMobile ? "small" : "medium"}/>
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography 
                                    variant="subtitle1" 
                                    fontWeight={600}
                                    sx={{ 
                                      fontSize: { xs: '1rem', md: '1.125rem' },
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {session.name}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'block',
                                      fontSize: { xs: '0.7rem', md: '0.75rem' }
                                    }}
                                  >
                                    {session.user?.name || 'No asignado'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip 
                                label={getStatusText(session.status || 'disconnected')}
                                color={getStatusColor(session.status || 'disconnected') as any}
                                size="small"
                                sx={{ 
                                  fontWeight: 600, 
                                  height: { xs: 20, md: 24 }, 
                                  fontSize: { xs: '0.6rem', md: '0.7rem' },
                                  flexShrink: 0
                                }}
                              />
                            </Box>
                            
                            <FormControl fullWidth size={isMobile ? "small" : "small"}>
                              <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                                Configuración IA
                              </InputLabel>
                              <Select
                                value={session.IA?.id || ''}
                                label="Configuración IA"
                                onChange={e => {
                                  const aiConfigSelected = aiConfigs.find(cfg => cfg._id === e.target.value);
                                  setSessions(prev =>
                                    prev.map((s, i) =>
                                      i === idx
                                        ? {
                                            ...s,
                                            IA: aiConfigSelected
                                              ? { id: aiConfigSelected._id, name: aiConfigSelected.name }
                                              : undefined
                                          }
                                        : s
                                    )
                                  );
                                }}
                                sx={{
                                  '& .MuiSelect-select': {
                                    fontSize: { xs: '0.875rem', md: '1rem' }
                                  }
                                }}
                              >
                                <MenuItem value=""><em>Sin config</em></MenuItem>
                                {aiConfigs.map(cfg => (
                                  <MenuItem key={cfg._id} value={cfg._id}>{cfg.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          
                          <Stack 
                            direction="row" 
                            spacing={1} 
                            sx={{ 
                              mt: 2, 
                              alignSelf: 'flex-end' 
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                updateSession(session, user).then(() => {
                                  setSnackbar({ open: true, message: 'Sesión actualizada', severity: 'success' });
                                });
                              }}
                              sx={{ 
                                fontSize: { xs: 18, md: 20 }
                              }}
                            >
                              <SaveIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                            
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm(`Eliminar sesión "${session.name}"?`)) {
                                  deleteSession(session._id, user).then(async () => {
                                    setSnackbar({ open: true, message: 'Sesión eliminada', severity: 'success' });
                                    const fetchedSessions = await fetchSessions(user);
                                    setSessions(fetchedSessions);
                                  });
                                }
                              }}
                              sx={{ 
                                fontSize: { xs: 18, md: 20 }
                              }}
                            >
                              <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* QR Modal */}
        <Dialog 
          open={qrModalOpen} 
          onClose={() => setQrModalOpen(false)} 
          maxWidth="xs"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, md: 3 },
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
            },
          }}
        >
          <DialogContent sx={{ 
            p: { xs: 3, md: 4 }, 
            textAlign: 'center' 
          }}>
            <Avatar sx={{ 
              mx: 'auto', 
              mb: 2, 
              width: { xs: 56, md: 64 }, 
              height: { xs: 56, md: 64 }, 
              background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)' 
            }}>
              <QrCodeIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
            </Avatar>
            
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight={600} 
              gutterBottom
              sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
            >
              Escanea el código QR
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              Abre WhatsApp en tu teléfono para conectar la sesión
            </Typography>
            
            {/* QR Code Display - Solo se muestra cuando showQR es true */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: { xs: 220, md: 280 },
              borderRadius: 2,
              p: 2,
              backgroundColor: 'white',
              mb: 3
            }}>
              {showQR && qr ? (
                <QRCodeCanvas 
                  value={qr} 
                  size={isMobile ? 200 : 256} 
                />
              ) : null}
            </Box>
            
            <Button 
              onClick={() => setQrModalOpen(false)} 
              sx={{ 
                color: '#8B5CF6',
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
              size={isMobile ? "medium" : "large"}
            >
              Cerrar
            </Button>
          </DialogContent>
        </Dialog>

        {/* Snackbar */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            elevation={6} 
            variant="filled" 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ 
              borderRadius: 2, 
              backgroundColor: snackbar.severity === 'success' ? '#8B5CF6' : undefined,
              fontSize: { xs: '0.875rem', md: '1rem' },
              minWidth: { xs: 280, md: 320 }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}