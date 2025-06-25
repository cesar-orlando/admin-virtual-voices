import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Business,
  ShoppingCart,
  Message,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  Analytics,
  Speed,
  Timer,
  Assessment,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LabelList, Legend, Pie as PieCell } from 'recharts';

// Mock data para las métricas
const mockMetricsData = {
  overview: {
    totalProspects: 1247,
    totalClients: 342,
    totalSales: 156,
    unansweredMessages: 23,
    prospectsChange: 12.5,
    clientsChange: 8.2,
    salesChange: -3.1,
    messagesChange: -15.7,
  },
  responseTimes: {
    averageResponseTime: 2.3, // minutos
    averageResponseTimeChange: -0.5,
    statusResponseTimes: [
      { status: 'Nuevo', time: 1.2, color: '#FF6B6B' },
      { status: 'En Proceso', time: 3.8, color: '#4ECDC4' },
      { status: 'Calificado', time: 2.1, color: '#45B7D1' },
      { status: 'Convertido', time: 1.5, color: '#96CEB4' },
      { status: 'Perdido', time: 4.2, color: '#FFEAA7' },
    ],
  },
  weeklyData: [
    { day: 'Lun', prospects: 45, clients: 12, sales: 8, messages: 67 },
    { day: 'Mar', prospects: 52, clients: 15, sales: 11, messages: 73 },
    { day: 'Mié', prospects: 38, clients: 8, sales: 6, messages: 54 },
    { day: 'Jue', prospects: 61, clients: 19, sales: 14, messages: 89 },
    { day: 'Vie', prospects: 48, clients: 11, sales: 9, messages: 62 },
    { day: 'Sáb', prospects: 29, clients: 6, sales: 4, messages: 41 },
    { day: 'Dom', prospects: 22, clients: 4, sales: 3, messages: 28 },
  ],
  statusDistribution: [
    { name: 'Nuevo', value: 35, color: '#FF6B6B' },
    { name: 'En Proceso', value: 28, color: '#4ECDC4' },
    { name: 'Calificado', value: 20, color: '#45B7D1' },
    { name: 'Convertido', value: 12, color: '#96CEB4' },
    { name: 'Perdido', value: 5, color: '#FFEAA7' },
  ],
  performanceMetrics: {
    conversionRate: 12.5,
    averageDealSize: 2450,
    salesCycle: 18.5,
    customerSatisfaction: 4.6,
  },
};

// Mock data para medios de contacto
const contactChannels = [
  { channel: 'GOOGLE', prospects: 15350, inscritos: 970 },
  { channel: 'FACEBOOK', prospects: 6120, inscritos: 498 },
  { channel: 'SUCURSAL', prospects: 3486, inscritos: 715 },
  { channel: 'AMIGOS', prospects: 1332, inscritos: 458 },
  { channel: 'EX ALUMNO', prospects: 582, inscritos: 174 },
  { channel: 'PESCA', prospects: 44, inscritos: 3 },
  { channel: 'INSTAGRAM', prospects: 14, inscritos: 3 },
  { channel: 'VOLANTE', prospects: 14, inscritos: 2 },
  { channel: 'TIK TOK', prospects: 11, inscritos: 5 },
  { channel: 'PODCAST', prospects: 4, inscritos: 1 },
  { channel: 'RED 88.1', prospects: 4, inscritos: 0 },
  { channel: 'TELEVISA', prospects: 3, inscritos: 1 },
  { channel: 'CANAL 12', prospects: 3, inscritos: 1 },
  { channel: 'ALFA 91.3', prospects: 3, inscritos: 1 },
  { channel: 'TV AZTECA', prospects: 2, inscritos: 1 },
  { channel: 'OTROS', prospects: 2, inscritos: 0 },
  { channel: 'AMOR', prospects: 2, inscritos: 1 },
  { channel: 'JOYA 93.7', prospects: 1, inscritos: 0 },
  { channel: 'DIGITAL 99.1', prospects: 1, inscritos: 0 },
  { channel: 'MAS 94.1 (PUEBLA)', prospects: 1, inscritos: 0 },
];

// Mock data para pie chart de inscripción por medio (por ciclo)
const pieContactCycle2506 = [
  { name: 'SUCURSALES', value: 48, color: '#FFC300' },
  { name: 'GOOGLE', value: 34.2, color: '#FF5733' },
  { name: 'META', value: 17.8, color: '#3498DB' },
];
const pieContactCycle2406 = [
  { name: 'SUCURSALES', value: 58.5, color: '#FFC300' },
  { name: 'GOOGLE', value: 23, color: '#FF5733' },
  { name: 'META', value: 18.4, color: '#3498DB' },
];

