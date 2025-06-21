import { useEffect, useState } from "react";
import {
  Box, Button, TextField, Stack, Card, Typography, IconButton, Dialog, DialogContent, Snackbar, Alert, CircularProgress, useTheme, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { QRCodeCanvas } from "qrcode.react";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
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
  const [loading, setLoading] = useState(false);
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
        case 'ready':
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
    const sanitizedSessionName = sessionName.replace(/\s+/g, "_");
    requestNewQr(sanitizedSessionName, user)
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

  return (
    <Box sx={{ width: '100vw', height: '100vh', background: theme.palette.background.default, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0 }}>
      <Box sx={{ maxWidth: 600, width: '100%', mt: 4 }}>
        <Card sx={{ p: 4, mb: 4, background: theme.palette.background.paper, boxShadow: '0 8px 32px 0 rgba(59,130,246,0.10)' }}>
          <Typography variant="h5" align="center" gutterBottom>
            Solicita y escanea tu QR de WhatsApp
          </Typography>
          <Stack spacing={2} alignItems="center">
            <Stack direction="row" spacing={2} width="100%">
              <TextField
                label="Nombre de la sesión"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleRequestQr}
                disabled={!sessionName || qrLoading}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Solicitar QR
              </Button>
            </Stack>
            {error && <Typography color="error">Error: {error}</Typography>}
          </Stack>
        </Card>
        <Card sx={{ p: 4, background: theme.palette.background.paper, boxShadow: '0 8px 32px 0 rgba(139,92,246,0.08)' }}>
          <Typography variant="h5" align="center" gutterBottom>
            Whatsapps Registrados
          </Typography>
          <Stack spacing={2} alignItems="center" width="100%">
            {sessions.map((session: WhatsAppSession, idx: number) => (
              <Card
                key={idx}
                sx={{
                  p: 2,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  background: theme.palette.background.default
                }}
              >
                <Typography variant="body1" sx={{ mr: 4 }}>{session.name}</Typography>
                <FormControl fullWidth size="small" sx={{ minWidth: 180, mr: 4 }}>
                  <InputLabel id={`ai-config-label-${idx}`}>Selecciona configuración</InputLabel>
                  <Select
                    labelId={`ai-config-label-${idx}`}
                    value={session.IA?.id}
                    label="Selecciona configuración"
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
                    {aiConfigs.map(cfg => (
                      <MenuItem key={cfg._id} value={cfg._id}>
                        {cfg.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body1" sx={{ mr: 4 }}>{session.user?.name}</Typography>
                <Box>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={async () => {
                      updateSession(session, user)
                      .then(async () => {
                        const fetchedSessions = await fetchSessions(user);
                        setSessions(fetchedSessions);
                      });
                    }}
                  >
                  <SaveIcon />
                  </IconButton>
                </Box>
                <Box>
                  <IconButton
                    color="error"
                    size="small"
                    sx={{ mr: 2 }}
                    onClick={async () => {
                      deleteSession(session,user)
                      .then(async () => {
                        const fetchedSessions = await fetchSessions(user);
                        setSessions(fetchedSessions);
                      });
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Stack>
        </Card>
      </Box>
      {/* Modal para QR */}
      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Escanea este QR con WhatsApp</Typography>
          {qrLoading && <CircularProgress sx={{ my: 4 }} />}
          {qr && <QRCodeCanvas value={qr} size={256} />}
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
            Asegúrate de que tu teléfono tenga conexión a internet y WhatsApp esté abierto.
          </Typography>
        </DialogContent>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}