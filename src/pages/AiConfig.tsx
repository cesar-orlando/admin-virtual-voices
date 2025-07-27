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
  useMediaQuery,
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
function FilePreview({ url, isMobile }: { url: string; isMobile?: boolean }) {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const maxWidth = isMobile ? 180 : 220;
  const maxHeight = isMobile ? 140 : 180;
  
  if (/(jpg|jpeg|png|gif|webp)$/i.test(ext)) {
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <img 
          src={url} 
          alt="preview" 
          style={{ 
            maxWidth, 
            maxHeight, 
            borderRadius: 8, 
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)', 
            objectFit: 'cover', 
            display: 'block' 
          }} 
        />
      </Box>
    );
  }
  if (/(mp4|webm|ogg|mov)$/i.test(ext)) {
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <video 
          src={url} 
          controls 
          style={{ 
            maxWidth, 
            maxHeight, 
            borderRadius: 8, 
            background: '#000' 
          }} 
        />
      </Box>
    );
  }
  if (/^https?:\/\//.test(url)) {
    return (
      <Box sx={{ 
        mt: 1, 
        mb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}>
        <InsertDriveFileIcon 
          color="action" 
          fontSize={isMobile ? "small" : "medium"}
        />
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#8B5CF6', 
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
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
        email: user.email,
      },
      companySlug: user.companySlug,
    })
    setSelectedId('')
  }

  const saveAiConfig = async (config: Partial<AIConfig>) => {
    if (!config.name || !config.welcomeMessage) {
      setSnackbar({
        open: true,
        message: 'El nombre y mensaje de bienvenida son requeridos.',
        severity: 'error',
      })
      return
    }

    try {
      setActionLoading(true)
      if (isNew) {
        const data = await createAiConfig(config as AIConfig, user)
        setSnackbar({ open: true, message: 'Configuración creada.', severity: 'success' })
        const updatedConfigs = await fetchAllAiConfigs(user)
        setAiConfigs(updatedConfigs)
        setSelectedId(data._id)
        setAiConfig(data)
        setIsNew(false)
      } else {
        await updateAiConfig(config as AIConfig, user)
        setSnackbar({ open: true, message: 'Configuración actualizada.', severity: 'success' })
        const updatedConfigs = await fetchAllAiConfigs(user)
        setAiConfigs(updatedConfigs)
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error al guardar.', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { from: 'user', text: userMessage }])

    try {
      const response = await simulateAiResponse(
        { ...aiConfig, messages: [...chatMessages, { from: 'user', text: userMessage }] },
        user
      )
      setChatMessages(prev => [...prev, { from: 'ai', text: response.response }])
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { from: 'ai', text: 'Error al procesar el mensaje. Intenta de nuevo.' },
      ])
    }
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: { xs: '100vh', md: '85vh' },
        width: '100%',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: { xs: '1.5rem', md: '2.125rem' },
            mb: 1
          }}
        >
          Configuración IA
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            mb: 3
          }}
        >
          Personaliza el comportamiento y tono de tu asistente de IA
        </Typography>

        {/* Action Buttons */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            mb: 3
          }}
        >
          <Button
            onClick={handleNewAI}
            variant="contained"
            startIcon={<AddIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              borderRadius: { xs: 2, md: 3 },
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              fontWeight: 600,
              fontSize: { xs: '0.875rem', md: '1rem' },
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 32px rgba(139, 92, 246, 0.4)',
              },
              transition: 'all 0.2s ease-out',
              flex: { xs: 1, sm: 'none' }
            }}
          >
            {isMobile ? 'Nueva IA' : 'Nueva Configuración IA'}
          </Button>
          <Button
            ref={chatButtonRef}
            onClick={() => setChatOpen(true)}
            variant="outlined"
            startIcon={<ChatIcon />}
            disabled={!aiConfig.name}
            size={isMobile ? "medium" : "large"}
            sx={{
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              borderRadius: { xs: 2, md: 3 },
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              fontWeight: 600,
              fontSize: { xs: '0.875rem', md: '1rem' },
              '&:hover': {
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                borderColor: 'rgba(139, 92, 246, 0.3)',
                color: 'rgba(139, 92, 246, 0.5)',
              },
              transition: 'all 0.2s ease-out',
              flex: { xs: 1, sm: 'none' }
            }}
          >
            {isMobile ? 'Probar' : 'Probar Chat'}
          </Button>
        </Box>
      </Box>

      {/* Configuration Form */}
      <Card
        elevation={4}
        sx={{
          borderRadius: { xs: 3, md: 4 },
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 40, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 4px 24px rgba(139, 92, 246, 0.1)'
              : '0 4px 24px rgba(139, 92, 246, 0.05)',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <FormControl 
            fullWidth 
            sx={{ mb: 3 }}
            size={isMobile ? "small" : "medium"}
          >
            <InputLabel
              sx={{
                marginTop: isMobile ? 0 : '-8px',
                padding: '2px 8px',
                transform: isMobile ? 'translate(14px, 12px) scale(1)' : 'translate(14px, 16px) scale(1)',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 40, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                fontSize: { xs: '0.875rem', md: '1rem' },
                '&.Mui-focused': {
                  color: '#8B5CF6',
                  padding: '2px 8px',
                },
                '&.MuiInputLabel-shrink': {
                  marginTop: 0,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  padding: '2px 8px',
                  transform: isMobile ? 'translate(14px, -6px) scale(0.75)' : 'translate(14px, -9px) scale(0.75)',
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
                borderRadius: { xs: 2, md: 2 },
                '& .MuiOutlinedInput-notchedOutline': {
                  top: isMobile ? 0 : -5,
                  borderColor: 'rgba(139, 92, 246, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8B5CF6',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8B5CF6',
                },
                '& .MuiSelect-select': {
                  padding: isMobile ? '12px 14px' : '20px 14px',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
              }}
            >
              {aiConfigs.map(cfg => (
                <MenuItem 
                  key={cfg._id} 
                  value={cfg._id}
                  sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                >
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                <TextField
                  label="Nombre"
                  value={aiConfig.name || ''}
                  onChange={e => setAiConfig(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 2 },
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
                      marginTop: isMobile ? 0 : '-8px',
                      padding: '0 8px',
                      fontSize: { xs: '0.875rem', md: '1rem' },
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
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      padding: '0 8px',
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(30, 30, 40, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: isMobile ? '12px 14px' : '16px 14px',
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    },
                  }}
                />
                
                {/* Mostrar el creador de la IA */}
                {aiConfig.user?.name && (
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: '#8B5CF6', 
                      fontWeight: 500, 
                      ml: 1,
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}
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
                  minRows={isMobile ? 2 : 3}
                  multiline
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 2 },
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
                      marginTop: isMobile ? 0 : '-8px',
                      padding: '0 8px',
                      fontSize: { xs: '0.875rem', md: '1rem' },
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
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      padding: '0 8px',
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(30, 30, 40, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: isMobile ? '12px 14px' : '16px 14px',
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    },
                  }}
                />
                
                {extractUrls(aiConfig.welcomeMessage || '').map((url, idx) => (
                  <FilePreview url={url} key={idx} isMobile={isMobile} />
                ))}
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, md: 2 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <FormControl 
                    fullWidth 
                    size={isMobile ? "small" : "medium"}
                  >
                    <InputLabel
                      sx={{
                        '&.Mui-focused': { color: '#8B5CF6' },
                        marginTop: isMobile ? 0 : '-8px',
                        padding: '0 8px',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 40, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                      }}
                    >
                      Tono
                    </InputLabel>
                    <Select
                      value={aiConfig.tone || ''}
                      label="Tono"
                      onChange={e => setAiConfig(prev => ({ ...prev, tone: e.target.value }))}
                      sx={{
                        borderRadius: { xs: 2, md: 2 },
                        '& .MuiOutlinedInput-notchedOutline': {
                          top: isMobile ? 0 : -5,
                          borderColor: 'rgba(139, 92, 246, 0.2)',
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8B5CF6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8B5CF6',
                          borderWidth: 2,
                        },
                        '& .MuiSelect-select': {
                          padding: isMobile ? '12px 14px' : '20px 14px',
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        },
                      }}
                    >
                      {toneOptions.map(option => (
                        <MenuItem 
                          key={option} 
                          value={option}
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl 
                    fullWidth 
                    size={isMobile ? "small" : "medium"}
                  >
                    <InputLabel
                      sx={{
                        '&.Mui-focused': { color: '#8B5CF6' },
                        marginTop: isMobile ? 0 : '-8px',
                        padding: '0 8px',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 40, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                      }}
                    >
                      Objetivo
                    </InputLabel>
                    <Select
                      value={aiConfig.objective || ''}
                      label="Objetivo"
                      onChange={e => setAiConfig(prev => ({ ...prev, objective: e.target.value }))}
                      sx={{
                        borderRadius: { xs: 2, md: 2 },
                        '& .MuiOutlinedInput-notchedOutline': {
                          top: isMobile ? 0 : -5,
                          borderColor: 'rgba(139, 92, 246, 0.2)',
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8B5CF6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8B5CF6',
                          borderWidth: 2,
                        },
                        '& .MuiSelect-select': {
                          padding: isMobile ? '12px 14px' : '20px 14px',
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        },
                      }}
                    >
                      {objetivoOptions.map(option => (
                        <MenuItem 
                          key={option} 
                          value={option}
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  label="Prompt personalizado (opcional)"
                  value={aiConfig.customPrompt || ''}
                  onChange={e => setAiConfig(prev => ({ ...prev, customPrompt: e.target.value }))}
                  fullWidth
                  minRows={isMobile ? 3 : 4}
                  multiline
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 2 },
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
                      marginTop: isMobile ? 0 : '-8px',
                      padding: '0 8px',
                      fontSize: { xs: '0.875rem', md: '1rem' },
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
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      padding: '0 8px',
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(30, 30, 40, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: isMobile ? '12px 14px' : '16px 14px',
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    },
                  }}
                />

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, md: 2 }, 
                  pt: { xs: 1, md: 2 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={actionLoading}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      borderRadius: { xs: 2, md: 3 },
                      px: { xs: 2, md: 4 },
                      py: { xs: 1, md: 1.5 },
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 32px rgba(139, 92, 246, 0.4)',
                      },
                      '&:disabled': {
                        transform: 'none',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
                      },
                      transition: 'all 0.2s ease-out',
                      flex: { xs: 1, sm: 'none' }
                    }}
                  >
                    {actionLoading ? (
                      <CircularProgress size={isMobile ? 16 : 20} color="inherit" />
                    ) : (
                      isNew ? 'Crear' : 'Guardar'
                    )}
                  </Button>

                  {!isNew && aiConfig._id && (
                    <Button
                      onClick={() => handleDeleteAiConfig(aiConfig)}
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      disabled={actionLoading}
                      size={isMobile ? "medium" : "large"}
                      sx={{
                        borderColor: '#ff4444',
                        color: '#ff4444',
                        borderRadius: { xs: 2, md: 3 },
                        px: { xs: 2, md: 4 },
                        py: { xs: 1, md: 1.5 },
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        '&:hover': {
                          borderColor: '#ff4444',
                          backgroundColor: 'rgba(255, 68, 68, 0.1)',
                          transform: 'translateY(-1px)',
                        },
                        '&:disabled': {
                          borderColor: 'rgba(255, 68, 68, 0.3)',
                          color: 'rgba(255, 68, 68, 0.5)',
                        },
                        transition: 'all 0.2s ease-out',
                        flex: { xs: 1, sm: 'none' }
                      }}
                    >
                      {isMobile ? 'Eliminar' : 'Eliminar'}
                    </Button>
                  )}
                </Box>
              </Box>
            </form>
          )}
        </Box>
      </Card>

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => {
          setChatOpen(false)
          setChatMessages([])
          setTimeout(() => {
            chatButtonRef.current?.focus()
          }, 0)
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 40, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.15)',
            minHeight: isMobile ? '100%' : '40vh',
            maxHeight: isMobile ? '100%' : '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            p: { xs: 2, md: 3 }
          }}
        >
          Simulador de Chat AI
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            minHeight: isMobile ? 'calc(100vh - 200px)' : '40vh',
            maxHeight: isMobile ? 'calc(100vh - 200px)' : '80vh',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            p: { xs: 2, md: 3 },
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
          <Box display="flex" flexDirection="column" gap={{ xs: 1.5, md: 2 }}>
            {chatMessages.length === 0 && (
              <Box
                color="text.secondary"
                textAlign="center"
                sx={{
                  py: { xs: 3, md: 4 },
                  color:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(30, 30, 40, 0.5)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
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
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 1, md: 1 },
                  borderRadius: { xs: 2, md: 2 },
                  maxWidth: { xs: '90%', md: '80%' },
                  boxShadow: msg.from === 'user' ? '0 2px 8px rgba(139, 92, 246, 0.2)' : 'none',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
                {/* Previsualización de archivos si hay URLs en el mensaje */}
                {extractUrls(msg.text).map((url, i) => (
                  <FilePreview url={url} key={i} isMobile={isMobile} />
                ))}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: { xs: 1, md: 1 },
            p: { xs: 2, md: 2 },
            borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <Box display="flex" width="100%" gap={{ xs: 1, md: 1 }}>
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
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 2, md: 2 },
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
                '& .MuiOutlinedInput-input': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              size={isMobile ? "small" : "medium"}
              sx={{
                borderRadius: { xs: 2, md: 2 },
                px: { xs: 2, md: 3 },
                backgroundColor: '#8B5CF6',
                fontSize: { xs: '0.875rem', md: '1rem' },
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
            size={isMobile ? "small" : "medium"}
            sx={{
              color: '#8B5CF6',
              fontSize: { xs: '0.875rem', md: '1rem' },
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'center' : 'left',
        }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.875rem', md: '1rem' },
            minWidth: { xs: 'auto', md: '300px' }
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  )
}
