import React from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { QRCodeCanvas } from "qrcode.react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

interface Props {
  qr: string;
  sessionName: string;
  setSessionName: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  requestNewQr: (sessionName: string) => Promise<void>;
  setQr: (v: string) => void;
  sessions:any;
  setSessions: (v: any) => void;
}

export function WhatsappTab({
  qr, sessionName, setSessionName, loading, setLoading, error, setError, requestNewQr, setQr, sessions, setSessions
}: Props) {
  return (
    <div>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Escanea este QR con WhatsApp
        </Typography>
        <Stack spacing={2} alignItems="center">
          {qr && <QRCodeCanvas value={qr} size={256} />}
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
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  await requestNewQr(sessionName);
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setQr("");
                  setSessions((prevSessions: any[]) => [...prevSessions, { name: sessionName }]);
                  setLoading(false);
                }
              }}
              disabled={!sessionName || loading}
            >
              Solicitar nuevo QR
            </Button>
          </Stack>
          {loading && <span>Cargando...</span>}
          {error && <span style={{ color: 'red' }}>Error: {error}</span>}
        </Stack>
        <Stack>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
            Asegúrate de que tu teléfono tenga conexión a internet y WhatsApp esté abierto.
          </Typography>
        </Stack>
      </Paper>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Whatsapps Registrados:
        </Typography>
        <Stack spacing={2} alignItems="center" width="100%">
          {sessions.map((session: any, idx: number) => (
            <Paper
              key={idx}
              sx={{
                p: 2,
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="body1">{session.name}</Typography>
              <div>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => {
                    // Lógica para editar la sesión
                    alert(`Editar sesión: ${session.name}`);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => {
                    // Lógica para borrar la sesión
                    alert(`Borrar sesión: ${session.name}`);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </div>
    
  );
}