// Mock data para pie chart de tipo de curso (por ciclo)
const pieTipoCurso2506 = [
  { name: 'PRESENCIAL', value: 70.5, color: '#1A237E' },
  { name: 'AVIRTUAL', value: 15.3, color: '#1976D2' },
  { name: 'ONLINE', value: 14.2, color: '#64B5F6' },
];
const pieTipoCurso2406 = [
  { name: 'PRESENCIAL', value: 69.7, color: '#1A237E' },
  { name: 'ONLINE', value: 16, color: '#64B5F6' },
  { name: 'AVIRTUAL', value: 14.3, color: '#1976D2' },
];

// Mock data para total ganados por semana y por ciclo
const weeklyEarnings = [
  { week: 'Semana 1', total: 12000 },
  { week: 'Semana 2', total: 18500 },
  { week: 'Semana 3', total: 14200 },
  { week: 'Semana 4', total: 21000 },
];
const cycleEarnings = [
  { cycle: 'Ciclo 2506', total: 65700 },
  { cycle: 'Ciclo 2406', total: 61200 },
];

// Paleta de colores vibrantes para los segmentos
const donutColors = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6366F1', '#F472B6'];
const pastelColors = ['#E0E7FF', '#D1FAE5', '#FEF3C7', '#DBEAFE', '#FECACA', '#DDD6FE', '#FCE7F3'];

