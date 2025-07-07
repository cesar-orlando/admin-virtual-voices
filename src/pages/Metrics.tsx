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
import { useAuth } from '../hooks/useAuth';

// Mock data para las métricas - COMENTADO PARA USAR DATOS REALES
/*
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
*/

// Mock data para medios de contacto - COMENTADO PARA USAR DATOS REALES
/*
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
*/

// Mock data para pie chart de inscripción por medio (por ciclo) - COMENTADO PARA USAR DATOS REALES
/*
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
*/

// Mock data para pie chart de tipo de curso (por ciclo) - COMENTADO PARA USAR DATOS REALES
/*
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
*/

// Mock data para total ganados por semana y por ciclo - COMENTADO PARA USAR DATOS REALES
/*
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
*/

// Mock data para Milkasa - COMENTADO PARA USAR DATOS REALES
/*
const mockMilkasaMetrics = {
  totalProspects: 1247,
  totalProperties: 87,
  prospectsChange: 12.5,
  propertiesChange: 3.2,
};
*/

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
  const [loading, setLoading] = useState(false);
  // const [data, setData] = useState(mockMetricsData); // COMENTADO PARA USAR DATOS REALES
  const { currentCompany } = useAuth();

  // Detectar si es grupo-milkasa
  const isMilkasa = currentCompany?.slug === 'grupo-milkasa';

  useEffect(() => {
    // TODO: Cargar datos reales desde API
    // const timer = setTimeout(() => {
    //   setLoading(false);
    // }, 1500);
    // return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // TODO: Recargar datos reales desde API
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', minWidth: '90vw' }}>
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
      </Box>

      {/* Mensaje de Bienvenida */}
      <Card sx={{ 
        mb: 4,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
      }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Analytics sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: theme.palette.primary.main }}>
            Dashboard de Métricas
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Próximamente: Centro de análisis y seguimiento de tu negocio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estamos trabajando para traerte métricas detalladas y análisis avanzados
          </Typography>
        </CardContent>
      </Card>

      {/* Métricas principales - COMENTADAS PARA USAR DATOS REALES */}
      {/*
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isMilkasa ? (
          <>
            <Grid item xs={12} sm={6} md={6}>
              <MetricCard
                title="Total Prospectos"
                value={mockMilkasaMetrics.totalProspects}
                change={mockMilkasaMetrics.prospectsChange}
                icon={<People />}
                color="#8B5CF6"
                subtitle="Prospectos registrados este mes"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <MetricCard
                title="Total Propiedades"
                value={mockMilkasaMetrics.totalProperties}
                change={mockMilkasaMetrics.propertiesChange}
                icon={<Business />}
                color="#10B981"
                subtitle="Propiedades activas en inventario"
                loading={loading}
              />
            </Grid>
          </>
        ) : (
          <>
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
          </>
        )}
      </Grid>
      */}

      {/* Gráficos y métricas detalladas - COMENTADAS PARA USAR DATOS REALES */}
      {/*
      <Grid container spacing={3}>
        // ... resto de los gráficos comentados
      </Grid>
      */}
    </Box>
  );
};

export default Metrics;