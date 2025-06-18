import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, Snackbar, CircularProgress, useTheme, Paper
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { simulateAiResponse } from "../api/simulateAiResponse";
import { updateAiConfig } from "../api/updateAiConfig";
import { fetchAllAiConfigs } from "../api/fetchAllAiConfigs";
import type { AIConfig } from '../types';

export function AiConfigTab(): React.ReactElement {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const theme = useTheme();

  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [aiConfig, setAiConfig] = useState<Partial<AIConfig>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ from: "user" | "ai"; text: string }>>([]);

  const toneOptions = ["Todos", "formal", "persuasivo", "amigable"];
  const objetivoOptions = ["agendar", "responder", "recomendar", "ventas", "soporte"];

  useEffect(() => {
    setIsLoading(true);
    const loadData = async () => {
      const data = await fetchAllAiConfigs(user);
      setAiConfigs(data);
      if (data.length > 0) {
        setSelectedId(data[0]._id);
        setAiConfig(data[0]);
      }
      setIsLoading(false);
    };
    loadData();
  }, [user.c_name, user.id]);

  const handleSelectChange = (event: any) => {
    const config = aiConfigs.find(cfg => cfg._id === event.target.value);
    if (config) {
      setSelectedId(config._id);
      setAiConfig(config);
    }
  };

  async function saveAiConfig(config: Partial<AIConfig>) {
    if (!config._id) return;
    try {
      await updateAiConfig(config as AIConfig, user);
      setSnackbar({ open: true, message: "Configuración guardada correctamente.", severity: "success" });
      // Actualiza lista
      const data = await fetchAllAiConfigs(user);
      setAiConfigs(data);
      const updated = data.find((cfg: AIConfig) => cfg._id === config._id);
      if (updated) setAiConfig(updated);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Error al guardar.", severity: "error" });
    }
  }

  // Simulación simple de respuesta AI
  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(msgs => [...msgs, { from: 'user' as const, text: userMessage }]);
    setChatInput('');
    const updatedMessages: { from: "user" | "ai"; text: string }[] = [
      ...chatMessages,
      { from: 'user', text: userMessage }
    ];
    const response = await simulateAiResponse(
      updatedMessages,
      aiConfig as AIConfig,
      user
    );
    setTimeout(() => {
      setChatMessages(msgs => [...msgs, { from: 'ai', text: response.message }]);
    }, 700);
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
    sx={{
      width: '80vw',
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.palette.background.default,
      overflow: 'auto' // <--- Permite scroll en toda la página
    }}
  >
    <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, letterSpacing: 1 }}>
            Configuración de AI
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setChatOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 600, boxShadow: '0 2px 8px #3B82F633' }}
            >
              Simular Llamada
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setChatOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 600, boxShadow: '0 2px 8px #3B82F633' }}
            >
              Simular Chat
            </Button>
          </Box>
        </Box>
        <Card sx={{ borderRadius: 2, boxShadow: '0 8px 32px 0 rgba(59,130,246,0.10)', background: theme.palette.background.paper, mb: 2 }}>
            <Paper sx={{ p: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Selecciona configuración</InputLabel>
                <Select
                  value={selectedId}
                  label="Selecciona configuración"
                  onChange={handleSelectChange}
                >
                  {aiConfigs.map(cfg => (
                    <MenuItem key={cfg._id} value={cfg._id}>
                      {cfg.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              </Paper>
        </Card>
      </Box>
            <Card
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: '0 8px 32px 0 rgba(139,92,246,0.08)',
                background: theme.palette.background.paper,
                m: 2,
              }}
            >
            <CardContent sx={{ pb: 6 }}>
                {aiConfig && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await saveAiConfig(aiConfig);
                  }}
                  style={{ width: '100%' }}
                >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Nombre"
                value={aiConfig.name || ""}
                onChange={e => setAiConfig(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Mensaje de bienvenida"
                value={aiConfig.welcomeMessage || ""}
                onChange={e => setAiConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                fullWidth
                minRows={2}
                multiline
              />
              <FormControl fullWidth>
                <InputLabel>Tono</InputLabel>
                <Select
                  value={aiConfig.tone || ""}
                  label="Tono"
                  onChange={e => setAiConfig(prev => ({ ...prev, tone: e.target.value }))}
                >
                  {toneOptions.filter(t => t !== "Todos").map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Objetivo</InputLabel>
                <Select
                  value={aiConfig.objective || ""}
                  label="Objetivo"
                  onChange={e => setAiConfig(prev => ({ ...prev, objective: e.target.value }))}
                >
                  {objetivoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Contexto"
                value={aiConfig.customPrompt || ""}
                onChange={e => setAiConfig(prev => ({ ...prev, customPrompt: e.target.value }))}
                fullWidth
                minRows={3}
                multiline
              />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, fontWeight: 600 }}>
                Guardar configuración
              </Button>
            </Box>
          </form>
          )}
        </CardContent>
      </Card>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      {/* Modal de chat AI */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Simulador de Chat AI</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 250 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {chatMessages.length === 0 && (
              <Box color="text.secondary" textAlign="center">Inicia la conversación con la AI…</Box>
            )}
            {chatMessages.map((msg, idx) => (
              <Box
                key={idx}
                alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
                bgcolor={msg.from === 'user' ? 'primary.main' : 'grey.200'}
                color={msg.from === 'user' ? 'primary.contrastText' : 'text.primary'}
                px={2}
                py={1}
                borderRadius={2}
                maxWidth="80%"
              >
                {msg.text}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          <Box display="flex" width="100%" gap={1}>
            <TextField
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Escribe tu mensaje..."
              fullWidth
              size="small"
            />
            <Button variant="contained" onClick={handleSendMessage} disabled={!chatInput.trim()}>
              Enviar
            </Button>
          </Box>
          <Button onClick={() => setChatOpen(false)} color="secondary" sx={{ mt: 1 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}