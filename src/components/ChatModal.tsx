import React from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

type MessageChat = {
  direction: 'inbound' | 'outbound' | 'outbound-api';
  body: string;
  respondedBy?: string;
};

export function ChatModal({ open, onClose, messages }: { open: boolean, onClose: () => void, messages: MessageChat[] }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mensajes del chat</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {messages.map((msg, idx) => {
            const isOutbound = msg.direction === 'outbound' || msg.direction === 'outbound-api';
            const align = isOutbound ? 'flex-end' : 'flex-start';
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: align 
                }}>
                <div style={{
                  background: isOutbound ? '#DCF8C6' : '#eeeeee',
                  color: '#222',
                  borderRadius: 16,
                  padding: '8px 16px',
                  maxWidth: 350,
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  position: 'relative',
                  minWidth: 80,
                  paddingBottom: msg.respondedBy ? 24 : 8
                }}>
                  <div>{typeof msg === 'object' ? String(msg.body) : String(msg)}</div>
                  {msg.respondedBy && (
                    <div style={{
                      fontSize: 11,
                      color: '#888',
                      position: 'absolute',
                      right: 12,
                      bottom: 6,
                    }}>
                      {msg.respondedBy}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>
        <Button onClick={onClose} color="secondary" sx={{ mt: 1, width: '100%' }}>Cerrar</Button>
      </DialogContent>
    </Dialog>
  );
}