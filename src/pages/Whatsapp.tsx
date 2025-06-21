import { useEffect, useState } from "react";
import {
  Box, Button, TextField, Stack, Card, Typography, IconButton, Dialog, DialogContent, Snackbar, Alert, CircularProgress, useTheme, MenuItem, Select, FormControl, InputLabel, Chip, Avatar, Divider, Grid, Paper
} from '@mui/material';
import { QRCodeCanvas } from "qrcode.react";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { requestNewQr } from "../api/requestNewQr";
import { fetchSessions } from "../api/fetchWhatsappSessions";
import io from "socket.io-client";
import { fetchAllAiConfigs } from "../api/fetchAllAiConfigs";
import { updateSession } from "../api/updateSession";
import type { UserProfile, WhatsAppSession, AIConfig } from '../types';
import { deleteSession } from "../api/deleteSession";

export default function Whatsapp() {
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
  const [qr, setQr] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const socket = io("http://localhost:3001");
    
    // Escuchar el evento de QR
    socket.on(`whatsapp-qr-${user.c_name}-${user.id}`, (data) => {
      setQr(data);
      setQrLoading(false);
    });

    // Escuchar el estado de la conexión
    socket.on(`whatsapp-status-${user.c_name}-${user.id}`, async (data) => {
      switch(data.status) {
        case 'loading':
          setQrLoading(true);
          break;
        case 'authenticated':
          setSnackbar({ 
            open: true, 
            message: '¡QR escaneado exitosamente!', 
            severity: 'success' 
          });
          break;
        case 'connected':
          setQrModalOpen(false);
          setSessionName("");
          setQr("");
          setSnackbar({ 
            open: true, 
            message: `¡WhatsApp ${data.session} conectado y listo!`, 
            severity: 'success' 
          });
          break;
        case 'auth_failure':
          setSnackbar({ 
            open: true, 
            message: `Error de autenticación: ${data.message}`, 
            severity: 'error' 
          });
          setQrModalOpen(false);
          break;
        case 'disconnected':
          setSnackbar({ 
            open: true, 
            message: `WhatsApp ${data.session} desconectado: ${data.message}`, 
            severity: 'error' 
          });
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
  }, [user.c_name, user.id]);

  // Modal QR: Solicitar y mostrar QR
  const handleRequestQr = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQr("");
    setError(null);
    try {
      requestNewQr(sessionName, user)
      .then(async () => {
        const fetchedSessions = await fetchSessions(user);
        setSessions(fetchedSessions)
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setQrLoading(false);
      setQrModalOpen(false);
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
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  return (
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
                                deleteSession(session, user).then(async () => {
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
            {qrLoading ? <CircularProgress /> : qr ? <QRCodeCanvas value={qr} size={256} /> : null}
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
  );
}