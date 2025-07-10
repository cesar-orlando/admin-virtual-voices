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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { getTableStats } from '../api/servicios/dynamicTableServices';

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

// Definición de ciclos
const CYCLES = [
  { id: "2505", label: "2505", start: "2025-04-28", end: "2025-05-25" },
  { id: "2506", label: "2506", start: "2025-05-26", end: "2025-06-22" },
  { id: "2507", label: "2507", start: "2025-06-23", end: "2025-07-20" },
  { id: "2508", label: "2508", start: "2025-07-21", end: "2025-08-24" },
  { id: "2509", label: "2509", start: "2025-08-25", end: "2025-09-21" },
  { id: "2510", label: "2510", start: "2025-09-22", end: "2025-10-19" },
  { id: "2511", label: "2511", start: "2025-10-20", end: "2025-11-16" },
  { id: "2512", label: "2512", start: "2025-11-17", end: "2025-12-14" },
  { id: "2601", label: "2601", start: "2025-12-15", end: "2026-01-25" },
];

// Función para obtener el ciclo actual basado en la fecha
const getCurrentCycle = () => {
  const today = new Date();
  const currentCycle = CYCLES.find(cycle => {
    const startDate = new Date(cycle.start);
    const endDate = new Date(cycle.end);
    return today >= startDate && today <= endDate;
  });
  return currentCycle || CYCLES[CYCLES.length - 1]; // Si no encuentra, devuelve el último
};

// Mock data para QuickLearning - COMENTADO PARA USAR DATOS REALES
const quickLearningMetrics = {
  alumnos: 12,
  clientes: 0,
  prospectos: 0,
  sinInteraccion: 469,
};

const quickLearningDonutData = [
  { name: 'Alumnos', value: quickLearningMetrics.alumnos, color: '#3B82F6' },
  { name: 'Clientes', value: quickLearningMetrics.clientes, color: '#10B981' },
  { name: 'Prospectos', value: quickLearningMetrics.prospectos, color: '#F59E0B' },
  { name: 'Sin interacción', value: quickLearningMetrics.sinInteraccion, color: '#EF4444' },
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

// Etiqueta simple y legible para la dona (dentro del anillo, color y sombra)
const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name, fill }: any) => {
  if (!value || value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <g>
      <rect x={x - 22} y={y - 16} width={44} height={28} rx={8} fill="#fff" opacity={0.85} />
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight={800}
        fontSize={18}
        style={{ filter: 'drop-shadow(0 1px 2px #0002)' }}
      >
        {`${percent > 0 ? (percent * 100).toFixed(1) : 0}%`}
      </text>
    </g>
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

const QuickLearningCard = ({ title, value, icon, color, loading = false }: { title: string; value: number; icon: React.ReactNode; color: string; loading?: boolean }) => (
  <Card sx={{
    minWidth: 220,
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 3,
    borderRadius: 4,
    border: `2px solid ${color}30`,
    background: `${color}05`,
    transition: 'transform 0.2s',
    '&:hover': { transform: 'scale(1.04)', boxShadow: `0 8px 32px ${color}20` },
    p: 2,
  }}>
    <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48, mb: 1 }}>{icon}</Avatar>
    {loading ? (
      <Skeleton variant="text" width={60} height={36} sx={{ mb: 0.5 }} />
    ) : (
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', fontSize: '2.2rem', mb: 0.5 }}>{value}</Typography>
    )}
    <Typography variant="body1" sx={{ color: color, fontWeight: 600, fontSize: '1.1rem', letterSpacing: 0.5 }}>{title}</Typography>
  </Card>
);

const QuickLearningDonut = ({ data }: { data: { name: string; value: number; color: string }[] }) => (
  <PieChart width={320} height={220}>
    <Pie
      data={data}
      cx={120}
      cy={110}
      innerRadius={55}
      outerRadius={85}
      paddingAngle={2}
      dataKey="value"
      isAnimationActive
      label={renderDonutLabel}
      labelLine={false}
    >
      {data.map((entry, idx) => (
        <Cell key={`cell-${idx}`} fill={entry.color} />
      ))}
    </Pie>
  </PieChart>
);

