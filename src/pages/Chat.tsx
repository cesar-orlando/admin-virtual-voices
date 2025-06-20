import React, { useEffect, useState } from 'react'
import { fetchMessages } from '../api/fetchMessages'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Stack
} from '@mui/material'
import type { UserProfile } from '../types'
import io from "socket.io-client";

const user = JSON.parse(localStorage.getItem('user') || '{}') as UserProfile

type Message = {
  id: string
  phone: string
  messages: { body: string, direction: string }[]
  // add other properties if needed
}

export function ChatsTab() {
  const [companyData, setCompany] = useState<Message[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<{ phone: string, messages: { body: string, direction: string }[] } | null>(null)
  
  useEffect(() => {
    const socket = io("http://localhost:3001"); // Use your backend URL

    // Listen for new whatsapp-message events
    socket.on(`whatsapp-message-${user.c_name}`, (newMessageData) => {
      setCompany((prev) => {
        const idx = prev.findIndex(m => m.id === newMessageData.id);
        if (idx !== -1) {
          // Update existing conversation
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, ...newMessageData.messages]
          };
          return updated;
        } else {
          // Add new conversation
          return [...prev, newMessageData];
        }
      });
    });

    // Optionally, fetch initial messages
    fetchMessages(user).then(setCompany);

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect();
    };
  }, [user.c_name, user.id])

  const handleShowAllMessages = (phone: string, messages: { body: string, direction: string }[]) => {
    setSelectedMessages({ phone, messages })
    setOpenDialog(true)
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numero</TableCell>
              <TableCell>Ultimo mensaje</TableCell>
              <TableCell>Compañia</TableCell>
              <TableCell align="center">Ver todos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companyData.length > 0 ? (
              companyData.map((messages, idx) => (
                <TableRow key={idx}>
                  <TableCell>{messages.phone.split('@')[0]}</TableCell>
                  <TableCell>
                    {messages.messages.length > 0
                      ? messages.messages[messages.messages.length - 1].body
                      : 'Sin mensajes'}
                  </TableCell>
                  <TableCell>{user.c_name}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleShowAllMessages(messages.phone.split('@')[0], messages.messages)}
                      disabled={messages.messages.length === 0}
                    >
                      Ver todos
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Dialog to show all messages */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Mensajes de {selectedMessages?.phone.split('@')[0]}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {selectedMessages?.messages.length ? (
              selectedMessages.messages.map((msg, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  justifyContent={msg.direction === 'inbound' ? 'flex-start' : 'flex-end'}
                >
                  <Box
                    sx={{
                      bgcolor: msg.direction === 'inbound' ? 'grey.200' : 'primary.main',
                      color: msg.direction === 'inbound' ? 'text.primary' : 'primary.contrastText',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2">{msg.body}</Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">Sin mensajes</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}