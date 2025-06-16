import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { QRCodeCanvas } from "qrcode.react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { requestNewQr } from "../api/requestNewQr";
import { fetchSessions } from "../api/fetchWhatsappSessions";
import io from "socket.io-client";
import { AiConfigTab } from "./AiConfigTab";
import { updateAiConfig } from "../api/updateAiConfig";
import { fetchAllAiConfigs } from "../api/fetchAllAiConfigs";
import { updateSession } from "../api/updateSession";

export function WhatsappTab() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [qr, setQr] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>({
    name: "",
    welcomeMessage: "",
    objective: "",
    customPrompt: ""
  });
  const [sessionData, setSessionData] = useState<any>(null);
  const [aiSaveStatus, setAiSaveStatus] = useState<string | null>(null);
  const [aiConfigs, setAiConfigs] = useState<any[]>([]);
  const [selectedAiId, setSelectedAiId] = useState<string>("");

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on(`whatsapp-qr-${user.c_name}-${user.id}`, (newQr: string) => {
      setQr(newQr);
    });

    fetchSessions(user).then((fetchedSessions) => {
      setSessions(fetchedSessions);
    });

    // Cargar todos los AI configs al montar
    fetchAllAiConfigs(user).then((configs) => {
      setAiConfigs(configs);
      if (configs.length > 0) setSelectedAiId(configs[0]._id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Simulación de guardado de IA
  async function saveAiConfig(config: any, session: any) {
    // Aquí iría tu lógica real de guardado
    await updateAiConfig(config, user);
    await updateSession({ "IA.name": config.name, '_id': session._id }, user);

    // Actualiza localmente la sesión y el AI en el estado
    setSessions(prevSessions =>
      prevSessions.map(s =>
        s._id === session._id
          ? { ...s, IA: { id: config._id, name: config.name } }
          : s
      )
    );
    setAiConfigs(prevConfigs => {
      const exists = prevConfigs.some(cfg => cfg._id === config._id);
      if (exists) {
        // Actualiza el AI existente
        return prevConfigs.map(cfg =>
          cfg._id === config._id ? { ...cfg, ...config } : cfg
        );
      } else {
        // Agrega el nuevo AI
        return [...prevConfigs, config];
      }
    });

    setAiSaveStatus("IA guardada correctamente.");
  }

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
                  await requestNewQr(sessionName, user);
                  setSessions((prevSessions: any[]) => [...prevSessions, { name: sessionName }]);
                } catch (err: any) {
                  setError(err.message);
                } finally {
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
        <Stack direction="row" alignItems="center" mb={2}>
          <Typography variant="h5" align="center" gutterBottom>
            Whatsapps Registrados:
          </Typography>
        </Stack>
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
              <Typography variant="body1">{session.IA?.name}</Typography>
              <Typography variant="body1">{session.user?.name}</Typography>
              <div>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={async () => {
                    const config = aiConfigs.find(cfg => cfg._id === session.IA?.id);
                    const sessionData = sessions[idx];
                    if (config) setAiConfig(config);
                    if (sessionData) setSessionData(sessionData);
                    setAiModalOpen(true);
                    setAiSaveStatus(null);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => {
                    setSessions(sessions.filter((_, i) => i !== idx));
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </Paper>
          ))}
        </Stack>
      </Paper>
      <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <AiConfigTab
            aiConfig={aiConfig}
            setAiConfig={setAiConfig}
            aiSaveStatus={aiSaveStatus}
            setAiSaveStatus={setAiSaveStatus}
            saveAiConfig={saveAiConfig}
            sessionData={sessionData}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiModalOpen(false)} color="secondary">Cancelar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}