const Metrics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentCompany, user } = useAuth();
  const isQuickLearning = user?.companySlug === 'quicklearning';

  // Estado para el ciclo seleccionado
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycle());

  // Estado para los totales
  const [alumnos, setAlumnos] = useState<number>(0);
  const [sinContestar, setSinContestar] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Cargar datos reales al montar y cuando cambie el ciclo
  useEffect(() => {
    if (!isQuickLearning || !user) return;
    setLoading(true);
    
    // Por ahora usamos datos totales, pero aquí podrías implementar filtros por ciclo
    console.log(`Cargando datos para el ciclo: ${selectedCycle.label} (${selectedCycle.start} - ${selectedCycle.end})`);
    
    Promise.all([
      getTableStats('alumnos', user),
      getTableStats('sin_contestar', user)
    ]).then(([alumnosStats, sinContestarStats]) => {
      setAlumnos(alumnosStats?.totalRecords || 0);
      setSinContestar(sinContestarStats?.totalRecords || 0);
    }).catch(error => {
      console.error('Error loading data:', error);
      setAlumnos(0);
      setSinContestar(0);
    }).finally(() => setLoading(false));
  }, [isQuickLearning, user, selectedCycle]);

  // Orden y datos de las cards
  const total = alumnos + sinContestar;
  const metrics = [
    { title: 'Prospectos', value: 0, color: '#F59E0B', icon: <Assessment /> },
    { title: 'Sin contestar', value: sinContestar, color: '#EF4444', icon: <Cancel /> },
    { title: 'Nuevo ingreso', value: 0, color: '#10B981', icon: <CheckCircle /> },
    { title: 'Alumnos', value: alumnos, color: '#3B82F6', icon: <People /> },
  ];

  // Calcular porcentajes
  const donutData = metrics.map(m => ({
    name: m.title,
    value: total > 0 ? Math.round((m.value / total) * 100) : 0,
    color: m.color
  }));

  if (isQuickLearning) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', minWidth: '90vw' }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
              Dashboard de QuickLearning
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Resumen de interacción y actividad del ciclo
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Selector de Ciclo */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ciclo</InputLabel>
              <Select
                value={selectedCycle.id}
                label="Ciclo"
                onChange={(e) => {
                  const cycle = CYCLES.find(c => c.id === e.target.value);
                  if (cycle) setSelectedCycle(cycle);
                }}
                sx={{ 
                  bgcolor: theme.palette.background.paper,
                  '& .MuiSelect-select': { fontWeight: 600 }
                }}
              >
                {CYCLES.map((cycle) => (
                  <MenuItem key={cycle.id} value={cycle.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Ciclo {cycle.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(cycle.start).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(cycle.end).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={() => window.location.reload()} 
                disabled={loading} 
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  color: '#fff', 
                  '&:hover': { bgcolor: theme.palette.primary.dark } 
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Total de ciclo arriba */}
        <Card sx={{ mb: 4, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 2, borderRadius: 4 }}>
          <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700, mb: 1 }}>
            Total general del ciclo {selectedCycle.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {new Date(selectedCycle.start).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })} - {new Date(selectedCycle.end).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#222', mb: 2, letterSpacing: 1 }}>
            {total}
          </Typography>
          {selectedCycle.id === getCurrentCycle().id && (
            <Chip 
              label="Ciclo Actual" 
              color="success" 
              size="small" 
              sx={{ fontWeight: 600 }}
            />
          )}
        </Card>
        {/* Cards de métricas */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          {metrics.map((m, idx) => (
            <Grid item xs={12} sm={6} md={3} key={m.title}>
              <QuickLearningCard title={m.title} value={loading ? 0 : m.value} icon={m.icon} color={m.color} loading={loading} />
            </Grid>
          ))}
        </Grid>
        {/* Gráfica de dona con porcentajes */}
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 2, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700, mb: 1 }}>
                Distribución porcentual
              </Typography>
              <PieChart width={320} height={220}>
                <Pie
                  data={donutData}
                  cx={120}
                  cy={110}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive
                  label={renderDonutLabel}
                  labelLine={false}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600, mt: 1 }}>
                porcentaje
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pl: { md: 6, xs: 0 }, mt: { xs: 3, md: 0 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#222' }}>
                Leyenda
              </Typography>
              {donutData.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: item.color, mr: 1.5 }} />
                  <Typography variant="body1" sx={{ color: item.color, fontWeight: 600 }}>{item.name} ({item.value}%)</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Para otras empresas, dejar mensaje de "Próximamente"
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', minWidth: '90vw' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: '#222', mb: 1 }}>
        Dashboard de Métricas
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#6C63FF', mb: 4 }}>
        Análisis completo del rendimiento de tu negocio
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecf3 100%)',
          border: '1.5px solid #d1d5db',
          width: '100%',
          maxWidth: 700,
          textAlign: 'center',
          boxShadow: '0 4px 32px #6C63FF10',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              bgcolor: '#6C63FF',
              color: '#fff',
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              fontSize: 36,
              boxShadow: '0 2px 12px #6C63FF30',
            }}>
              <span role="img" aria-label="metrics">📊</span>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C63FF', mb: 1 }}>
              Dashboard de Métricas
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#6C63FF', fontWeight: 600, mb: 1 }}>
            Próximamente: Centro de análisis y seguimiento de tu negocio
          </Typography>
          <Typography variant="body2" sx={{ color: '#6C63FF', opacity: 0.8 }}>
            Estamos trabajando para traerte métricas detalladas y análisis avanzados
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Metrics;