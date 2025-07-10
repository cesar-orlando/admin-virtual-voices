import { useEffect, useState, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  CircularProgress,
  useTheme,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import {
  simulateAiResponse,
  updateAiConfig,
  fetchAllAiConfigs,
  createAiConfig,
  deleteAiConfig,
} from '../api/servicios'
import type { AIConfig } from '../types'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ChatIcon from '@mui/icons-material/Chat'
import PhoneIcon from '@mui/icons-material/Phone'
import Loading from '../components/Loading'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// Componente para previsualizar archivos
function FilePreview({ url }: { url: string }) {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (/(jpg|jpeg|png|gif|webp)$/i.test(ext)) {
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <img src={url} alt="preview" style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', objectFit: 'cover', display: 'block' }} />
      </Box>
    );
  }
  if (/(mp4|webm|ogg|mov)$/i.test(ext)) {
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <video src={url} controls style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, background: '#000' }} />
      </Box>
    );
  }
  if (/^https?:\/\//.test(url)) {
    return (
      <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InsertDriveFileIcon color="action" />
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', fontWeight: 600 }}>
          Archivo
        </a>
      </Box>
    );
  }
  return null;
}

// Helper para extraer URLs de un texto
function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export default function AiConfig() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const theme = useTheme()
  const chatButtonRef = useRef<HTMLButtonElement>(null)
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [aiConfig, setAiConfig] = useState<Partial<AIConfig>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'user' | 'ai'; text: string }>>([])
  const toneOptions = ['Todos', 'formal', 'persuasivo', 'amigable']
  const objetivoOptions = ['agendar', 'responder', 'recomendar', 'ventas', 'soporte']
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const loadData = async () => {
      const data = await fetchAllAiConfigs(user)
      console.log('data', data)
      if (data.length > 0) {
        setSelectedId(data[0]._id)
        setAiConfig(data[0])
        setAiConfigs(data)
      }
      setIsLoading(false)
    }
    loadData()
  }, [user.companySlug, user.id])

  const handleSelectChange = (event: any) => {
    setIsNew(false)
    const config = aiConfigs.find(cfg => cfg._id === event.target.value)
    if (config) {
      setSelectedId(config._id)
      setAiConfig(config)
    }
  }

  async function handleDeleteAiConfig(cfg: Partial<AIConfig>) {
    if (!window.confirm(`¿Seguro que deseas borrar la IA "${cfg.name}"?`)) return
    try {
      setActionLoading(true)
      await deleteAiConfig(cfg._id as string, user)
      setSnackbar({ open: true, message: 'Configuración eliminada.', severity: 'success' })
      const data = await fetchAllAiConfigs(user)
      setAiConfigs(data)
      if (data.length > 0) {
        setSelectedId(data[0]._id)
        setAiConfig(data[0])
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error al borrar.', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleNewAI = () => {
    setIsNew(true)
    setAiConfig({
      name: '',
      welcomeMessage: '',
      tone: '',
      objective: '',
      customPrompt: '',
      user: {
        id: user.id,
        name: user.name,
      },
    })
    setSelectedId('') // Deselecciona el actual
  }

  async function saveAiConfig(config: Partial<AIConfig>) {
    try {
      setActionLoading(true)
      if (isNew) {
        // Crear nuevo
        await createAiConfig(config as AIConfig, user)
        setSnackbar({ open: true, message: 'Nuevo AI creado correctamente.', severity: 'success' })
        setIsNew(false)
      } else {
        // Actualizar existente
        if (!config._id) return
        await updateAiConfig(config as AIConfig, user)
        setSnackbar({
          open: true,
          message: 'Configuración guardada correctamente.',
          severity: 'success',
        })
      }
      // Actualiza lista
      const data = await fetchAllAiConfigs(user)
      setAiConfigs(data)
      const updated = data.find((cfg: AIConfig) =>
        isNew ? cfg.name === config.name : cfg._id === config._id
      )
      if (updated) {
        setAiConfig(updated)
        setSelectedId(updated._id)
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error al guardar.', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Simulación simple de respuesta AI
  async function handleSendMessage() {
    if (!chatInput.trim()) return
    const userMessage = chatInput
    const updatedMessages = [...chatMessages, { from: 'user' as const, text: userMessage }]
    setChatMessages(updatedMessages)
    setChatInput('')
    const response = await simulateAiResponse(user, updatedMessages, aiConfig)
    setTimeout(() => {
      setChatMessages(msgs => [...msgs, { from: 'ai', text: response.message }])
    }, 700)
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
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.96)',
      }}
    >
      {isLoading && <Loading overlay message="Cargando configuraciones de AI..." />}

      {actionLoading && <Loading overlay message="Procesando acción..." />}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            p: 3,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
              fontFamily: 'Montserrat, Arial, sans-serif',
            }}
          >
            Configuración de AI
          </Typography>
          <Chip
            label={aiConfig.type || 'General'}
            color="secondary"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              background: '#E05EFF22',
              color: '#8B5CF6',
              px: 2,
              mr: 2,
              height: 32,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {!isNew && (
              <Button
                ref={chatButtonRef}
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteAiConfig(aiConfig)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                  backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 24px rgba(139, 92, 246, 0.3)'
                      : '0 4px 24px rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '0 4px 32px rgba(139, 92, 246, 0.4)'
                        : '0 4px 32px rgba(59, 130, 246, 0.4)',
                  },
                  transition: 'all 0.2s ease-out',
                }}
              >
                Borrar AI
              </Button>
            )}
            <Button
              ref={chatButtonRef}
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewAI}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.3)'
                    : '0 4px 24px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 32px rgba(139, 92, 246, 0.4)'
                      : '0 4px 32px rgba(59, 130, 246, 0.4)',
                },
                transition: 'all 0.2s ease-out',
              }}
            >
              Agregar Nuevo AI
            </Button>

            {/* se desactiva por ahora, hasta que se implemente la llamada a la IA             
            <Button
              ref={chatButtonRef}
              variant="contained"
              startIcon={<PhoneIcon />}
              onClick={() => setChatOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 24px rgba(139, 92, 246, 0.3)'
                  : '0 4px 24px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 32px rgba(139, 92, 246, 0.4)'
                    : '0 4px 32px rgba(59, 130, 246, 0.4)',
                },
                transition: 'all 0.2s ease-out',
              }}
            >
              Simular Llamada
            </Button> */}
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => setChatOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 4px 24px rgba(139, 92, 246, 0.3)'
                    : '0 4px 24px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 32px rgba(139, 92, 246, 0.4)'
                      : '0 4px 32px rgba(59, 130, 246, 0.4)',
                },
                transition: 'all 0.2s ease-out',
              }}
            >
              Simular Chat
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, mx: 3, mb: 3, overflow: 'auto' }}>
          <Paper
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 40, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 24px rgba(139, 92, 246, 0.1)'
                  : '0 4px 24px rgba(139, 92, 246, 0.05)',
            }}
          >
            <Box sx={{ p: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel
                  sx={{
                    marginTop: '-8px',
                    padding: '2px 8px',
                    transform: 'translate(14px, 16px) scale(1)',
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 40, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    '&.Mui-focused': {
                      color: '#8B5CF6',
                      padding: '2px 8px',
                    },
                    '&.MuiInputLabel-shrink': {
                      marginTop: 0,
                      fontSize: '1rem',
                      padding: '2px 8px',
                      transform: 'translate(14px, -9px) scale(0.75)',
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(30, 30, 40, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                    },
                  }}
                >
                  Selecciona configuración
                </InputLabel>
                <Select
                  value={selectedId}
                  label="Selecciona configuración"
                  onChange={handleSelectChange}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      top: -5,
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '& .MuiSelect-select': {
                      padding: '20px 14px',
                    },
                  }}
                >
                  {aiConfigs.map(cfg => (
                    <MenuItem key={cfg._id} value={cfg._id}>
                      {cfg.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {aiConfig && (
                <form
                  onSubmit={async e => {
                    e.preventDefault()
                    await saveAiConfig(aiConfig)
                  }}
                  style={{ width: '100%' }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="Nombre"
                      value={aiConfig.name || ''}
                      onChange={e => setAiConfig(prev => ({ ...prev, name: e.target.value }))}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                              : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: '#8B5CF6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8B5CF6',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          marginTop: '-8px',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          '&.Mui-focused': {
                            color: '#8B5CF6',
                            padding: '0 8px',
                          },
                        },
                        '& .MuiInputLabel-shrink': {
                          marginTop: 0,
                          fontSize: '1rem',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                        },
                      }}
                    />
                    {/* Mostrar el creador de la IA */}
                    {aiConfig.user?.name && (
                      <Typography
                        variant="caption"
                        sx={{ color: '#8B5CF6', fontWeight: 500, ml: 1 }}
                      >
                        Creado por: {aiConfig.user.name}
                      </Typography>
                    )}
                    <TextField
                      label="Mensaje de bienvenida"
                      value={aiConfig.welcomeMessage || ''}
                      onChange={e =>
                        setAiConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))
                      }
                      fullWidth
                      minRows={2}
                      multiline
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                              : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: '#8B5CF6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8B5CF6',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          marginTop: '-8px',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          '&.Mui-focused': {
                            color: '#8B5CF6',
                            padding: '0 8px',
                          },
                        },
                        '& .MuiInputLabel-shrink': {
                          marginTop: 0,
                          fontSize: '1rem',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                        },
                      }}
                    />
                    {extractUrls(aiConfig.welcomeMessage || '').map((url, idx) => (
                      <FilePreview url={url} key={idx} />
                    ))}
                    <FormControl fullWidth>
                      <InputLabel
                        sx={{
                          '&.Mui-focused': { color: '#8B5CF6' },
                          marginTop: '-8px',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          '&.MuiInputLabel-shrink': {
                            marginTop: 0,
                            fontSize: '1rem',
                            padding: '0 8px',
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(30, 30, 40, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                          },
                        }}
                      >
                        Tono
                      </InputLabel>
                      <Select
                        value={aiConfig.tone || ''}
                        label="Tono"
                        onChange={e => setAiConfig(prev => ({ ...prev, tone: e.target.value }))}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8B5CF6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8B5CF6',
                          },
                        }}
                      >
                        {toneOptions
                          .filter(t => t !== 'Todos')
                          .map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel
                        sx={{
                          '&.Mui-focused': { color: '#8B5CF6' },
                          marginTop: '-8px',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          '&.MuiInputLabel-shrink': {
                            marginTop: 0,
                            fontSize: '1rem',
                            padding: '0 8px',
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(30, 30, 40, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                          },
                        }}
                      >
                        Objetivo
                      </InputLabel>
                      <Select
                        value={aiConfig.objective || ''}
                        label="Objetivo"
                        onChange={e =>
                          setAiConfig(prev => ({ ...prev, objective: e.target.value }))
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8B5CF6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8B5CF6',
                          },
                        }}
                      >
                        {objetivoOptions.map(option => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Contexto"
                      value={aiConfig.customPrompt || ''}
                      onChange={e =>
                        setAiConfig(prev => ({ ...prev, customPrompt: e.target.value }))
                      }
                      fullWidth
                      minRows={3}
                      multiline
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                              : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: '#8B5CF6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8B5CF6',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          marginTop: '-8px',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                          '&.Mui-focused': {
                            color: '#8B5CF6',
                            padding: '0 8px',
                          },
                        },
                        '& .MuiInputLabel-shrink': {
                          marginTop: 0,
                          fontSize: '1rem',
                          padding: '0 8px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(30, 30, 40, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                        },
                      }}
                    />
                    {extractUrls(aiConfig.customPrompt || '').map((url, idx) => (
                      <FilePreview url={url} key={idx} />
                    ))}
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                        backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                        boxShadow:
                          theme.palette.mode === 'dark'
                            ? '0 4px 24px rgba(139, 92, 246, 0.3)'
                            : '0 4px 24px rgba(59, 130, 246, 0.3)',
                        '&:hover': {
                          backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 4px 32px rgba(139, 92, 246, 0.4)'
                              : '0 4px 32px rgba(59, 130, 246, 0.4)',
                        },
                        transition: 'all 0.2s ease-out',
                      }}
                    >
                      Guardar configuración
                    </Button>
                  </Box>
                </form>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#8B5CF6' : undefined,
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      <Dialog
        open={chatOpen}
        onClose={() => {
          setChatOpen(false)
          setTimeout(() => {
            chatButtonRef.current?.focus()
          }, 0)
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 40, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.15)',
            minHeight: '40vh',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
            fontFamily: 'Montserrat, Arial, sans-serif',
          }}
        >
          Simulador de Chat AI
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            minHeight: '40vh',
            maxHeight: '80vh',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(59, 130, 246, 0.2)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(139, 92, 246, 0.4)'
                  : 'rgba(59, 130, 246, 0.3)',
            },
          }}
        >
          <Box display="flex" flexDirection="column" gap={2}>
            {chatMessages.length === 0 && (
              <Box
                color="text.secondary"
                textAlign="center"
                sx={{
                  py: 4,
                  color:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(30, 30, 40, 0.5)',
                }}
              >
                Inicia la conversación con la AI…
              </Box>
            )}
            {chatMessages.map((msg, idx) => (
              <Box
                key={idx}
                alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
                sx={{
                  backgroundColor:
                    msg.from === 'user'
                      ? '#8B5CF6'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                  color:
                    msg.from === 'user'
                      ? '#fff'
                      : theme.palette.mode === 'dark'
                        ? '#fff'
                        : '#1E1E28',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: '80%',
                  boxShadow: msg.from === 'user' ? '0 2px 8px rgba(139, 92, 246, 0.2)' : 'none',
                }}
              >
                {msg.text}
                {/* Previsualización de archivos si hay URLs en el mensaje */}
                {extractUrls(msg.text).map((url, i) => (
                  <FilePreview url={url} key={i} />
                ))}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            p: 2,
            borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(139, 92, 246, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#8B5CF6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8B5CF6',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              sx={{
                borderRadius: 2,
                px: 3,
                backgroundColor: '#8B5CF6',
                '&:hover': {
                  backgroundColor: '#7C3AED',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                },
              }}
            >
              Enviar
            </Button>
          </Box>
          <Button
            onClick={() => {
              setChatOpen(false)
              setChatMessages([])
            }}
            sx={{
              color: '#8B5CF6',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
