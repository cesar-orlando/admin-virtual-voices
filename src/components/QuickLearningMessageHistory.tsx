import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  VolumeUp as VolumeUpIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuickLearningTwilio } from '../hooks/useQuickLearningTwilio';
import type { TwilioHistoryRequest, TwilioMessage } from '../types/quicklearning';

interface MessageHistoryProps {
  phone?: string;
  autoRefresh?: boolean;
  maxHeight?: string;
}

const QuickLearningMessageHistory: React.FC<MessageHistoryProps> = ({
  phone,
  autoRefresh = false,
  maxHeight = '600px'
}) => {
  const theme = useTheme();
  const {
    history,
    isLoading,
    error,
    loadHistory,
    getMessageStatusColor,
    formatPhoneNumber,
    clearError
  } = useQuickLearningTwilio();

  // State local
  const [filters, setFilters] = useState<TwilioHistoryRequest>({
    limit: 50,
    offset: 0,
    phone: phone || '',
    direction: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<TwilioMessage | null>(null);
  const [messageDetailsOpen, setMessageDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 20;

  // Cargar historial inicial y configurar auto-refresh
  useEffect(() => {
    loadHistory(filters);
  }, [filters]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHistory(filters);
      }, 30000); // Refresh cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh, filters, loadHistory]);

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<TwilioHistoryRequest>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    loadHistory(filters);
  }, [loadHistory, filters]);

  const handleMessageClick = useCallback((message: TwilioMessage) => {
    setSelectedMessage(message);
    setMessageDetailsOpen(true);
  }, []);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    const newOffset = (page - 1) * messagesPerPage;
    handleFilterChange({ offset: newOffset, limit: messagesPerPage });
  }, [handleFilterChange, messagesPerPage]);

  const handleExportHistory = useCallback(() => {
    if (!history?.messages) return;

    const csvContent = [
      ['Fecha', 'De', 'Para', 'Mensaje', 'Dirección', 'Estado', 'Tipo'].join(','),
      ...history.messages.map(msg => [
        new Date(msg.timestamp).toLocaleString(),
        msg.from,
        msg.to,
        `"${msg.body.replace(/"/g, '""')}"`,
        msg.direction === 'inbound' ? 'Entrante' : 'Saliente',
        msg.status,
        msg.messageType
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_history_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [history]);

  // Filtrar mensajes por término de búsqueda
  const filteredMessages = history?.messages?.filter(message =>
    message.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.from.includes(searchTerm) ||
    message.to.includes(searchTerm)
  ) || [];

  const totalPages = Math.ceil((history?.total || 0) / messagesPerPage);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Ayer ' + date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days < 7) {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getMessageIcon = (message: TwilioMessage) => {
    switch (message.messageType) {
      case 'audio':
        return <VolumeUpIcon />;
      case 'media':
        return <ImageIcon />;
      case 'location':
        return <LocationIcon />;
      default:
        return message.direction === 'inbound' ? <PersonIcon /> : <AIIcon />;
    }
  };

  const getMessageColor = (message: TwilioMessage) => {
    if (message.direction === 'inbound') {
      return theme.palette.mode === 'dark' ? '#2C5282' : '#EBF8FF';
    } else {
      return theme.palette.mode === 'dark' ? '#2D5016' : '#F0FFF4';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header con filtros */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Historial de Mensajes WhatsApp
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Actualizar">
                <IconButton onClick={handleRefresh} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exportar CSV">
                <IconButton onClick={handleExportHistory} disabled={!history?.messages?.length}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar mensajes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono"
                value={filters.phone || ''}
                onChange={(e) => handleFilterChange({ phone: e.target.value || undefined })}
                placeholder="+52..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Dirección</InputLabel>
                <Select
                  value={filters.direction || ''}
                  label="Dirección"
                  onChange={(e) => handleFilterChange({ 
                    direction: e.target.value as 'inbound' | 'outbound' | undefined 
                  })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="inbound">Entrantes</MenuItem>
                  <MenuItem value="outbound">Salientes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Estado"
                  onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="sent">Enviado</MenuItem>
                  <MenuItem value="delivered">Entregado</MenuItem>
                  <MenuItem value="read">Leído</MenuItem>
                  <MenuItem value="failed">Fallido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  type="date"
                  label="Desde"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="Hasta"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Grid>
          </Grid>

          {history && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total: {history.total} mensajes
              </Typography>
              {filters.phone && (
                <Chip
                  label={`Filtrado por: ${formatPhoneNumber(filters.phone)}`}
                  size="small"
                  onDelete={() => handleFilterChange({ phone: undefined })}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Lista de mensajes */}
      <Card sx={{ flex: 1, borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ height: '100%', p: 0 }}>
          {error && (
            <Alert severity="error" onClose={clearError} sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ height: maxHeight, overflow: 'auto', p: 1 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
              </Box>
            ) : filteredMessages.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <WhatsAppIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay mensajes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No se encontraron mensajes con esa búsqueda' : 'No hay mensajes en el historial'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredMessages.map((message, index) => (
                  <ListItem
                    key={message._id || index}
                    button
                    onClick={() => handleMessageClick(message)}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      backgroundColor: getMessageColor(message),
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: message.direction === 'inbound' 
                            ? theme.palette.primary.main 
                            : theme.palette.secondary.main
                        }}
                      >
                        {getMessageIcon(message)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {message.direction === 'inbound' ? 'Cliente' : 'NatalIA'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatMessageTime(message.timestamp)}
                            </Typography>
                            <Chip
                              label={message.status}
                              size="small"
                              sx={{
                                backgroundColor: getMessageStatusColor(message.status),
                                color: 'white',
                                fontSize: '0.6rem',
                                height: 20
                              }}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                              mb: 0.5
                            }}
                          >
                            {message.messageType === 'audio' && message.audioTranscription
                              ? `🎵 ${message.audioTranscription}`
                              : message.messageType === 'location'
                              ? `📍 Ubicación compartida`
                              : message.messageType === 'media'
                              ? `🖼️ Imagen/Media`
                              : message.body
                            }
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {message.direction === 'inbound' 
                                ? `De: ${formatPhoneNumber(message.from)}`
                                : `Para: ${formatPhoneNumber(message.to)}`
                              }
                            </Typography>
                            {message.messageType !== 'text' && (
                              <Chip
                                label={message.messageType}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 18 }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles del mensaje */}
      <Dialog
        open={messageDetailsOpen}
        onClose={() => setMessageDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Detalles del Mensaje
          </Typography>
          <IconButton onClick={() => setMessageDetailsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        {selectedMessage && (
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dirección
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMessage.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  label={selectedMessage.status}
                  sx={{
                    backgroundColor: getMessageStatusColor(selectedMessage.status),
                    color: 'white',
                    mb: 2
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  De
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatPhoneNumber(selectedMessage.from)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Para
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatPhoneNumber(selectedMessage.to)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha y Hora
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedMessage.timestamp).toLocaleString('es-ES')}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de Mensaje
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMessage.messageType}
                </Typography>
              </Grid>
              
              {selectedMessage.twilioSid && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Twilio SID
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                    {selectedMessage.twilioSid}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contenido del Mensaje
                </Typography>
                <Paper sx={{ p: 2, mt: 1, backgroundColor: getMessageColor(selectedMessage) }}>
                  <Typography variant="body1">
                    {selectedMessage.messageType === 'audio' && selectedMessage.audioTranscription
                      ? selectedMessage.audioTranscription
                      : selectedMessage.body
                    }
                  </Typography>
                  
                  {selectedMessage.location && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ubicación
                      </Typography>
                      <Typography variant="body2">
                        Lat: {selectedMessage.location.latitude}, 
                        Lng: {selectedMessage.location.longitude}
                      </Typography>
                      {selectedMessage.location.address && (
                        <Typography variant="body2">
                          {selectedMessage.location.address}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {selectedMessage.mediaUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Media URL
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="a" 
                        href={selectedMessage.mediaUrl}
                        target="_blank"
                        sx={{ color: 'primary.main' }}
                      >
                        {selectedMessage.mediaUrl}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {selectedMessage.errorMessage && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2">
                      Error
                    </Typography>
                    <Typography variant="body2">
                      {selectedMessage.errorMessage}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        
        <DialogActions>
          <Button onClick={() => setMessageDetailsOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickLearningMessageHistory;