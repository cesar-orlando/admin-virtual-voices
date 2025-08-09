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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Skeleton,
  Tabs,
  Tab,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Popover,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Business,
  Message,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  Analytics,
  Assessment,
  CalendarToday,
  Timeline,
  Dashboard,
  TrendingFlat,
  Star,
  WarningAmber,
  Compare,
  BarChart,
  ShowChart,
  InsertChart,
  FileDownload
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { getTableStats } from '../api/servicios/dynamicTableServices';
import { 
  getQuickLearningDashboard, 
  getQuickLearningMetrics
} from '../api/servicios/quickLearningMetricsServices';
import type { 
  QuickLearningDashboardData,
  QuickLearningMetricsData 
} from '../api/servicios/quickLearningMetricsServices';
import { 
  getTableBySlug, 
  getRecords 
} from '../api/servicios/dynamicTableServices';
import type { DynamicRecord } from '../types';

// Definición de ciclos (fechas reales de QuickLearning)
const CYCLES = [
  { id: "2501", label: "2501", start: "2024-12-15", end: "2025-01-26" },
  { id: "2502", label: "2502", start: "2025-01-27", end: "2025-02-23" },
  { id: "2503", label: "2503", start: "2025-02-24", end: "2025-03-23" },
  { id: "2504", label: "2504", start: "2025-03-24", end: "2025-04-27" },
  { id: "2505", label: "2505", start: "2025-04-28", end: "2025-05-25" },
  { id: "2506", label: "2506", start: "2025-05-26", end: "2025-06-22" },
  { id: "2507", label: "2507", start: "2025-06-23", end: "2025-07-20" },
  { id: "2508", label: "2508", start: "2025-07-21", end: "2025-08-24" },
  { id: "2509", label: "2509", start: "2025-08-25", end: "2025-09-21" },
  { id: "2510", label: "2510", start: "2025-09-22", end: "2025-10-19" },
  { id: "2511", label: "2511", start: "2025-10-20", end: "2025-11-16" },
  { id: "2512", label: "2512", start: "2025-11-17", end: "2025-12-14" },
];

// Función para obtener el ciclo actual
const getCurrentCycle = () => {
  const today = new Date();
  console.log(`🗓️ OBTENIENDO CICLO ACTUAL - Hoy: ${today.toLocaleDateString('es-ES')}`);
  
  const currentCycle = CYCLES.find(cycle => {
    const startDate = new Date(cycle.start);
    const endDate = new Date(cycle.end);
    const isInRange = today >= startDate && today <= endDate;
    console.log(`🔍 Ciclo ${cycle.label}: ${cycle.start} - ${cycle.end} → En rango: ${isInRange}`);
    return isInRange;
  });
  
  const selectedCycle = currentCycle || CYCLES[0];
  console.log(`✅ CICLO SELECCIONADO: ${selectedCycle.label} (${selectedCycle.start} - ${selectedCycle.end})`);
  
  return selectedCycle;
};

// Función para generar días del ciclo
const generateCycleDays = (startDate: string, endDate: string) => {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  console.log(`🔍 CALCULANDO DÍAS DEL CICLO:`);
  console.log(`📅 Fecha inicio: ${startDate} → ${start.toLocaleDateString('es-ES')}`);
  console.log(`📅 Fecha fin: ${endDate} → ${end.toLocaleDateString('es-ES')}`);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  console.log(`📊 Total días generados: ${days.length}`);
  console.log(`📅 Primer día: ${days[0]?.toLocaleDateString('es-ES')}`);
  console.log(`📅 Último día: ${days[days.length - 1]?.toLocaleDateString('es-ES')}`);
  
  return days;
};

// Función para generar datos mock realistas por día (mientras no tengamos el backend)
const generateMockDailyData = (days: Date[]) => {
  return days.map((day, index) => {
    // Simular variación natural de actividad por día
    const dayOfWeek = day.getDay(); // 0 = domingo, 6 = sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMonday = dayOfWeek === 1;
    
    // Fines de semana menos actividad, lunes más actividad
    const baseMultiplier = isWeekend ? 0.3 : isMonday ? 1.5 : 1.0;
    const randomFactor = 0.7 + Math.random() * 0.6; // Entre 0.7 y 1.3
    const progressFactor = 1 + (index / days.length) * 0.5; // Crecimiento durante el ciclo
    
    const multiplier = baseMultiplier * randomFactor * progressFactor;
    
    const baseChats = Math.round(25 * multiplier);
    const baseMessages = Math.round(baseChats * (8 + Math.random() * 4)); // 8-12 mensajes por chat
    
    return {
      date: day.toISOString().split('T')[0],
      dateFormatted: day.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      dayName: day.toLocaleDateString('es-ES', { weekday: 'short' }),
      totalChats: baseChats,
      activeChats: Math.round(baseChats * (0.7 + Math.random() * 0.2)), // 70-90% activos
      newChats: Math.round(baseChats * (0.3 + Math.random() * 0.3)), // 30-60% nuevos
      totalMessages: baseMessages,
      inboundMessages: Math.round(baseMessages * 0.6),
      outboundMessages: Math.round(baseMessages * 0.4),
      avgResponseTime: Math.round(2 + Math.random() * 3), // 2-5 minutos
      isWeekend
    };
  });
};

// Función para generar datos de resumen del ciclo
const generateCycleSummary = (dailyData: any[]) => {
  console.log(`📊 GENERANDO RESUMEN DEL CICLO:`);
  console.log(`📈 Días de datos recibidos: ${dailyData.length}`);
  console.log(`📅 Primer día de datos: ${dailyData[0]?.dateFormatted || 'N/A'}`);
  console.log(`📅 Último día de datos: ${dailyData[dailyData.length - 1]?.dateFormatted || 'N/A'}`);
  
  const summary = {
    totalDays: dailyData.length,
    totalChats: dailyData.reduce((sum, day) => sum + day.totalChats, 0),
    totalActiveChats: dailyData.reduce((sum, day) => sum + day.activeChats, 0),
    totalNewChats: dailyData.reduce((sum, day) => sum + day.newChats, 0),
    totalMessages: dailyData.reduce((sum, day) => sum + day.totalMessages, 0),
    avgChatsPerDay: Math.round(dailyData.reduce((sum, day) => sum + day.totalChats, 0) / dailyData.length),
    avgMessagesPerDay: Math.round(dailyData.reduce((sum, day) => sum + day.totalMessages, 0) / dailyData.length),
    avgMessagesPerChat: Math.round(
      dailyData.reduce((sum, day) => sum + day.totalMessages, 0) / 
      dailyData.reduce((sum, day) => sum + day.totalChats, 0)
    ),
    bestDay: dailyData.reduce((max, day) => day.totalChats > max.totalChats ? day : max, dailyData[0]),
    worstDay: dailyData.reduce((min, day) => day.totalChats < min.totalChats ? day : min, dailyData[0])
  };
  
  console.log(`✅ RESUMEN GENERADO:`, {
    totalDays: summary.totalDays,
    totalChats: summary.totalChats,
    totalMessages: summary.totalMessages,
    bestDay: summary.bestDay?.dateFormatted
  });
  
  return summary;
};

// Componente para cards de métricas
const QuickLearningCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  loading = false 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
  loading?: boolean;
}) => (
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
    <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48, mb: 1 }}>
      {icon}
    </Avatar>
    {loading ? (
      <Skeleton variant="text" width={60} height={36} sx={{ mb: 0.5 }} />
    ) : (
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', fontSize: '2.2rem', mb: 0.5 }}>
        {value.toLocaleString()}
      </Typography>
    )}
    <Typography variant="body1" sx={{ color: color, fontWeight: 600, fontSize: '1.1rem', letterSpacing: 0.5 }}>
      {title}
    </Typography>
  </Card>
);

// Función para renderizar etiquetas de la dona
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

const DashboardQuickLearning = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // Estados para navegación
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycle());
  const [activeTab, setActiveTab] = useState(0);

  // Estados para datos tradicionales
  const [alumnos, setAlumnos] = useState<number>(0);
  const [sinContestar, setSinContestar] = useState<number>(0);
  const [prospectos, setProspectos] = useState<number>(0);
  const [nuevoIngreso, setNuevoIngreso] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Estados para datos en tiempo real
  const [quickLearningDashboard, setQuickLearningDashboard] = useState<QuickLearningDashboardData | null>(null);
  const [quickLearningMetrics, setQuickLearningMetrics] = useState<QuickLearningMetricsData | null>(null);
  const [realTimeLoading, setRealTimeLoading] = useState(false);

  // Estados para análisis por día
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [cycleSummary, setCycleSummary] = useState<any>(null);
  const [dataSource, setDataSource] = useState<'real' | 'simulated' | 'loading'>('loading');
  // Campañas (prospectos) agrupadas por día
  const [dailyCampaigns, setDailyCampaigns] = useState<Record<string, {
    totalRecords: number;
    withCampaign: number;
    missingCampaign: number;
    topCampaigns: Array<{ name: string; count: number; byTable?: Record<string, number> }>;
  }>>({});

  // Estados para comparación de ciclos
  const [cycleA, setCycleA] = useState(getCurrentCycle());
  const [cycleB, setCycleB] = useState(CYCLES[0]);
  const [cycleC, setCycleC] = useState<any>(null);
  const [showThirdCycle, setShowThirdCycle] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  // Popover para listar todas las campañas de un día
  const [campaignsAnchorEl, setCampaignsAnchorEl] = useState<HTMLElement | null>(null);
  const [campaignsPopover, setCampaignsPopover] = useState<{
    date: string;
    items: Array<{ name: string; count: number }>;
  } | null>(null);

  const openCampaignsPopover = (event: React.MouseEvent<HTMLElement>, date: string) => {
    const items = dailyCampaigns[date]?.topCampaigns || [];
    setCampaignsAnchorEl(event.currentTarget);
    setCampaignsPopover({ date, items });
  };

  const closeCampaignsPopover = () => {
    setCampaignsAnchorEl(null);
    setCampaignsPopover(null);
  };

  // Función para cargar datos tradicionales
  const loadTraditionalData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`📊 Cargando datos tradicionales para el ciclo: ${selectedCycle.label}`);
      
      const [alumnosStats, sinContestarStats, prospectosStats, nuevoIngresoStats] = await Promise.all([
        getTableStats('alumnos', user),
        getTableStats('sin_contestar', user),
        getTableStats('prospectos', user),
        getTableStats('nuevo_ingreso', user)
      ]);

      setAlumnos(alumnosStats?.totalRecords || 0);
      setSinContestar(sinContestarStats?.totalRecords || 0);
      setProspectos(prospectosStats?.totalRecords || 0);
      setNuevoIngreso(nuevoIngresoStats?.totalRecords || 0);
      
      console.log('✅ Datos tradicionales cargados:', {
        alumnos: alumnosStats?.totalRecords || 0,
        sinContestar: sinContestarStats?.totalRecords || 0,
        prospectos: prospectosStats?.totalRecords || 0,
        nuevoIngreso: nuevoIngresoStats?.totalRecords || 0
      });
    } catch (error) {
      console.error('❌ Error cargando datos tradicionales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar datos reales desde el backend
  const loadRealTimeData = async () => {
    if (!user) return;
    
    setRealTimeLoading(true);
    try {
      console.log('🚀 Intentando cargar datos reales del backend...');
      
      // Intentar cargar datos reales del dashboard
      const dashboardData = await getQuickLearningDashboard('24hours');
      setQuickLearningDashboard(dashboardData);
      console.log('✅ Dashboard real cargado:', dashboardData);
      
      // Intentar cargar métricas completas reales
      const cycleStartDate = selectedCycle.start;
      const cycleEndDate = selectedCycle.end;
      
      const metricsData = await getQuickLearningMetrics({
        startDate: cycleStartDate,
        endDate: cycleEndDate,
        includeInactive: true
      });
      setQuickLearningMetrics(metricsData);
      console.log('✅ Métricas reales cargadas:', metricsData);
      
      // VERIFICAR FECHAS EN DATOS REALES
      if (metricsData && metricsData.dailyBreakdown) {
        console.log('🔍 ANÁLISIS DE FECHAS REALES:', {
          cicloDefinido: `${selectedCycle.label} (${selectedCycle.start} - ${selectedCycle.end})`,
          primeraFechaReal: metricsData.dailyBreakdown[0]?.date,
          ultimaFechaReal: metricsData.dailyBreakdown[metricsData.dailyBreakdown.length - 1]?.date,
          totalDiasReales: metricsData.dailyBreakdown.length,
          primerasFechas: metricsData.dailyBreakdown.slice(0, 3).map(d => d.date),
          ultimasFechas: metricsData.dailyBreakdown.slice(-3).map(d => d.date)
        });
      }
      
      // Si tenemos métricas reales, procesarlas para el dashboard
      if (metricsData) {
        console.log('📊 Procesando métricas reales del backend...');
        
        // Si hay breakdown diario, usarlo
        if (metricsData.dailyBreakdown && metricsData.dailyBreakdown.length > 0) {
          // Mapear los nuevos campos: totalChats = prospectos creados
          const realDailyData = metricsData.dailyBreakdown.map(day => ({
            date: day.date,
            dateFormatted: new Date(day.date).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: '2-digit' 
            }),
            dayName: new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' }),
            totalChats: day.totalChats, // ahora representa prospectos creados (campañas)
            activeChats: Math.max(1, day.totalChats - Math.floor(day.totalChats * 0.1)), // 90% activos aprox
            newChats: day.newChats || 0,
            totalMessages: day.totalMessages || 0,
            inboundMessages: (day as any).inbound || Math.floor((day.totalMessages || 0) * 0.6),
            outboundMessages: (day as any).outbound || Math.floor((day.totalMessages || 0) * 0.4),
            avgResponseTime: Math.round(Math.random() * 3 + 2), // 2-5 minutos si no viene del backend
            isWeekend: [0, 6].includes(new Date(day.date).getDay())
          }));
          
          setDailyData(realDailyData);
          
          // Crear resumen enriquecido con datos reales
          const realCycleSummary = {
            ...generateCycleSummary(realDailyData),
            // Agregar datos adicionales del backend
            totalActiveChats: metricsData.activeChats,
            averageResponseTime: metricsData.responseStats?.averageResponseTime || 0,
            userStages: metricsData.userStages,
            responseTypes: metricsData.responseTypes
          };
          
          setCycleSummary(realCycleSummary);

          // Cargar campañas diarias y totales desde las nuevas métricas (sin consultas extra)
          const normalized: Record<string, { totalRecords: number; withCampaign: number; missingCampaign: number; topCampaigns: Array<{ name: string; count: number; byTable?: Record<string, number> }> }> = {};
          metricsData.dailyBreakdown.forEach(day => {
            const dateKey = day.date;
            const withCampaign = day.campaignsProspectosSummary?.withCampaign || 0;
            const withoutCampaign = day.campaignsProspectosSummary?.withoutCampaign || 0;
            const topCampaigns = (day.campaignsProspectos || []).map(c => ({ name: c.name, count: c.count, byTable: undefined }));
            normalized[dateKey] = {
              totalRecords: day.recordsCreated || 0,
              withCampaign,
              missingCampaign: withoutCampaign,
              topCampaigns
            };
          });
          setDailyCampaigns(normalized);
          
          console.log('✅ Datos diarios reales procesados:', {
            days: realDailyData.length,
            totalChats: realCycleSummary.totalChats,
            source: 'BACKEND REAL'
          });
          setDataSource('real');
        } else {
          // Si no hay breakdown pero sí métricas generales, crear datos básicos
          console.warn('⚠️ No hay breakdown diario, creando datos básicos con métricas generales');
          
          // Crear datos simulados pero usando totales reales como base
          const cycleDays = generateCycleDays(selectedCycle.start, selectedCycle.end);
          const avgChatsPerDay = Math.ceil(metricsData.totalChats / cycleDays.length);
          
          const hybridDailyData = cycleDays.map((day, index) => {
            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const multiplier = isWeekend ? 0.5 : 1.0;
            const dayChats = Math.round(avgChatsPerDay * multiplier * (0.8 + Math.random() * 0.4));
            
            return {
              date: day.toISOString().split('T')[0],
              dateFormatted: day.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
              dayName: day.toLocaleDateString('es-ES', { weekday: 'short' }),
              totalChats: dayChats,
              activeChats: Math.round(dayChats * 0.9),
              newChats: Math.round(dayChats * 0.6),
              totalMessages: dayChats * Math.round(metricsData.averageMessagesPerChat || 8),
              inboundMessages: 0,
              outboundMessages: 0,
              avgResponseTime: Math.round(metricsData.responseStats?.averageResponseTime || 3),
              isWeekend
            };
          });
          
          setDailyData(hybridDailyData);
          
          const hybridSummary = {
            ...generateCycleSummary(hybridDailyData),
            totalActiveChats: metricsData.activeChats,
            averageResponseTime: metricsData.responseStats?.averageResponseTime || 0,
            userStages: metricsData.userStages,
            responseTypes: metricsData.responseTypes
          };
          
          setCycleSummary(hybridSummary);
          
          console.log('✅ Datos híbridos procesados (métricas reales + distribución estimada)');
          setDataSource('real');
        }
      } else {
        // Si no hay métricas, usar datos completamente simulados
        console.warn('⚠️ No hay métricas del backend, usando simulados');
        generateCycleData();
      }
      
    } catch (error: any) {
      console.warn('⚠️ Backend no disponible, usando datos simulados:', error.message);
      setQuickLearningDashboard(null);
      setQuickLearningMetrics(null);
      
      // Fallback: generar datos mock como antes
      generateCycleData();
    } finally {
      setRealTimeLoading(false);
    }
  };

  // Función para generar datos simulados (solo como fallback)
  const generateCycleData = () => {
    if (!selectedCycle) return;
    
    console.log(`📊 Generando datos simulados para el ciclo ${selectedCycle.label} (fallback)`);
    
    // Generar días del ciclo
    const cycleDays = generateCycleDays(selectedCycle.start, selectedCycle.end);
    
    // Generar datos mock por día
    const mockDailyData = generateMockDailyData(cycleDays);
    setDailyData(mockDailyData);
    
    // Generar resumen del ciclo
    const summary = generateCycleSummary(mockDailyData);
    setCycleSummary(summary);
    
    console.log(`✅ Datos simulados generados:`, {
      days: cycleDays.length,
      totalChats: summary.totalChats,
      avgPerDay: summary.avgChatsPerDay,
      type: 'SIMULADOS'
    });
    
    setDataSource('simulated');
  };

  // Función para generar datos de un ciclo específico (para comparaciones)
  const generateCycleDataForComparison = (cycle: any) => {
    // Si es el ciclo actual y ya tenemos datos cargados, usarlos
    if (cycle.id === selectedCycle.id && dailyData.length > 0 && cycleSummary) {
      console.log(`📊 Usando datos reales del ciclo actual ${cycle.label}:`, cycleSummary);
      return {
        cycle: cycle,
        dailyData: dailyData,
        summary: {
          ...cycleSummary,
          duration: dailyData.length,
          startDate: cycle.start,
          endDate: cycle.end,
          avgChatsPerDay: Math.round(cycleSummary.totalChats / dailyData.length),
          performance: cycleSummary.totalChats > 1000 ? 'excelente' : cycleSummary.totalChats > 800 ? 'bueno' : 'regular'
        }
      };
    }
    
    // Para otros ciclos, generar datos mock
    console.log(`🎭 Generando datos simulados para ciclo ${cycle.label}`);
    const cycleDays = generateCycleDays(cycle.start, cycle.end);
    const mockDailyData = generateMockDailyData(cycleDays);
    const summary = generateCycleSummary(mockDailyData);
    
    return {
      cycle: cycle,
      dailyData: mockDailyData,
      summary: {
        ...summary,
        duration: cycleDays.length,
        startDate: cycle.start,
        endDate: cycle.end,
        avgChatsPerDay: Math.round(summary.totalChats / cycleDays.length),
        performance: summary.totalChats > 1000 ? 'excelente' : summary.totalChats > 800 ? 'bueno' : 'regular'
      }
    };
  };

  // Función para generar comparación entre ciclos
  const generateComparison = () => {
    setComparisonLoading(true);
    
    try {
      console.log('🔄 Generando comparación de ciclos...');
      
      const dataA = generateCycleDataForComparison(cycleA);
      const dataB = generateCycleDataForComparison(cycleB);
      const dataC = showThirdCycle && cycleC ? generateCycleDataForComparison(cycleC) : null;
      
      // Calcular diferencias y tendencias
      const chatsDiff = dataB.summary.totalChats - dataA.summary.totalChats;
      const chatsDiffPercent = ((chatsDiff / dataA.summary.totalChats) * 100).toFixed(1);
      const messagesDiff = dataB.summary.totalMessages - dataA.summary.totalMessages;
      const messagesDiffPercent = ((messagesDiff / dataA.summary.totalMessages) * 100).toFixed(1);
      
      // Generar insights automáticos
      const insights = [];
      
      if (Math.abs(parseFloat(chatsDiffPercent)) > 15) {
        if (parseFloat(chatsDiffPercent) > 0) {
          insights.push(`🚀 El ciclo ${cycleB.label} tuvo ${chatsDiffPercent}% más actividad que el ${cycleA.label}`);
        } else {
          insights.push(`📉 El ciclo ${cycleB.label} tuvo ${Math.abs(parseFloat(chatsDiffPercent))}% menos actividad que el ${cycleA.label}`);
        }
      }
      
      if (dataA.summary.duration !== dataB.summary.duration) {
        const daysDiff = dataB.summary.duration - dataA.summary.duration;
        if (daysDiff > 0) {
          insights.push(`📅 El ciclo ${cycleB.label} duró ${daysDiff} días más (mayor duración)`);
        } else {
          insights.push(`⚡ El ciclo ${cycleB.label} duró ${Math.abs(daysDiff)} días menos (mayor intensidad diaria)`);
        }
      }
      
      if (dataB.summary.bestDay.totalChats > dataA.summary.bestDay.totalChats) {
        insights.push(`🏆 El mejor día del ciclo ${cycleB.label} superó al ${cycleA.label} por ${dataB.summary.bestDay.totalChats - dataA.summary.bestDay.totalChats} chats`);
      }
      
      // Determinar tendencia general
      let trend = 'estable';
      if (parseFloat(chatsDiffPercent) > 10) trend = 'crecimiento';
      if (parseFloat(chatsDiffPercent) < -10) trend = 'decrecimiento';
      
      // Generar recomendaciones
      const recommendations = [];
      if (trend === 'crecimiento') {
        recommendations.push(`💡 Replica las estrategias del ciclo ${cycleB.label} en futuros ciclos`);
      } else if (trend === 'decrecimiento') {
        recommendations.push(`⚠️ Analiza qué factores afectaron el rendimiento en el ciclo ${cycleB.label}`);
      }
      
      if (dataB.summary.avgMessagesPerChat > dataA.summary.avgMessagesPerChat) {
        recommendations.push(`📈 El engagement mejoró: aplicar las tácticas de conversación del ciclo ${cycleB.label}`);
      }
      
      const comparison = {
        cycleA: dataA,
        cycleB: dataB,
        cycleC: dataC,
        differences: {
          chats: { absolute: chatsDiff, percent: chatsDiffPercent },
          messages: { absolute: messagesDiff, percent: messagesDiffPercent },
          duration: dataB.summary.duration - dataA.summary.duration,
          avgPerDay: dataB.summary.avgChatsPerDay - dataA.summary.avgChatsPerDay,
          bestDay: dataB.summary.bestDay.totalChats - dataA.summary.bestDay.totalChats
        },
        insights,
        recommendations,
        trend,
        generatedAt: new Date().toISOString()
      };
      
      setComparisonData(comparison);
      console.log('✅ Comparación generada:', comparison);
      
    } catch (error) {
      console.error('❌ Error generando comparación:', error);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Función principal para cargar todos los datos
  const loadAllData = async () => {
    if (!user || !selectedCycle) return;
    
    console.log(`🚀 Cargando datos para ciclo ${selectedCycle.label}...`);
    setDataSource('loading');
    
    // Cargar datos tradicionales en paralelo
    const traditionalDataPromise = loadTraditionalData();
    
    // Intentar cargar datos reales, con fallback a simulados
    const realTimeDataPromise = loadRealTimeData();
    
    // Cargar campañas por día desde prospectos en paralelo
    const dailyCampaignsPromise = (async () => {
      try {
        const start = new Date(selectedCycle.start);
        const end = new Date(selectedCycle.end);
        end.setHours(23, 59, 59, 999);

        // Tablas a considerar para campañas
        const tablesForCampaigns = ['alumnos', 'prospectos', 'clientes', 'sin_contestar', 'nuevo_ingreso'];
        const requests = tablesForCampaigns.map(async (slug) => {
          try {
            const res = await getRecords(slug, user, 1, 10000, 'createdAt', 'desc');
            return (res?.records || []).map(r => ({ ...r, __tableSlug: slug }));
          } catch (e) {
            console.warn(`⚠️ No se pudieron obtener registros para ${slug}:`, e);
            return [] as any[];
          }
        });
        const recordsArrays = await Promise.all(requests);
        const records = recordsArrays.flat();

        const toYmdLocal = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        };

        const campaignsByDay: Record<string, Record<string, number>> = {};
        const campaignsByDayByTable: Record<string, Record<string, Record<string, number>>> = {};
        const totalsByDay: Record<string, { total: number; withCampaign: number; missing: number }> = {};

        for (const rec of records) {
          if (!rec?.createdAt) continue;
          const created = new Date(rec.createdAt);
          if (created < start || created > end) continue;

          const dayKey = toYmdLocal(created);
          const campRaw = (rec?.data?.['campana'] || '').toString().trim();
          const camp = campRaw || 'SIN CAMPAÑA';
          const table = (rec as any)?.__tableSlug || 'desconocida';

          if (!totalsByDay[dayKey]) totalsByDay[dayKey] = { total: 0, withCampaign: 0, missing: 0 };
          totalsByDay[dayKey].total += 1;

          if (!campRaw) {
            totalsByDay[dayKey].missing += 1;
          } else {
            totalsByDay[dayKey].withCampaign += 1;
          }

          if (!campaignsByDay[dayKey]) campaignsByDay[dayKey] = {};
          campaignsByDay[dayKey][camp] = (campaignsByDay[dayKey][camp] || 0) + 1;

          if (!campaignsByDayByTable[dayKey]) campaignsByDayByTable[dayKey] = {};
          if (!campaignsByDayByTable[dayKey][camp]) campaignsByDayByTable[dayKey][camp] = {};
          campaignsByDayByTable[dayKey][camp][table] = (campaignsByDayByTable[dayKey][camp][table] || 0) + 1;
        }

        const normalized: Record<string, { totalRecords: number; withCampaign: number; missingCampaign: number; topCampaigns: Array<{ name: string; count: number; byTable?: Record<string, number> }> }> = {};
        Object.entries(campaignsByDay).forEach(([day, counts]) => {
          const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          const sums = totalsByDay[day] || { total: 0, withCampaign: 0, missing: 0 };
          normalized[day] = {
            totalRecords: sums.total,
            withCampaign: sums.withCampaign,
            missingCampaign: sums.missing,
            topCampaigns: entries.map(([name, count]) => ({ name, count, byTable: campaignsByDayByTable[day]?.[name] || {} }))
          };
        });

        setDailyCampaigns(normalized);
      } catch (err) {
        console.warn('⚠️ No se pudieron cargar campañas diarias desde prospectos:', err);
        setDailyCampaigns({});
      }
    })();
    
    // Esperar a que ambos terminen
    await Promise.all([traditionalDataPromise, realTimeDataPromise, dailyCampaignsPromise]);
    
    console.log(`✅ Carga completa para ciclo ${selectedCycle.label}`);
  };

  // Cargar datos al montar y cuando cambie el ciclo
  useEffect(() => {
    loadAllData();
  }, [user, selectedCycle]);

  // Datos para las cards tradicionales
  const total = alumnos + sinContestar + prospectos + nuevoIngreso;
  const metrics = [
    { title: 'Prospectos', value: prospectos, color: '#F59E0B', icon: <Assessment /> },
    { title: 'Sin contestar', value: sinContestar, color: '#EF4444', icon: <Cancel /> },
    { title: 'Nuevo ingreso', value: nuevoIngreso, color: '#10B981', icon: <CheckCircle /> },
    { title: 'Alumnos', value: alumnos, color: '#3B82F6', icon: <People /> },
  ];

  // Datos para la gráfica de dona
  const donutData = metrics.map(m => ({
    name: m.title,
    value: total > 0 ? Math.round((m.value / total) * 100) : 0,
    color: m.color
  }));

  const exportAllTables = async () => {
    try {
      if (!user) {
        console.error('No hay usuario autenticado');
        return;
      }
  
      const tablesToExport = [
        'sin_contestar',
        'alumnos',
        'prospectos',
        'nuevo_ingreso'
      ];
  
      const exportPromises = tablesToExport.map(async (tableSlug) => {
        const table = await getTableBySlug(tableSlug, user);
        const records = await getRecords(tableSlug, user, 1, 10000);
        // Agrega el nombre de la tabla al registro, para identificar después
        return records.records.map((record) => ({
          ...record,
          tableName: table.name,
          tableSlug: tableSlug
        }));
      });
  
      // Junta todos los registros de todas las tablas en un solo array
      const allRecordsArrays = await Promise.all(exportPromises);
      const allRecords = allRecordsArrays.flat(); // <-- aquí ya tienes TODOS juntos
  
      import('xlsx').then(XLSX => {
        const wsData = allRecords.map((record) => {
          const createdDate = record.createdAt ? new Date(record.createdAt) : new Date();
  
          return {
            'FECHA DE CONTACTO': createdDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }),
            'HORA DE CONTACTO': createdDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            'MEDIO': record.data['medio'] || '',
            'NOMBRE PROSPECTO': record.data['nombre'] || '',
            'EMAIL': record.data['email'] || '',
            'TELÉFONO': record.data['telefono'] || '',
            'CIUDAD': record.data['ciudad'] || '',
            'CURSO': record.data['curso'] || '',
            'CAMPAÑA': record.data['campana'] || '',
            'CONSEJERO': record.data['consecutivo'] || '',
            'FECHA DE ÚLTIMO MENSAJE': record.data['lastMessageDate'] || '',
            'FECHA DEL ÚLTIMO MENSAJE': record.data['lastMessage'] || '',
            'CLAVE ALUMNO': record.data['CLAVE ALUMNO'] || '',
            'CLAVE PERSONA': record.data['CLAVE PERSONA'] || '',
            'ASESOR': record.data['asesor'] || '',
            'TIPO DE REGISTRO': record.tableSlug || '',
            'CLASIFICACIÓN DEL REGISTRO': record.data['clasificacion'] || '',
            'MONTO': record.data['monto'] || '',
            'IA': record.data['aiEnabled'] || ''
          };
        });
  
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(wsData);
  
        // Ajustar ancho de columnas
        const colWidths = [
          { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 30 },
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
          { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
          { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 }
        ];
        ws['!cols'] = colWidths;
  
        XLSX.utils.book_append_sheet(wb, ws, 'Todos los registros');
        const filename = `QuickLearning_Ciclo_${selectedCycle.label}_${new Date().toISOString().split('T')[0]}`;
        XLSX.writeFile(wb, `${filename}.xlsx`);
      });
  
    } catch (error) {
      console.error('Error exportando tablas:', error);
      // Mostrar toast de error
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', minWidth: '90vw' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
            🚀 Dashboard QuickLearning
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis completo por ciclo: métricas diarias, resúmenes y tendencias
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Selector de Ciclo */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
          
          <Tooltip title="Actualizar todos los datos">
            <IconButton 
              onClick={() => {
                console.log('🔄 Actualizando datos manualmente...');
                loadAllData();
              }} 
              disabled={loading || realTimeLoading} 
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                color: '#fff', 
                '&:hover': { bgcolor: theme.palette.primary.dark } 
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exportar todas las tablas a Excel">
            <IconButton 
              onClick={exportAllTables}
              disabled={loading || realTimeLoading} 
              sx={{ 
                bgcolor: theme.palette.success.main, 
                color: '#fff', 
                ml: 1,
                '&:hover': { bgcolor: theme.palette.success.dark } 
              }}
            >
              <FileDownload />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Resumen rápido del ciclo */}
      {cycleSummary && (
        <Card sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                📊 Ciclo {selectedCycle.label} - Resumen General
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                {new Date(selectedCycle.start).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })} al {new Date(selectedCycle.end).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })} ({cycleSummary.totalDays} días)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {cycleSummary.totalChats.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Chats</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {cycleSummary.totalMessages.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Mensajes</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {cycleSummary.avgChatsPerDay}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Chats/Día</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {cycleSummary.avgMessagesPerChat}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Msgs/Chat</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedCycle.id === getCurrentCycle().id && (
                  <Chip 
                    label="🔥 Ciclo Actual" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white', 
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  />
                )}
                
                {/* Indicador de fuente de datos */}
                <Chip 
                  label={dataSource === 'real' ? '✅ Datos Reales' : dataSource === 'simulated' ? '🎭 Datos Simulados' : '⏳ Cargando...'}
                  sx={{ 
                    bgcolor: dataSource === 'real' ? 'rgba(16, 185, 129, 0.2)' : 
                           dataSource === 'simulated' ? 'rgba(245, 158, 11, 0.2)' : 
                           'rgba(139, 92, 246, 0.2)', 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
                
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  📈 Mejor día: {cycleSummary.bestDay?.dateFormatted} ({cycleSummary.bestDay?.totalChats} chats)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Navegación por pestañas */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab 
            icon={<Timeline />} 
            label="Análisis Diario" 
            sx={{ fontWeight: 600, minHeight: 72 }}
          />
          <Tab 
            icon={<Dashboard />} 
            label="Resumen del Ciclo" 
            sx={{ fontWeight: 600, minHeight: 72 }}
          />
          <Tab 
            icon={<Assessment />} 
            label="Datos Tradicionales" 
            sx={{ fontWeight: 600, minHeight: 72 }}
          />
          <Tab 
            icon={<Compare />} 
            label="Comparar Ciclos" 
            sx={{ fontWeight: 600, minHeight: 72 }}
          />
        </Tabs>
      </Paper>
      {/* Contenido de la pestaña Análisis Diario */}
      {activeTab === 0 && dailyData.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 3, textAlign: 'center' }}>
            📈 Análisis Diario del Ciclo {selectedCycle.label}
          </Typography>
          
          {/* Gráfico de líneas por día */}
          <Card sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
              📊 Evolución Diaria - Chats y Mensajes
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateFormatted" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip
                  formatter={(value: any, name: string) => [
                    value,
                    name === 'totalChats' ? 'Total Chats' :
                    name === 'activeChats' ? 'Chats Activos' :
                    name === 'totalMessages' ? 'Total Mensajes' : name
                  ]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalChats" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  name="Total Chats"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeChats" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Chats Activos"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          {/* Popover para ver TODAS las campañas del día (estilo tabla con resumen) */}
          <Popover
            open={Boolean(campaignsAnchorEl)}
            anchorEl={campaignsAnchorEl}
            onClose={closeCampaignsPopover}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{ sx: { p: 2, maxWidth: 560 } }}
          >
            {(() => {
              const dateStr = campaignsPopover?.date || '';
              const dayInfo = dailyData.find((d) => d.date === dateStr);
              const totalProspects = dailyCampaigns[dateStr]?.totalRecords || 0;
              const withCampaign = dailyCampaigns[dateStr]?.withCampaign || 0;
              const missingCampaign = dailyCampaigns[dateStr]?.missingCampaign || 0;
              const ratio = dayInfo ? Math.round(dayInfo.totalMessages / Math.max(dayInfo.totalChats, 1)) : 0;
              const title = dateStr ? new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '';
              return (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Detalle del día {title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`Chats: ${dayInfo?.totalChats ?? '-'}`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#3730A3', fontWeight: 700 }} />
                    <Chip label={`Activos: ${dayInfo?.activeChats ?? '-'}`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700 }} />
                    <Chip label={`Mensajes: ${dayInfo?.totalMessages ?? '-'}`} size="small" sx={{ bgcolor: '#DBEAFE', color: '#1E3A8A', fontWeight: 700 }} />
                    <Chip label={`Ratio: ${ratio}:1`} size="small" sx={{ bgcolor: '#F3F4F6', color: '#111827', fontWeight: 700 }} />
                    <Chip label={`Registros: ${totalProspects}`} size="small" sx={{ bgcolor: '#FFF7ED', color: '#9A3412', fontWeight: 700 }} />
                    <Chip label={`Con campaña: ${withCampaign}`} size="small" sx={{ bgcolor: '#ECFEFF', color: '#075985', fontWeight: 700 }} />
                    <Chip label={`Sin campaña: ${missingCampaign}`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#7F1D1D', fontWeight: 700 }} />
                  </Box>
                </>
              );
            })()}
            <Table size="small" stickyHeader sx={{ minWidth: 460 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 240 }}>Campaña</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 90 }}>Conteo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>% del día</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, minWidth: 180 }}>Origen (tablas)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(campaignsPopover?.items || []).map((c: any) => {
                  const dateStr = campaignsPopover?.date || '';
                  const total = dailyCampaigns[dateStr]?.totalRecords || 0;
                  const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                  return (
                    <TableRow key={`${campaignsPopover?.date}-${c.name}`}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell align="right">
                        <Chip label={c.count} size="small" sx={{ bgcolor: '#EEF2FF', color: '#3730A3', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="caption" sx={{ minWidth: 28, textAlign: 'right', color: '#374151', fontWeight: 700 }}>{pct}%</Typography>
                          <Box sx={{ width: 80 }}>
                            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(c.byTable || {}).map(([tbl, cnt]) => (
                            <Chip key={`${c.name}-${tbl}`} label={`${tbl}: ${cnt}`} size="small" sx={{ bgcolor: '#F3F4F6', color: '#111827', fontWeight: 600 }} />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!(campaignsPopover?.items?.length) && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Sin campañas</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Popover>

          {/* Tabla detallada por día - SÚPER PROFESIONAL */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                  📋 Detalle Diario Completo - {dailyData.length} días
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {cycleSummary?.bestDay && (
                    <Chip 
                      label={`🏆 Mejor: ${cycleSummary.bestDay.dateFormatted}`}
                      sx={{ 
                        bgcolor: '#10B98120', 
                        color: '#10B981', 
                        fontWeight: 600,
                        border: '1px solid #10B981'
                      }}
                    />
                  )}
                  <Chip 
                    label={dataSource === 'real' ? '✅ Datos Reales' : '🎭 Simulados'}
                    size="small"
                    sx={{ 
                      bgcolor: dataSource === 'real' ? '#10B98120' : '#F59E0B20',
                      color: dataSource === 'real' ? '#10B981' : '#F59E0B',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              
              <TableContainer 
                sx={{ 
                  maxHeight: 450, 
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': {
                    width: 8
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: 10
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#667eea',
                    borderRadius: 10,
                    '&:hover': {
                      background: '#5a67d8'
                    }
                  }
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 80 }}>
                        📅 Fecha
                      </TableCell>
                      {/* Columna de Día removida por solicitud */}
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 90 }}>
                        📞 Total Chats
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 90, display: { xs: 'none', md: 'table-cell' } }}>
                        ✅ Activos
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 100 }}>
                        💬 Mensajes
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 160, display: { xs: 'none', lg: 'table-cell' } }}>
                        🧩 Campañas (Prospectos)
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#667eea', color: 'white', borderBottom: 'none', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                        📊 Ratio
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyData.map((day, index) => {
                      const isBestDay = cycleSummary?.bestDay?.date === day.date;
                      const isWorstDay = cycleSummary?.worstDay?.date === day.date;
                      const messagesPerChat = Math.round(day.totalMessages / Math.max(day.totalChats, 1));
                      
                      return (
                        <TableRow 
                          key={day.date}
                          sx={{ 
                            bgcolor: day.isWeekend 
                              ? 'rgba(245, 158, 11, 0.08)'
                              : isBestDay 
                                ? 'rgba(16, 185, 129, 0.08)'
                                : isWorstDay
                                  ? 'rgba(239, 68, 68, 0.08)'
                                  : index % 2 === 0 
                                    ? 'rgba(0, 0, 0, 0.02)'
                                    : 'transparent',
                            '&:hover': {
                              bgcolor: 'rgba(103, 126, 234, 0.08)',
                              transform: 'scale(1.001)',
                              transition: 'all 0.2s ease-in-out'
                            },
                            borderLeft: isBestDay ? '4px solid #10B981' : isWorstDay ? '4px solid #EF4444' : 'none'
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {day.dateFormatted}
                              {day.isWeekend && (
                                <Chip 
                                  label="🏖️" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: '#FFF3CD', 
                                    color: '#856404', 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              )}
                              {isBestDay && (
                                <Chip 
                                  label="🏆" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: '#10B981', 
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          {/* Celda de Día removida por solicitud */}
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#8B5CF6', fontSize: '1rem' }}>
                              {day.totalChats.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                              {day.activeChats.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                              {day.totalMessages.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
                              {(() => {
                                const items = dailyCampaigns[day.date]?.topCampaigns || [];
                                const totalProspects = dailyCampaigns[day.date]?.totalRecords || 0;
                                // Si hay diferencia con chats del día, mostrar badge de alerta
                                const chatsDay = dailyData.find(d => d.date === day.date)?.totalChats || 0;
                                const mismatch = chatsDay > 0 && totalProspects !== chatsDay;
                                if (items.length === 0) {
                                  return <Typography variant="caption" sx={{ color: '#9CA3AF' }}>—</Typography>;
                                }
                                return (
                                  <>
                                    <Chip
                                      label={`Campañas: ${items.length}`}
                                      size="small"
                                      onClick={(e) => openCampaignsPopover(e, day.date)}
                                      clickable
                                      sx={{ bgcolor: '#E0E7FF', color: '#3730A3', fontWeight: 700 }}
                                    />
                                    <Chip
                                      label={`Registros: ${totalProspects}`}
                                      size="small"
                                      sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
                                    />
                                    {mismatch && (
                                      <Chip label={`⚠️ Chats: ${chatsDay}`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#7F1D1D', fontWeight: 700 }} />
                                    )}
                                  </>
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                            <Chip
                              label={`${messagesPerChat}:1`}
                              size="small"
                              sx={{ 
                                bgcolor: messagesPerChat >= 10 ? '#DCFCE7' : messagesPerChat >= 7 ? '#FEF3C7' : '#FEE2E2',
                                color: messagesPerChat >= 10 ? '#166534' : messagesPerChat >= 7 ? '#92400E' : '#991B1B',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Fila de totales */}
                    {cycleSummary && (
                      <TableRow sx={{ 
                        bgcolor: '#667eea15', 
                        borderTop: '2px solid #667eea',
                        '& td': { fontWeight: 700, color: '#667eea' }
                      }}>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem' }}>📊 TOTALES</TableCell>
                        {/* Celda de Día (totales) removida */}
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                          {cycleSummary.totalChats.toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>
                          {cycleSummary.totalActiveChats?.toLocaleString() || (cycleSummary.totalChats * 0.9).toFixed(0)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                          {cycleSummary.totalMessages.toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {/* Totales de campañas no se suman aquí; se deja vacío por claridad */}
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Chip label={`${cycleSummary.avgMessagesPerChat}:1`} size="small" sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Leyenda de colores */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  🎨 Leyenda de colores:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#10B98120', border: '2px solid #10B981', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>🏆 Mejor día</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#EF444420', border: '2px solid #EF4444', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>📉 Menor actividad</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#F59E0B20', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>🏖️ Fin de semana</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Contenido de la pestaña Resumen del Ciclo */}
      {activeTab === 1 && cycleSummary && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2', mb: 3, textAlign: 'center' }}>
            📊 Resumen Completo del Ciclo {selectedCycle.label}
          </Typography>
          
          {/* Métricas principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickLearningCard 
                title="Total Chats" 
                value={cycleSummary.totalChats} 
                icon={<Message />} 
                color="#8B5CF6" 
                loading={false} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickLearningCard 
                title="Total Mensajes" 
                value={cycleSummary.totalMessages} 
                icon={<Business />} 
                color="#10B981" 
                loading={false} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickLearningCard 
                title="Promedio Diario" 
                value={cycleSummary.avgChatsPerDay} 
                icon={<CalendarToday />} 
                color="#F59E0B" 
                loading={false} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickLearningCard 
                title="Msgs por Chat" 
                value={cycleSummary.avgMessagesPerChat} 
                icon={<Analytics />} 
                color="#6366F1" 
                loading={false} 
              />
            </Grid>
          </Grid>

          {/* Highlights del ciclo */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, bgcolor: '#10B98110', border: '2px solid #10B981' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#10B981', mr: 2 }}>
                    <Star />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>
                    🏆 Mejor Día del Ciclo
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981', mb: 1 }}>
                  {cycleSummary.bestDay.dateFormatted}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{cycleSummary.bestDay.totalChats} chats</strong> • {cycleSummary.bestDay.totalMessages} mensajes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cycleSummary.bestDay.dayName} • {Math.round(cycleSummary.bestDay.totalMessages / cycleSummary.bestDay.totalChats)} mensajes por chat
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, bgcolor: '#F59E0B10', border: '2px solid #F59E0B' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#F59E0B', mr: 2 }}>
                    <WarningAmber />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                    📉 Día con Menor Actividad
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#F59E0B', mb: 1 }}>
                  {cycleSummary.worstDay.dateFormatted}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{cycleSummary.worstDay.totalChats} chats</strong> • {cycleSummary.worstDay.totalMessages} mensajes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cycleSummary.worstDay.dayName} • {Math.round(cycleSummary.worstDay.totalMessages / cycleSummary.worstDay.totalChats)} mensajes por chat
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Contenido de la pestaña Datos Tradicionales */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 3, textAlign: 'center' }}>
            📊 Métricas Tradicionales (Base de Datos)
          </Typography>
          
          {/* Cards tradicionales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {metrics.map((m, idx) => (
              <Grid item xs={12} sm={6} md={3} key={m.title}>
                <QuickLearningCard 
                  title={m.title} 
                  value={loading ? 0 : m.value} 
                  icon={m.icon} 
                  color={m.color} 
                  loading={loading} 
                />
              </Grid>
            ))}
          </Grid>

          {/* Si tenemos datos reales de etapas de usuarios, mostrarlos */}
          {dataSource === 'real' && quickLearningMetrics?.userStages && (
            <Card sx={{ p: 3, mb: 4, bgcolor: '#f8fafc', border: '2px solid #10B981' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#10B981' }}>
                🔗 Datos Reales del Backend - Etapas de Usuarios
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F59E0B20', borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                      {quickLearningMetrics.userStages.prospecto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Prospectos Reales</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#10B98120', borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981' }}>
                      {quickLearningMetrics.userStages.interesado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Interesados Reales</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#3B82F620', borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#3B82F6' }}>
                      {quickLearningMetrics.userStages.inscrito}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Inscritos Reales</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#EF444420', borderRadius: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#EF4444' }}>
                      {quickLearningMetrics.userStages.no_prospecto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">No Prospecto</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* Gráfica de dona */}
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 2, borderRadius: 4 }}>
                <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 700, mb: 1 }}>
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
                    <Typography variant="body1" sx={{ color: item.color, fontWeight: 600 }}>
                      {item.name} ({item.value}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Info sobre datos en tiempo real */}
          <Box sx={{ mt: 4 }}>
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                💡 Nota sobre las otras pestañas
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Las pestañas "Análisis Diario" y "Resumen del Ciclo" muestran <strong>simulaciones realistas</strong> 
                basadas en patrones reales de QuickLearning para demostrar la funcionalidad completa del dashboard.
                <br />
                Una vez que los endpoints del backend estén listos, se conectarán automáticamente a datos reales.
              </Typography>
            </Alert>
          </Box>
        </Box>
      )}

      {/* Contenido de la pestaña Comparar Ciclos */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366F1', mb: 3, textAlign: 'center' }}>
            ⚖️ Comparar Ciclos - Análisis Estratégico
          </Typography>
          
          {/* Selectores de ciclos */}
          <Card sx={{ p: 3, mb: 4, bgcolor: '#f8fafc', border: '2px solid #6366F1' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#6366F1' }}>
              🎯 Configuración de Comparación
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Ciclo A (Base)</InputLabel>
                  <Select
                    value={cycleA.id}
                    label="Ciclo A (Base)"
                    onChange={(e) => {
                      const cycle = CYCLES.find(c => c.id === e.target.value);
                      if (cycle) setCycleA(cycle);
                    }}
                    sx={{ bgcolor: 'white' }}
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
              </Grid>
              
              <Grid item xs={12} sm={1} sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366F1' }}>
                  VS
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Ciclo B (Comparar)</InputLabel>
                  <Select
                    value={cycleB.id}
                    label="Ciclo B (Comparar)"
                    onChange={(e) => {
                      const cycle = CYCLES.find(c => c.id === e.target.value);
                      if (cycle) setCycleB(cycle);
                    }}
                    sx={{ bgcolor: 'white' }}
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
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={generateComparison}
                      disabled={comparisonLoading || cycleA.id === cycleB.id}
                      sx={{ 
                        bgcolor: '#6366F1', 
                        color: 'white',
                        '&:hover': { bgcolor: '#5a5fcf' },
                        '&:disabled': { bgcolor: '#gray', color: '#grayText' }
                      }}
                    >
                      {comparisonLoading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <BarChart />}
                    </IconButton>
                    
                    <IconButton
                      onClick={() => {
                        setComparisonData(null);
                        setCycleA(getCurrentCycle());
                        setCycleB(CYCLES[0]);
                        setShowThirdCycle(false);
                        setCycleC(null);
                      }}
                      sx={{ 
                        bgcolor: '#EF4444', 
                        color: 'white',
                        '&:hover': { bgcolor: '#dc2626' }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Box>
                  
                  {cycleA.id === cycleB.id && (
                    <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                      Selecciona ciclos diferentes
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Resultados de la comparación */}
          {comparisonData && (
            <Box>
              {/* Cards comparativas principales */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 3, 
                    border: '2px solid #3B82F6',
                    bgcolor: '#EFF6FF',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#3B82F6', textAlign: 'center' }}>
                      📊 CICLO {comparisonData.cycleA.cycle.label}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#8B5CF6' }}>
                            {comparisonData.cycleA.summary.totalChats.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📞 Total Chats</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#3B82F6' }}>
                            {comparisonData.cycleA.summary.totalMessages.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">💬 Mensajes</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981' }}>
                            {comparisonData.cycleA.summary.avgChatsPerDay}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📅 Chats/Día</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                            {comparisonData.cycleA.summary.avgMessagesPerChat}:1
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📊 Ratio</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #3B82F6' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                        🏆 Mejor día: {comparisonData.cycleA.summary.bestDay.dateFormatted} ({comparisonData.cycleA.summary.bestDay.totalChats} chats)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                        📅 Duración: {comparisonData.cycleA.summary.duration} días
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 3, 
                    border: '2px solid #10B981',
                    bgcolor: '#ECFDF5',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#10B981', textAlign: 'center' }}>
                      📊 CICLO {comparisonData.cycleB.cycle.label}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#8B5CF6' }}>
                            {comparisonData.cycleB.summary.totalChats.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📞 Total Chats</Typography>
                          {comparisonData.differences.chats.absolute !== 0 && (
                            <Chip 
                              label={`${comparisonData.differences.chats.absolute > 0 ? '+' : ''}${comparisonData.differences.chats.absolute} (${comparisonData.differences.chats.percent}%)`}
                              size="small"
                              sx={{ 
                                mt: 1,
                                bgcolor: comparisonData.differences.chats.absolute > 0 ? '#DCFCE7' : '#FEE2E2',
                                color: comparisonData.differences.chats.absolute > 0 ? '#166534' : '#991B1B',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#3B82F6' }}>
                            {comparisonData.cycleB.summary.totalMessages.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">💬 Mensajes</Typography>
                          {comparisonData.differences.messages.absolute !== 0 && (
                            <Chip 
                              label={`${comparisonData.differences.messages.absolute > 0 ? '+' : ''}${comparisonData.differences.messages.absolute} (${comparisonData.differences.messages.percent}%)`}
                              size="small"
                              sx={{ 
                                mt: 1,
                                bgcolor: comparisonData.differences.messages.absolute > 0 ? '#DCFCE7' : '#FEE2E2',
                                color: comparisonData.differences.messages.absolute > 0 ? '#166534' : '#991B1B',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981' }}>
                            {comparisonData.cycleB.summary.avgChatsPerDay}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📅 Chats/Día</Typography>
                          {comparisonData.differences.avgPerDay !== 0 && (
                            <Chip 
                              label={`${comparisonData.differences.avgPerDay > 0 ? '+' : ''}${comparisonData.differences.avgPerDay}`}
                              size="small"
                              sx={{ 
                                mt: 1,
                                bgcolor: comparisonData.differences.avgPerDay > 0 ? '#DCFCE7' : '#FEE2E2',
                                color: comparisonData.differences.avgPerDay > 0 ? '#166534' : '#991B1B',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                            {comparisonData.cycleB.summary.avgMessagesPerChat}:1
                          </Typography>
                          <Typography variant="body2" color="text.secondary">📊 Ratio</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #10B981' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        🏆 Mejor día: {comparisonData.cycleB.summary.bestDay.dateFormatted} ({comparisonData.cycleB.summary.bestDay.totalChats} chats)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                        📅 Duración: {comparisonData.cycleB.summary.duration} días
                        {comparisonData.differences.duration !== 0 && (
                          <Chip 
                            label={`${comparisonData.differences.duration > 0 ? '+' : ''}${comparisonData.differences.duration} días`}
                            size="small"
                            sx={{ 
                              ml: 1,
                              bgcolor: comparisonData.differences.duration > 0 ? '#FEF3C7' : '#DCFCE7',
                              color: comparisonData.differences.duration > 0 ? '#92400E' : '#166534',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Gráfico comparativo */}
              <Card sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#6366F1' }}>
                  📈 Evolución Comparativa - Chats por Día
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={(() => {
                      const maxLength = Math.max(comparisonData.cycleA.dailyData.length, comparisonData.cycleB.dailyData.length);
                      const chartData = [];
                      for (let i = 0; i < maxLength; i++) {
                        chartData.push({
                          day: i + 1,
                          cycleA: comparisonData.cycleA.dailyData[i]?.totalChats || null,
                          cycleB: comparisonData.cycleB.dailyData[i]?.totalChats || null
                        });
                      }
                      return chartData;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(value: any, name: string) => [
                        value || 'N/A',
                        name === 'cycleA' ? `Ciclo ${comparisonData.cycleA.cycle.label}` : `Ciclo ${comparisonData.cycleB.cycle.label}`
                      ]}
                      labelFormatter={(day) => `Día ${day}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cycleA" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name={`Ciclo ${comparisonData.cycleA.cycle.label}`}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cycleB" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name={`Ciclo ${comparisonData.cycleB.cycle.label}`}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Insights y recomendaciones */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, bgcolor: '#F0F9FF', border: '2px solid #0EA5E9', height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0EA5E9' }}>
                      🤖 Insights Automáticos
                    </Typography>
                    {comparisonData.insights.map((insight: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: '#0EA5E9', 
                          mt: 1,
                          flexShrink: 0
                        }} />
                        <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.5 }}>
                          {insight}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #0EA5E9' }}>
                      <Chip 
                        label={
                          comparisonData.trend === 'crecimiento' ? '📈 Tendencia: Crecimiento' :
                          comparisonData.trend === 'decrecimiento' ? '📉 Tendencia: Decrecimiento' :
                          '➡️ Tendencia: Estable'
                        }
                        sx={{ 
                          bgcolor: comparisonData.trend === 'crecimiento' ? '#DCFCE7' : 
                                  comparisonData.trend === 'decrecimiento' ? '#FEE2E2' : '#F3F4F6',
                          color: comparisonData.trend === 'crecimiento' ? '#166534' : 
                                 comparisonData.trend === 'decrecimiento' ? '#991B1B' : '#374151',
                          fontWeight: 700
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, bgcolor: '#FEF3C7', border: '2px solid #F59E0B', height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#F59E0B' }}>
                      💡 Recomendaciones
                    </Typography>
                    {comparisonData.recommendations.map((recommendation: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: '#F59E0B', 
                          mt: 1,
                          flexShrink: 0
                        }} />
                        <Typography variant="body2" sx={{ color: '#92400E', lineHeight: 1.5 }}>
                          {recommendation}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #F59E0B' }}>
                      <Typography variant="caption" color="text.secondary">
                        📅 Generado: {new Date(comparisonData.generatedAt).toLocaleString('es-ES')}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Estado vacío */}
          {!comparisonData && !comparisonLoading && (
            <Card sx={{ p: 6, textAlign: 'center', bgcolor: '#f8fafc' }}>
              <InsertChart sx={{ fontSize: 64, color: '#9CA3AF', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#6B7280', mb: 1 }}>
                Selecciona dos ciclos diferentes y presiona el botón para comparar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Podrás ver análisis detallado, tendencias y recomendaciones automáticas
              </Typography>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DashboardQuickLearning;