// Donut chart label helper
const renderDonutLabelVibrant = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={donutColors[index % donutColors.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={18} fontWeight={700}>
      {`${name}: ${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  subtitle,
  loading = false 
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="30%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(30,30,40,0.9) 0%, rgba(30,30,40,0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${color}20`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500, 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: color,
                mt: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`, 
              color: color,
              width: 56,
              height: 56,
              boxShadow: `0 4px 16px ${color}30`
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: '#10B981', fontSize: 16 }} />
            ) : (
              <TrendingDown sx={{ color: '#EF4444', fontSize: 16 }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                color: change >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {change >= 0 ? '+' : ''}{change}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              vs mes anterior
            </Typography>
          </Box>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
      
      {/* Gradient overlay */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: '100px', 
          height: '100px', 
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} 
      />
    </Card>
  );
};

const StatusTimeCard = ({ status, time, color }: { status: string; time: number; color: string }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      p: 2, 
      background: theme.palette.mode === 'dark' 
        ? 'rgba(30,30,40,0.8)' 
        : 'rgba(255,255,255,0.8)',
      border: `1px solid ${color}30`,
      borderRadius: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 12, 
          height: 12, 
          borderRadius: '50%', 
          bgcolor: color 
        }} />
        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
          {status}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color }}>
          {time} min
        </Typography>
      </Box>
    </Card>
  );
};

const Metrics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(mockMetricsData);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: theme.palette.mode === 'dark' ? '#fff' : '#1F2937',
                mb: 0.5
              }}
            >
              Dashboard de Métricas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Análisis completo del rendimiento de tu negocio
            </Typography>
          </Box>
          <Tooltip title="Actualizar datos">
            <IconButton 
              onClick={handleRefresh}
              disabled={loading}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                '&:hover': { bgcolor: theme.palette.primary.dark },
                '&:disabled': { bgcolor: theme.palette.action.disabled }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        
{/*         <Alert 
          severity="info" 
          sx={{ 
            background: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            '& .MuiAlert-icon': { color: theme.palette.primary.main }
          }}
        >
          <Typography variant="body2">
            <strong>Datos de ejemplo:</strong> Esta es una demostración con datos mock. En producción, estos datos se obtendrían de tu API real.
          </Typography>
        </Alert> */}
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Prospectos"
            value={data.overview.totalProspects}
            change={data.overview.prospectsChange}
            icon={<People />}
            color="#8B5CF6"
            subtitle="Leads generados este mes"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clientes Activos"
            value={data.overview.totalClients}
            change={data.overview.clientsChange}
            icon={<Business />}
            color="#10B981"
            subtitle="Clientes convertidos"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ventas Realizadas"
            value={data.overview.totalSales}
            change={data.overview.salesChange}
            icon={<ShoppingCart />}
            color="#F59E0B"
            subtitle="Transacciones completadas"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sin Contestar"
            value={data.overview.unansweredMessages}
            change={data.overview.messagesChange}
            icon={<Message />}
            color="#EF4444"
            subtitle="Mensajes pendientes"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Gráficos y métricas detalladas */}
      <Grid container spacing={3}>
        {/* Gráfico de tendencias semanales */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: '100%',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,40,0.9)' 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Tendencias Semanales
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'} />
                    <XAxis 
                      dataKey="day" 
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        background: theme.palette.mode === 'dark' ? '#1F2937' : '#fff',
                        border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: 8,
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="prospects" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clients" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución de estados */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: '100%',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,40,0.9)' 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Distribución de Estados
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        background: theme.palette.mode === 'dark' ? '#1F2937' : '#fff',
                        border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {/* Leyenda */}
              <Box sx={{ mt: 2 }}>
                {data.statusDistribution.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: item.color 
                    }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tiempos de respuesta por estado */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,40,0.9)' 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Timer sx={{ color: '#8B5CF6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tiempos de Respuesta por Estado
                </Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ space: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ space: 2 }}>
                  {data.responseTimes.statusResponseTimes.map((item, index) => (
                    <StatusTimeCard 
                      key={index}
                      status={item.status}
                      time={item.time}
                      color={item.color}
                    />
                  ))}
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Speed sx={{ color: '#10B981' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tiempo promedio de respuesta
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>
                    {data.responseTimes.averageResponseTime} minutos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Métricas de rendimiento */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,40,0.9)' 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Assessment sx={{ color: '#8B5CF6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Métricas de Rendimiento
                </Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ space: 2 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2 }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ space: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Conversión
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {data.performanceMetrics.conversionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.performanceMetrics.conversionRate} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#10B981',
                          borderRadius: 4,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ticket Promedio
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${data.performanceMetrics.averageDealSize.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(data.performanceMetrics.averageDealSize / 5000) * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#F59E0B',
                          borderRadius: 4,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ciclo de Ventas (días)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {data.performanceMetrics.salesCycle}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(data.performanceMetrics.salesCycle / 30) * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#8B5CF6',
                          borderRadius: 4,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Satisfacción del Cliente
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {data.performanceMetrics.customerSatisfaction}/5
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(data.performanceMetrics.customerSatisfaction / 5) * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#EF4444',
                          borderRadius: 4,
                        }
                      }} 
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Medios de Contacto: Prospectos e Inscritos (Barras vibrantes y alineadas) */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: '#1A237E', letterSpacing: 1, textAlign: 'left' }}>
          Medios de Contacto
        </Typography>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, borderRadius: 6, boxShadow: '0 8px 32px #8B5CF622', background: 'white', minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#8B5CF6', fontWeight: 900, fontSize: 22, textAlign: 'left' }}>
                Prospectos
              </Typography>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  layout="vertical"
                  data={contactChannels}
                  margin={{ top: 10, right: 40, left: 80, bottom: 10 }}
                  barCategoryGap={16}
                >
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={16} tick={{ fill: '#8B5CF6', fontWeight: 900 }} tickFormatter={v => typeof v === 'number' ? v.toLocaleString() : ''} />
                  <YAxis dataKey="channel" type="category" width={120} axisLine={false} tickLine={false} fontSize={16} tick={{ fill: '#8B5CF6', fontWeight: 900 }} />
                  <Bar dataKey="prospects" radius={[20, 20, 20, 20]} barSize={26} isAnimationActive>
                    <LabelList dataKey="prospects" position="right" style={{ fill: '#8B5CF6', fontWeight: 900, fontSize: 22 }} formatter={v => typeof v === 'number' ? v.toLocaleString() : ''} />
                    {contactChannels.map((entry, index) => (
                      <Cell key={`cell-prospects-${index}`} fill={index < 5 ? donutColors[index % donutColors.length] : pastelColors[index % pastelColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, borderRadius: 6, boxShadow: '0 8px 32px #10B98122', background: 'white', minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#10B981', fontWeight: 900, fontSize: 22, textAlign: 'left' }}>
                Inscritos
              </Typography>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  layout="vertical"
                  data={contactChannels}
                  margin={{ top: 10, right: 40, left: 80, bottom: 10 }}
                  barCategoryGap={16}
                >
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={16} tick={{ fill: '#10B981', fontWeight: 900 }} tickFormatter={v => typeof v === 'number' ? v.toLocaleString() : ''} />
                  <YAxis dataKey="channel" type="category" width={120} axisLine={false} tickLine={false} fontSize={16} tick={{ fill: '#10B981', fontWeight: 900 }} />
                  <Bar dataKey="inscritos" radius={[20, 20, 20, 20]} barSize={26} isAnimationActive>
                    <LabelList dataKey="inscritos" position="right" style={{ fill: '#10B981', fontWeight: 900, fontSize: 22 }} formatter={v => typeof v === 'number' ? v.toLocaleString() : ''} />
                    {contactChannels.map((entry, index) => (
                      <Cell key={`cell-inscritos-${index}`} fill={index < 5 ? donutColors[index % donutColors.length] : pastelColors[index % pastelColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Medios de Contacto Por Inscripción (Donut charts vibrantes y alineados) */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: '#1A237E', letterSpacing: 1, textAlign: 'left' }}>
          Medios de Contacto Por Inscripción
        </Typography>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, borderRadius: 6, boxShadow: '0 8px 32px #FFC30022', background: 'white', minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 900, color: '#FFC300', fontSize: 22, textAlign: 'left' }}>
                Ciclo 2506
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieContactCycle2506}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={70}
                    label={renderDonutLabelVibrant}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={4}
                    isAnimationActive
                  >
                    {pieContactCycle2506.map((entry, index) => (
                      <Cell key={`cell-pie2506-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                {pieContactCycle2506.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: donutColors[idx % donutColors.length] }} />
                    <Typography sx={{ fontWeight: 800, color: donutColors[idx % donutColors.length], fontSize: 17 }}>{item.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, borderRadius: 6, boxShadow: '0 8px 32px #FF573322', background: 'white', minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 900, color: '#FF5733', fontSize: 22, textAlign: 'left' }}>
                Ciclo 2406
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieContactCycle2406}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={70}
                    label={renderDonutLabelVibrant}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={4}
                    isAnimationActive
                  >
                    {pieContactCycle2406.map((entry, index) => (
                      <Cell key={`cell-pie2406-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                {pieContactCycle2406.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: donutColors[idx % donutColors.length] }} />
                    <Typography sx={{ fontWeight: 800, color: donutColors[idx % donutColors.length], fontSize: 17 }}>{item.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Pie charts premium de tipo de curso */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#1A237E', letterSpacing: 1 }}>
          Inscripciones por Tipo de Curso
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px #1A237E33', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.92)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#1A237E' }}>
                Ciclo 2506
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieTipoCurso2506}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    label={({ percent, name }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(1)}%` : ''}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={3}
                    isAnimationActive
                  >
                    {pieTipoCurso2506.map((entry, index) => (
                      <PieCell key={`cell-tipo2506-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" formatter={(value: string) => <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>} />
                  <RechartsTooltip formatter={v => `${v}%`} contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #1A237E33' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px #1976D233', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.92)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#1976D2' }}>
                Ciclo 2406
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieTipoCurso2406}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    label={({ percent, name }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(1)}%` : ''}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={3}
                    isAnimationActive
                  >
                    {pieTipoCurso2406.map((entry, index) => (
                      <PieCell key={`cell-tipo2406-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" formatter={(value: string) => <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>} />
                  <RechartsTooltip formatter={v => `${v}%`} contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #1976D233' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Total ganados por semana y por ciclo (premium) */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#1A237E', letterSpacing: 1 }}>
          Total Ganados
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px #8B5CF633', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.92)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#8B5CF6' }}>
                Por Semana
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={weeklyEarnings}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={15} tick={{ fill: '#8B5CF6', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={15} tick={{ fill: '#8B5CF6', fontWeight: 700 }} tickFormatter={v => typeof v === 'number' ? `$${v / 1000}k` : ''} />
                  <Bar dataKey="total" radius={[12, 12, 12, 12]} fill="#8B5CF6" barSize={32} isAnimationActive>
                    <LabelList dataKey="total" position="top" style={{ fill: '#8B5CF6', fontWeight: 800, fontSize: 18 }} formatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : ''} />
                    {weeklyEarnings.map((entry, index) => (
                      <Cell key={`cell-weekly-${index}`} fill="url(#weeklyGradient)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <RechartsTooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #8B5CF633' }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px #10B98133', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.92)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#10B981' }}>
                Por Ciclo
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cycleEarnings}>
                  <XAxis dataKey="cycle" axisLine={false} tickLine={false} fontSize={15} tick={{ fill: '#10B981', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={15} tick={{ fill: '#10B981', fontWeight: 700 }} tickFormatter={v => typeof v === 'number' ? `$${v / 1000}k` : ''} />
                  <Bar dataKey="total" radius={[12, 12, 12, 12]} fill="#10B981" barSize={32} isAnimationActive>
                    <LabelList dataKey="total" position="top" style={{ fill: '#10B981', fontWeight: 800, fontSize: 18 }} formatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : ''} />
                    {cycleEarnings.map((entry, index) => (
                      <Cell key={`cell-cycle-${index}`} fill="url(#cycleGradient)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="cycleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <RechartsTooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #10B98133' }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Metrics;