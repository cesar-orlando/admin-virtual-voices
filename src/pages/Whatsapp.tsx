import { useEffect, useState, useRef } from "react";
import {
  Box, Button, TextField, Stack, Card, Typography, IconButton, Dialog, DialogContent, Snackbar, Alert, CircularProgress, useTheme, MenuItem, Select, FormControl, InputLabel, Chip, Avatar, Divider, Grid, Paper, LinearProgress
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
    const socket = io("http://localhost:3001");
    
    // Evento QR: mostrar QR y abrir modal
    socket.on(`whatsapp-qr-${user.companySlug}-${user.id}`, (data) => {
      setQr(data);
      setShowQR(true);
      setQrLoading(false);
      setShowFullscreenLoading(false);
      setLoadingMessage("Escanea el código QR");
      setLoadingPercent(0);
      setQrModalOpen(true); // ABRIR MODAL SOLO CUANDO LLEGA EL QR
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
      const fetchedSessions = await fetchSessions(user);
      setSessions(fetchedSessions);
      const data = await fetchAllAiConfigs(user);
      setAiConfigs(data);
      setLoading(false);
    };
    loadData();

    return () => {
      socket.disconnect();
    };
  }, [user.companySlug, user.id]);

  // Animación de mensajes y puntos suspensivos
  useEffect(() => {
    if (showFullscreenLoading) {
      let msgIdx = 0;
      loadingMsgInterval.current = setInterval(() => {
        msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
        setDynamicLoadingMsg(LOADING_MESSAGES[msgIdx]);
      }, 6000);
      dotInterval.current = setInterval(() => {
        setDotCount(prev => (prev % 3) + 1);
      }, 500);
    } else {
      setDynamicLoadingMsg(LOADING_MESSAGES[0]);
      setDotCount(1);
      if (loadingMsgInterval.current) clearInterval(loadingMsgInterval.current);
      if (dotInterval.current) clearInterval(dotInterval.current);
    }
    return () => {
      if (loadingMsgInterval.current) clearInterval(loadingMsgInterval.current);
      if (dotInterval.current) clearInterval(dotInterval.current);
    };
  }, [showFullscreenLoading]);

  // Modal QR: Solicitar y mostrar QR
  const handleRequestQr = async () => {
    setQrLoading(true);
    setShowFullscreenLoading(true);
    setShowQR(false);
    setQr("");
    setError(null);
    setLoadingMessage("Generando código QR...");
    setLoadingPercent(0);
    try {
      const sanitizedSessionName = sessionName.replace(/\s+/g, "_");
      requestNewQr(sanitizedSessionName, user)
        .then(async () => {
          const fetchedSessions = await fetchSessions(user);
          setSessions(fetchedSessions)
        });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setQrLoading(false);
      setShowFullscreenLoading(false);
      setQrModalOpen(false);
      setLoadingMessage("");
      setLoadingPercent(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'pending': return 'warning';
      case 'disconnected': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'pending': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loading message="Cargando WhatsApp Manager..." />
      </Box>
    );
  }

  return (
    <>
      {/* Fullscreen Loading Overlay - SIEMPRE fuera del main y del Dialog */}
      {showFullscreenLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 20000,
            background: 'linear-gradient(135deg, #1e1e28 0%, #8B5CF6 100%)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              background: 'rgba(34, 34, 51, 0.92)',
              borderRadius: 6,
              boxShadow: '0 8px 40px 0 rgba(139,92,246,0.25)',
              px: { xs: 3, sm: 6 },
              py: { xs: 4, sm: 6 },
              minWidth: 340,
              maxWidth: '90vw',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Box
              component="img"
              src={Logo}
              alt="Virtual Voices Logo"
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                filter: 'drop-shadow(0 4px 24px #8B5CF6cc)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                p: 2,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontFamily: 'Montserrat, Arial, sans-serif',
                letterSpacing: 1,
                mb: 1.5,
                textAlign: 'center',
                textShadow: '0 2px 12px #8B5CF655',
                lineHeight: 1.2,
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
                    height: 10,
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
                    height: 10,
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
                  fontSize: '1.1em',
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
          width: '90vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, flexShrink: 0 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
              fontFamily: 'Montserrat, Arial, sans-serif',
            }}
          >
            WhatsApp Manager
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
          >
            Gestiona tus sesiones de WhatsApp y configuraciones de IA de manera profesional
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', px:3, pb: 3, display: 'flex' }}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* QR Request Section */}
            <Grid item xs={12} md={4} sx={{ height: '100%' }}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                    : '0 4px 24px rgba(139, 92, 246, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      mr: 2,
                      background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      width: 48,
                      height: 48,
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <QrCodeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Nueva Sesión
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Conecta un nuevo WhatsApp
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={2.5}>
                  <TextField
                    label="Nombre de la sesión"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    fullWidth
                    placeholder="Ej: Ventas Principal"
                  />
                  <Button
                    variant="contained"
                    onClick={handleRequestQr}
                    disabled={!sessionName || qrLoading}
                    startIcon={<QrCodeIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      borderRadius: 2,
                      backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
                      '&:hover': {
                        backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                      },
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    {qrLoading ? 'Generando QR...' : 'Solicitar QR'}
                  </Button>
                  {error && <Alert severity="error">{error}</Alert>}
                </Stack>

                {/* Stats */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Estadísticas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main" fontWeight={700}>
                        {sessions.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sesiones
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary.main" fontWeight={700}>
                        {aiConfigs.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configs IA
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sessions List Section */}
            <Grid item xs={12} md={8} sx={{ height: '100%', overflowY: 'auto' }}>
              <Paper 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                    : '0 4px 24px rgba(139, 92, 246, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      mr: 2,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      width: 48,
                      height: 48,
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <WhatsAppIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Sesiones Registradas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sessions.length} sesión(es) • {sessions.filter(s => s.status === 'connected').length} conectada(s)
                    </Typography>
                  </Box>
                </Box>

                {sessions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <WhatsAppIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay sesiones registradas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
                            p: 2.5,
                            borderRadius: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.3s ease-out',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(139,92,246,0.15)'}`,
                              borderColor: '#8B5CF6'
                            },
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 1.5, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                                  <WhatsAppIcon fontSize="small"/>
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {session.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {session.user?.name || 'No asignado'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip 
                                label={getStatusText(session.status || 'disconnected')}
                                color={getStatusColor(session.status || 'disconnected') as any}
                                size="small"
                                sx={{ fontWeight: 600, height: 24, fontSize: '0.7rem' }}
                              />
                            </Box>
                            
                            <FormControl fullWidth size="small">
                              <InputLabel>Configuración IA</InputLabel>
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
                              >
                                <MenuItem value=""><em>Sin config</em></MenuItem>
                                {aiConfigs.map(cfg => (
                                  <MenuItem key={cfg._id} value={cfg._id}>{cfg.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ mt: 2, alignSelf: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                updateSession(session, user).then(() => {
                                  setSnackbar({ open: true, message: 'Sesión actualizada', severity: 'success' });
                                });
                              }}
                            >
                              <SaveIcon />
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
                            >
                              <DeleteIcon />
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
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
            },
          }}
        >
          <DialogContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 2, width: 64, height: 64, background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)' }}>
              <QrCodeIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Escanea el código QR
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Abre WhatsApp en tu teléfono para conectar la sesión
            </Typography>
            
            {/* QR Code Display - Solo se muestra cuando showQR es true */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: 280,
              borderRadius: 2,
              p: 2,
              backgroundColor: 'white',
              mb: 3
            }}>
              {showQR && qr ? <QRCodeCanvas value={qr} size={256} /> : null}
            </Box>
            
            <Button onClick={() => setQrModalOpen(false)} sx={{ color: '#8B5CF6' }}>
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
            sx={{ borderRadius: 2, backgroundColor: snackbar.severity === 'success' ? '#8B5CF6' : undefined }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}