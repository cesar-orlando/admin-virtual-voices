import React, { useEffect, useState, useRef } from 'react'
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
  Stack,
  TextField,
  CircularProgress,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import MessageIcon from '@mui/icons-material/Message'
import type { UserProfile } from '../types'
import io from 'socket.io-client'
import { sendMessages } from '../api/sendMessages'
import type { AIConfig } from '../types'
import { fetchAllAiConfigs } from '../api/fetchAllAiConfigs'

const user = JSON.parse(localStorage.getItem('user') || '{}') as UserProfile

type Message = {
  id: string
  phone: string
  messages: { body: string; direction: string }[]
  session: {id: string}
  // add other properties if needed
}

export function ChatsTab() {
  const [companyData, setCompany] = useState<Message[]>([])
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [openChatDialog, setOpenChatDialog] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([])
  const [aiConfig, setAiConfig] = useState<Partial<AIConfig>>({})
  const [selectedId, setSelectedId] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'user' | 'ai'; text: string }>>([])
  const [selectedMessages, setSelectedMessages] = useState<{
    session: {id: string}
    phone: string
    messages: { body: string; direction: string }[]
  } | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const loadData = async () => {
      const data = await fetchAllAiConfigs(user)
      setAiConfigs(data)
      if (data.length > 0) {
        setSelectedId(data[0]._id)
        setAiConfig(data[0])
      }
    }
    setIsLoading(false)
    loadData()
    const socket = io('http://localhost:3001') // Use your backend URL

    // Listen for new whatsapp-message events
    socket.on(`whatsapp-message-${user.c_name}`, newMessageData => {
      setCompany(prev => {
        const idx = prev.findIndex(m => m.id === newMessageData.id)
        if (idx !== -1) {
          // Update existing conversation
          const updated = [...prev]
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, ...newMessageData.messages],
          }
          return updated
        } else {
          // Add new conversation
          return [...prev, newMessageData]
        }
      })
    })

    // Optionally, fetch initial messages
    fetchMessages(user).then(setCompany)

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect()
    }
  }, [user.c_name, user.id])

  useEffect(() => {
    if (openChatDialog && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [openChatDialog, selectedMessages?.messages?.length])

  async function handleSendMessage() {
      if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(msgs => [...msgs, { from: 'user' as const, text: userMessage }]);
    setChatInput('');
    if (!selectedMessages) return;
    const updatedMessages = [
      ...selectedMessages.messages,
      { body: userMessage, direction: 'outbound' }
    ];

    setChatInput('');
    setSelectedMessages(prev =>
      prev
        ? { ...prev, messages: updatedMessages }
        : prev
    );
    sendMessages(
    selectedMessages.session.id,
    user,
    selectedMessages.phone,
    userMessage
  ).catch(() => {
    // Optionally show error feedback
  });
}

  const handleShowAllMessages = (
    phone: string,
    messages: { body: string; direction: string }[],
    session: { id: string }
  ) => {
    setSelectedMessages({ phone, messages, session })
    setOpenDialog(true)
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{selectedMessages?.phone}</TableCell>
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
                      onClick={() =>
                        handleShowAllMessages(messages.phone.split('@')[0], messages.messages, messages.session)
                      }
                      disabled={messages.messages.length === 0}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedMessages({ phone: messages.phone, messages: messages.messages, session: messages.session })
                        setOpenChatDialog(true)
                      }}
                    >
                      <MessageIcon />
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
        <DialogTitle>Mensajes de {selectedMessages?.phone.split('@')[0]}</DialogTitle>
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
      <Dialog
        open={openChatDialog}
        onClose={() => setOpenChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chat con {selectedMessages?.phone.split('@')[0]}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Optionally, you can show a message when there are no chat messages */}
            {selectedMessages?.messages?.length === 0 && (
              <Typography color="text.secondary">Sin mensajes</Typography>
            )}
            {selectedMessages?.messages?.map((msg, idx) => (
              <Box
                key={idx}
                alignSelf={msg.direction === 'outbound-api' || msg.direction === 'outbound' ? 'flex-end' : 'flex-start'}
                bgcolor={msg.direction === 'outbound-api' || msg.direction === 'outbound' ? 'primary.main' : 'grey.200'}
                color={msg.direction === 'outbound-api' || msg.direction === 'outbound' ? 'primary.contrastText' : 'text.primary'}
                px={2}
                py={1}
                borderRadius={2}
                maxWidth="80%"
              >
                {msg.body}
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          <Box display="flex" width="100%" gap={1}>
            <TextField
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Escribe tu mensaje..."
              fullWidth
              size="small"
            />
            <Button variant="contained" onClick={handleSendMessage} disabled={!chatInput.trim()}>
              Enviar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}
