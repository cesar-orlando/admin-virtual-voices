import React, { useState } from "react";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { simulateAiResponse } from "../api/simulateAiResponse";
import type { AIConfig, WhatsAppSession } from '../types';

export function AiConfigTab({
  aiConfig,
  setAiConfig,
  aiSaveStatus,
  setAiSaveStatus,
  saveAiConfig,
  sessionData,
}: {
  aiConfig: Partial<AIConfig>;
  setAiConfig: React.Dispatch<React.SetStateAction<Partial<AIConfig>>>;
  aiSaveStatus: string | null;
  setAiSaveStatus: (v: string | null) => void;
  saveAiConfig: (config: Partial<AIConfig>, sessionData: Partial<WhatsAppSession>) => Promise<void>;
  sessionData: Partial<WhatsAppSession>;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'ai', text: string }[]>([]);

  // Simulación simple de respuesta AI
  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(msgs => [...msgs, { from: 'user' as const, text: userMessage }]);
    setChatInput('');
    // Construye el historial actualizado
    const updatedMessages = [...chatMessages, { from: 'user' as const, text: userMessage }];
    const response = await simulateAiResponse(
      updatedMessages,
      {
        _id: aiConfig._id ?? '',
        name: aiConfig.name ?? '',
        welcomeMessage: aiConfig.welcomeMessage ?? '',
        objective: aiConfig.objective ?? '',
        customPrompt: aiConfig.customPrompt ?? '',
        // Opcionales:
        isActive: aiConfig.isActive,
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
      },
      user
    );
    setTimeout(() => {
      setChatMessages(msgs => [...msgs, { from: 'ai' as const, text: response.message }]);
    }, 700);
  }

  return (
    <Box width="100%" maxWidth={500} mx="auto" display="flex" flexDirection="column" alignItems="center">
      <h1 style={{ textAlign: 'center' }}>Configuración de AI</h1>
      <form
        onSubmit={async e => {
          e.preventDefault();
          setAiSaveStatus(null);
          try {
            await saveAiConfig({
              ...aiConfig,
              welcomeMessage: aiConfig.welcomeMessage,
              customPrompt: aiConfig.customPrompt,
            }, sessionData);
            setAiSaveStatus('Configuración guardada correctamente.');
          } catch (err: unknown) {
            setAiSaveStatus(err instanceof Error ? err.message : 'Error al guardar la configuración de AI.');
          }
        }}
        style={{ width: '100%' }}
      >
        <TextField
          label="Nombre"
          value={aiConfig?.name || ''}
          onChange={e =>
            setAiConfig((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Saludo"
          value={aiConfig?.welcomeMessage || ''}
          onChange={e =>
            setAiConfig((prev) => ({
              ...prev,
              welcomeMessage: e.target.value,
            }))
          }
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Objetivo"
          value={aiConfig?.objective || ''}
          onChange={e =>
            setAiConfig((prev) => ({
              ...prev,
              objective: e.target.value,
            }))
          }
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Contexto"
          value={aiConfig?.customPrompt || ''}
          onChange={e =>
            setAiConfig((prev) => ({
              ...prev,
              customPrompt: e.target.value,
            }))
          }
          fullWidth
          margin="normal"
          multiline
          minRows={3}
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Guardar configuración
        </Button>
        {aiSaveStatus && (
          <Box mt={2} textAlign="center" color={aiSaveStatus.startsWith('Error') ? 'red' : 'green'}>
            {aiSaveStatus}
          </Box>
        )}
      </form>
      <Button type="button" variant="contained" color="secondary" fullWidth sx={{ mt: 2 }}>
        Simular llamada AI
      </Button>
      <Button
        type="button"
        variant="contained"
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => setChatOpen(true)}
      >
        Simular Chat
      </Button>

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