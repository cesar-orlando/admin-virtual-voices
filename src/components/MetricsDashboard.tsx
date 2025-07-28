import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccessTime,
  People,
  Message,
  TrackChanges,
  BarChart,
  Speed,
  Assessment,
  Phone,
  Email,
  Timer,
  Chat,
  SmartToy,
  Schedule,
  Analytics,
  Refresh,
} from '@mui/icons-material';
import { 
  getChatMetrics, 
  getRealTimeChatMetrics
} from '../api/servicios/chatMetricsServices';
import type { 
  ChatMetrics,
  RealTimeMetrics 
} from '../api/servicios/chatMetricsServices';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface MetricsDashboardProps {
  companySlug: string;
}

export function MetricsDashboard({ companySlug }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMetrics, setChatMetrics] = useState<ChatMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  
  // Determine if this is a Quick Learning dashboard or WhatsApp dashboard
  const isQuickLearning = companySlug === 'quicklearning' || companySlug.includes('quicklearning');
  const dashboardType = isQuickLearning ? 'Quick Learning' : 'WhatsApp';

  useEffect(() => {
    loadMetrics();
  }, [companySlug, selectedPeriod]);

  // Auto-refresh real-time metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [companySlug]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Loading ${dashboardType} chat metrics for:`, companySlug, selectedPeriod);
      
      const [chatMetricsResponse, realtimeMetricsResponse] = await Promise.all([
        getChatMetrics(companySlug, selectedPeriod),
        getRealTimeChatMetrics(companySlug)
      ]);

      console.log('📊 Chat metrics response:', chatMetricsResponse);
      console.log('⚡ Real-time metrics response:', realtimeMetricsResponse);

      if (!chatMetricsResponse.success) {
        throw new Error(chatMetricsResponse.message || 'Error loading metrics');
      }

      const chatData = chatMetricsResponse.metrics;
      const realtimeData = realtimeMetricsResponse.realTimeMetrics;

      setChatMetrics(chatData);
      setRealTimeMetrics(realtimeData);

      // Create metrics cards with real data
      const metricsData: MetricCard[] = [
        {
          title: 'Total de Chats',
          value: chatData.totalChats,
          change: calculateChatsChange(realtimeData),
          trend: chatData.totalActiveChats > chatData.totalChats * 0.5 ? 'up' : 'down',
          icon: <Chat />,
          color: 'primary'
        },
        {
          title: 'Tiempo Promedio de Respuesta',
          value: formatResponseTime(chatData.averageResponseTime),
          change: calculateResponseTimeChange(chatData, realtimeData),
          trend: chatData.averageResponseTime < 300 ? 'up' : 'down', // Good if under 5 minutes
          icon: <AccessTime />,
          color: 'secondary'
        },
        {
          title: 'Mensajes Totales',
          value: chatData.totalMessages,
          change: undefined,
          trend: 'up',
          icon: <Message />,
          color: 'success'
        },
        {
          title: 'Respuestas Rápidas (<5s)',
          value: `${Math.round((chatData.responsesUnder5Seconds / (chatData.totalMessages || 1)) * 100)}%`,
          change: undefined,
          trend: 'up',
          icon: <Speed />,
          color: 'success'
        },
        {
          title: 'Chats con IA Activa',
          value: chatData.botActiveChats,
          change: undefined,
          trend: 'neutral',
          icon: <SmartToy />,
          color: 'warning'
        },
        {
          title: 'Respuestas Lentas (>30s)',
          value: chatData.responsesOver30Seconds,
          change: undefined,
          trend: chatData.responsesOver30Seconds < chatData.totalMessages * 0.1 ? 'up' : 'down',
          icon: <Timer />,
          color: 'error'
        }
      ];
      
      setMetrics(metricsData);

    } catch (error: unknown) {
      console.error('❌ Error loading chat metrics:', error);
      setError(error instanceof Error ? error.message : 'Error loading metrics');
      
      // Fallback to default metrics if chat data fails
      const fallbackMetrics: MetricCard[] = [
        {
          title: 'Sistema de Chat',
          value: 'Configurando...',
          icon: <Message />,
          color: 'primary'
        },
        {
          title: 'Métricas',
          value: 'Próximamente',
          icon: <Assessment />,
          color: 'secondary'
        }
      ];
      
      setMetrics(fallbackMetrics);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const realtimeMetricsResponse = await getRealTimeChatMetrics(companySlug);
      setRealTimeMetrics(realtimeMetricsResponse.realTimeMetrics);
    } catch (error) {
      console.warn('⚠️ Error updating real-time metrics:', error);
    }
  };

  // Helper functions for calculating changes
  const calculateResponseTimeChange = (chatData: ChatMetrics, realtimeData: RealTimeMetrics) => {
    const current = chatData.averageResponseTime;
    const recent = realtimeData.last24Hours.averageResponseTime;
    
    if (recent === 0) return undefined;
    
    const change = ((current - recent) / recent) * 100;
    return Math.round(change * 10) / 10;
  };

  const calculateChatsChange = (realtimeData: RealTimeMetrics) => {
    const last24h = realtimeData.last24Hours.totalChats;
    const lastHour = realtimeData.lastHour.totalChats;
    
    if (lastHour === 0) return undefined;
    
    // Estimate daily change based on hourly activity
    const projectedDaily = lastHour * 24;
    const change = ((projectedDaily - last24h) / last24h) * 100;
    return Math.round(change * 10) / 10;
  };

  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h`;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2, 
        p: 4 
      }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Cargando métricas de chat...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <button onClick={loadMetrics}>
            <Refresh />
          </button>
        }
      >
        Error al cargar métricas: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200 }}>
      {/* Header with filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 0 }}>
          📊 Métricas de {dashboardType} en Tiempo Real
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              label="Período"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="7days">7 días</MenuItem>
              <MenuItem value="30days">30 días</MenuItem>
              <MenuItem value="90days">90 días</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[4],
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: `${metric.color}.light`,
                    color: `${metric.color}.contrastText`,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {metric.title}
                  </Typography>
                </Box>
                
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {metric.value}
                </Typography>
                
                {metric.change !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {metric.trend === 'up' ? (
                      <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                    )}
                    <Chip
                      label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                      size="small"
                      color={getTrendColor(metric.trend!)}
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      
      {chatMetrics && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            📈 Análisis Detallado de Chat
          </Typography>
          
          <Grid container spacing={3}>
            {/* Response Time Distribution */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  🕐 Distribución de Tiempos de Respuesta
                </Typography>
                <List dense>
                  {chatMetrics.responseTimeDistribution?.map((dist, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Timer color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={dist.range}
                        secondary={`${dist.count} respuestas (${Math.round((dist.count / chatMetrics.totalMessages) * 100)}%)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Peak Hours */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  ⏰ Horas Pico de Actividad
                </Typography>
                <List dense>
                  {chatMetrics.peakHours?.slice(0, 5).map((peak, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Schedule color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${peak.hour}:00 - ${peak.hour + 1}:00`}
                        secondary={`${peak.messageCount} mensajes`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Top Active Chats */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  🔥 Chats Más Activos
                </Typography>
                <List dense>
                  {chatMetrics.topActiveChats?.slice(0, 5).map((chat, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Phone color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={chat.name || chat.phone}
                        secondary={`${chat.messageCount} mensajes`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Daily Stats Summary */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  📅 Resumen Últimos Días
                </Typography>
                <List dense>
                  {chatMetrics.dailyStats?.slice(-5).map((day, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Analytics color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={new Date(day.date).toLocaleDateString('es-ES')}
                        secondary={`${day.chats} chats, ${day.messages} mensajes, ${formatResponseTime(day.avgResponseTime)} promedio`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Real-time Status */}
      {realTimeMetrics && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ⚡ Estado en Tiempo Real
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Últimas 24 horas:</strong> {realTimeMetrics.last24Hours.totalChats} chats, {realTimeMetrics.last24Hours.totalMessages} mensajes
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Última hora:</strong> {realTimeMetrics.lastHour.totalChats} chats, {realTimeMetrics.lastHour.totalMessages} mensajes
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Box>
  );
}