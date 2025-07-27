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
  Campaign,
  LocationCity,
  Share,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LabelList, Legend, Pie as PieCell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { getTableStats } from '../api/servicios/dynamicTableServices';
import { keyframes } from '@mui/system';

// Datos para ciclos académicos
const CYCLES = [
  {
    id: '2506',
    label: 'Mayo-Junio 2025',
    start: '2025-05-01',
    end: '2025-06-30'
  },
  {
    id: '2507',
    label: 'Julio-Agosto 2025',
    start: '2025-07-01',
    end: '2025-08-31'
  },
  {
    id: '2509',
    label: 'Septiembre-Octubre 2025',
    start: '2025-09-01',
    end: '2025-10-31'
  }
];

// Función para obtener el ciclo actual
function getCurrentCycle() {
  const today = new Date();
  const currentCycle = CYCLES.find(cycle => {
    const start = new Date(cycle.start);
    const end = new Date(cycle.end);
    return today >= start && today <= end;
  });
  return currentCycle || CYCLES[0];
}

// Función para renderizar labels en el gráfico de dona
const renderDonutLabel = ({ value }: { value: number }) => {
  return `${value}%`;
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: number;
  subtitle?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, change, subtitle, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (loading) {
    return (
      <Card sx={{ position: 'relative', overflow: 'hidden', height: 120 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${color}20`,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.8)' 
          : 'rgba(255,255,255,0.9)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: { xs: 'none', md: 'translateY(-4px)' },
          boxShadow: `0 8px 32px ${color}20`,
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500, 
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: { xs: '0.7rem', md: '0.75rem' }
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
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`, 
              color: color,
              width: { xs: 40, md: 56 },
              height: { xs: 40, md: 56 },
              boxShadow: `0 4px 16px ${color}30`,
              flexShrink: 0
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: '#10B981', fontSize: { xs: 14, md: 16 } }} />
            ) : (
              <TrendingDown sx={{ color: '#EF4444', fontSize: { xs: 14, md: 16 } }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                color: change >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              {change >= 0 ? '+' : ''}{change}%
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              vs mes anterior
            </Typography>
          </Box>
        )}
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1, 
              fontSize: { xs: '0.7rem', md: '0.75rem' }
            }}
          >
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
          width: { xs: '60px', md: '100px' }, 
          height: { xs: '60px', md: '100px' }, 
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} 
      />
    </Card>
  );
};

const StatusTimeCard = ({ status, time, color }: { status: string; time: number; color: string }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card sx={{ 
      p: { xs: 1.5, md: 2 }, 
      background: theme.palette.mode === 'dark' 
        ? 'rgba(30,30,40,0.8)' 
        : 'rgba(255,255,255,0.8)',
      border: `1px solid ${color}30`,
      borderRadius: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1, md: 2 }
      }}>
        <Box sx={{ 
          width: { xs: 10, md: 12 }, 
          height: { xs: 10, md: 12 }, 
          borderRadius: '50%', 
          bgcolor: color 
        }} />
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500, 
            flex: 1,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {status}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700, 
            color,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {time} min
        </Typography>
      </Box>
    </Card>
  );
};

const QuickLearningCard = ({ title, value, icon, color, loading = false }: { title: string; value: number; icon: React.ReactNode; color: string; loading?: boolean }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card sx={{
      minWidth: { xs: 160, md: 220 },
      minHeight: { xs: 100, md: 120 },
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: 3,
      borderRadius: { xs: 3, md: 4 },
      border: `2px solid ${color}30`,
      background: `${color}05`,
      transition: 'transform 0.2s',
      '&:hover': { 
        transform: { xs: 'scale(1.02)', md: 'scale(1.04)' }, 
        boxShadow: `0 8px 32px ${color}20` 
      },
      p: { xs: 1.5, md: 2 },
    }}>
      <Avatar sx={{ 
        bgcolor: `${color}15`, 
        color, 
        width: { xs: 40, md: 48 }, 
        height: { xs: 40, md: 48 }, 
        mb: 1 
      }}>
        {icon}
      </Avatar>
      {loading ? (
        <Skeleton 
          variant="text" 
          width={60} 
          height={isMobile ? 28 : 36} 
          sx={{ mb: 0.5 }} 
        />
      ) : (
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: '#222', 
            fontSize: { xs: '1.5rem', md: '2.2rem' }, 
            mb: 0.5 
          }}
        >
          {value}
        </Typography>
      )}
      <Typography 
        variant="body1" 
        sx={{ 
          color: color, 
          fontWeight: 600, 
          fontSize: { xs: '0.875rem', md: '1.1rem' }, 
          letterSpacing: 0.5,
          textAlign: 'center'
        }}
      >
        {title}
      </Typography>
    </Card>
  );
};

const QuickLearningDonut = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <PieChart width={isMobile ? 280 : 320} height={isMobile ? 200 : 220}>
      <Pie
        data={data}
        cx={isMobile ? 140 : 160}
        cy={isMobile ? 100 : 110}
        innerRadius={isMobile ? 45 : 55}
        outerRadius={isMobile ? 75 : 85}
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
};

// Animación de entrada
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: none; }
`;

// Card interna para cada métrica
type MetricListCardProps = {
  title: string;
  icon: React.ReactNode;
  items: { _id?: string; count: number }[];
  color: string;
};

const MetricListCard = ({ title, icon, items, color }: MetricListCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!items || items.length === 0) {
    return (
      <Paper sx={{ 
        p: { xs: 1.5, md: 2 }, 
        minHeight: { xs: 140, md: 180 }, 
        maxHeight: { xs: 200, md: 260 }, 
        bgcolor: '#f8fafc', 
        borderRadius: 3, 
        boxShadow: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 700, 
            mb: 1, 
            color,
            fontSize: { xs: '1rem', md: '1.125rem' }
          }}
        >
          <Box component="span" sx={{ verticalAlign: 'middle', mr: 1 }}>{icon}</Box>
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          Sin datos
        </Typography>
      </Paper>
    );
  }
  
  // Encuentra el valor más alto para el badge TOP
  const maxCount = Math.max(...items.map(i => i.count));
  
  return (
    <Paper sx={{ 
      p: { xs: 1.5, md: 2 }, 
      minHeight: { xs: 140, md: 180 }, 
      maxHeight: { xs: 200, md: 260 }, 
      bgcolor: '#fff', 
      borderRadius: 3, 
      boxShadow: 3, 
      transition: 'box-shadow 0.2s, transform 0.2s', 
      '&:hover': { 
        boxShadow: 6, 
        transform: { xs: 'none', md: 'scale(1.03)' }
      } 
    }}>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 700, 
          mb: 1, 
          color,
          fontSize: { xs: '1rem', md: '1.125rem' }
        }}
      >
        <Box component="span" sx={{ verticalAlign: 'middle', mr: 1 }}>{icon}</Box>
        {title}
      </Typography>
      <Box sx={{ 
        maxHeight: { xs: 140, md: 180 }, 
        overflowY: 'auto', 
        pr: 1 
      }}>
        {items.map((item, idx) => (
          <Box 
            key={item._id || idx} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 1, 
              gap: 1 
            }}
          >
            <Tooltip title={item._id || `Sin ${title.toLowerCase()}`} arrow>
              <Typography 
                variant="body2" 
                noWrap 
                sx={{ 
                  maxWidth: { xs: 80, md: 120 },
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}
              >
                {item._id || `Sin ${title.toLowerCase()}`}
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  color: color,
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                {item.count}
              </Typography>
              {item.count === maxCount && items.length > 1 && (
                <Chip 
                  label="TOP" 
                  size="small" 
                  color="primary" 
                  sx={{ 
                    ml: 0.5, 
                    fontWeight: 700, 
                    bgcolor: color, 
                    color: '#fff', 
                    fontSize: { xs: 8, md: 10 }, 
                    height: { xs: 16, md: 20 }
                  }} 
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// Card principal para cada grupo de métricas
type MetricGroupCardProps = {
  title: string;
  icon: React.ReactNode;
  color: string;
  stats: {
    campanaStats?: { _id?: string; count: number }[];
    medioStats?: { _id?: string; count: number }[];
    ciudadStats?: { _id?: string; count: number }[];
  };
};

const MetricGroupCard = ({ title, icon, color, stats }: MetricGroupCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${color}10 0%, #fff 100%)`,
      borderRadius: { xs: 3, md: 4 },
      boxShadow: `0 8px 32px ${color}20`,
      borderLeft: `8px solid ${color}`,
      mb: { xs: 3, md: 5 },
      p: { xs: 2, md: 4 },
      animation: `${fadeInUp} 0.7s cubic-bezier(.23,1.01,.32,1)`,
      position: 'relative',
      overflow: 'visible',
      marginTop: 2,
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        textAlign: { xs: 'center', sm: 'left' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Avatar sx={{ 
          bgcolor: color, 
          width: { xs: 48, md: 56 }, 
          height: { xs: 48, md: 56 }, 
          mr: { xs: 0, sm: 2 }, 
          boxShadow: `0 4px 16px ${color}30` 
        }}>
          {icon}
        </Avatar>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900, 
            background: `linear-gradient(90deg, ${color} 60%, #6366F1 100%)`, 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            letterSpacing: 1,
            fontSize: { xs: '1.5rem', md: '2.125rem' }
          }}
        >
          {title}
        </Typography>
      </Box>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricListCard 
            title="Campaña" 
            icon={<Campaign sx={{ color }} />} 
            items={stats.campanaStats || []} 
            color={color} 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricListCard 
            title="Medio" 
            icon={<Share sx={{ color }} />} 
            items={stats.medioStats || []} 
            color={color} 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricListCard 
            title="Ciudad" 
            icon={<LocationCity sx={{ color }} />} 
            items={stats.ciudadStats || []} 
            color={color} 
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const Metrics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentCompany, user } = useAuth();
  const isQuickLearning = user?.companySlug === 'quicklearning';
  const isAdmin = user?.role === 'Administrador' as any;

  // Estado para el ciclo seleccionado
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycle());

  // Estado para los totales
  const [alumnos, setAlumnos] = useState<number>(0);
  const [sinContestar, setSinContestar] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [alumnosStats, setAlumnosStats] = useState<any>({});
  const [sinContestarStats, setSinContestarStats] = useState<any>({});
  const [campanaStats, setCampanaStats] = useState<any[]>([]);
  const [medioStats, setMedioStats] = useState<any[]>([]);
  const [ciudadStats, setCiudadStats] = useState<any[]>([]);

  // Cargar datos reales al montar y cuando cambie el ciclo
  useEffect(() => {
    if (!isQuickLearning || !user) return;
    setLoading(true);
    
    // Por ahora usamos datos totales, pero aquí podrías implementar filtros por ciclo
    console.log(`Cargando datos para el ciclo: ${selectedCycle.label} (${selectedCycle.start} - ${selectedCycle.end})`);
    
    Promise.all([
      getTableStats('alumnos', user),
      getTableStats('sin_contestar', user)
    ]).then(([alumnosStatsRes, sinContestarStatsRes]) => {
      setAlumnos(alumnosStatsRes?.totalRecords || 0);
      setSinContestar(sinContestarStatsRes?.totalRecords || 0);
      setAlumnosStats(alumnosStatsRes || {});
      setSinContestarStats(sinContestarStatsRes || {});
    }).catch(error => {
      console.error('Error loading data:', error);
      setAlumnos(0);
      setSinContestar(0);
      setAlumnosStats({});
      setSinContestarStats({});
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

  if (isQuickLearning && isAdmin) {
    return (
      <Box sx={{ 
        p: { xs: 2, md: 4 }, 
        minHeight: { xs: '100vh', md: '80vh' },
        width: '100%'
      }}>
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          justifyContent: 'space-between', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          <Box>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              sx={{ 
                fontWeight: 700, 
                color: theme.palette.primary.main, 
                mb: 0.5,
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              Dashboard de QuickLearning
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
              Resumen de interacción y actividad del ciclo
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 2 },
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'space-between', md: 'flex-end' }
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: 140, md: 180 },
                flex: { xs: 1, md: 'none' }
              }}
            >
              <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                Ciclo
              </InputLabel>
              <Select
                value={selectedCycle.id}
                label="Ciclo"
                onChange={(e) => {
                  const cycle = CYCLES.find(c => c.id === e.target.value);
                  if (cycle) setSelectedCycle(cycle);
                }}
                sx={{ 
                  bgcolor: theme.palette.background.paper,
                  '& .MuiSelect-select': { 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              >
                {CYCLES.map((cycle) => (
                  <MenuItem key={cycle.id} value={cycle.id}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                      >
                        Ciclo {cycle.label}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
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
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  color: '#fff', 
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                  flexShrink: 0
                }}
              >
                <Refresh fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Total de ciclo arriba */}
        <Card sx={{ 
          mb: 4, 
          p: { xs: 2, md: 3 }, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          boxShadow: 2, 
          borderRadius: { xs: 3, md: 4 }
        }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            sx={{ 
              color: '#EF4444', 
              fontWeight: 700, 
              mb: 1,
              fontSize: { xs: '1.125rem', md: '1.25rem' }
            }}
          >
            Total general del ciclo {selectedCycle.label}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.875rem', md: '1rem' },
              textAlign: 'center'
            }}
          >
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
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              color: '#222', 
              mb: 2, 
              letterSpacing: 1,
              fontSize: { xs: '2.5rem', md: '3.75rem' }
            }}
          >
            {total}
          </Typography>
          {selectedCycle.id === getCurrentCycle().id && (
            <Chip 
              label="Ciclo Actual" 
              color="success" 
              size="small" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.7rem', md: '0.75rem' }
              }}
            />
          )}
        </Card>
        
        {/* Cards de métricas */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 2 }}>
          {metrics.map((m, idx) => (
            <Grid item xs={6} sm={3} key={m.title}>
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
        
        {/* Gráfica de dona con porcentajes */}
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              p: { xs: 2, md: 3 }, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              boxShadow: 2, 
              borderRadius: { xs: 3, md: 4 }
            }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                sx={{ 
                  color: '#EF4444', 
                  fontWeight: 700, 
                  mb: 1,
                  fontSize: { xs: '1.125rem', md: '1.25rem' }
                }}
              >
                Distribución porcentual
              </Typography>
              <QuickLearningDonut data={donutData} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#EF4444', 
                  fontWeight: 600, 
                  mt: 1,
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                porcentaje
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              pl: { md: 6, xs: 0 }, 
              mt: { xs: 3, md: 0 } 
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  color: '#222',
                  fontSize: { xs: '1rem', md: '1.125rem' }
                }}
              >
                Leyenda
              </Typography>
              {donutData.map((item) => (
                <Box 
                  key={item.name} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    width: '100%'
                  }}
                >
                  <Box sx={{ 
                    width: { xs: 16, md: 18 }, 
                    height: { xs: 16, md: 18 }, 
                    borderRadius: '50%', 
                    bgcolor: item.color, 
                    mr: 1.5,
                    flexShrink: 0
                  }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: item.color, 
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    {item.name} ({item.value}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
        
        <MetricGroupCard
          title="Métricas de Alumnos"
          stats={alumnosStats}
          color="#3B82F6"
          icon={<People sx={{ fontSize: { xs: 28, md: 36 } }} />}
        />
        <MetricGroupCard
          title="Métricas de Sin Contestar"
          stats={sinContestarStats}
          color="#EF4444"
          icon={<Cancel sx={{ fontSize: { xs: 28, md: 36 } }} />}
        />
      </Box>
    );
  }

  // Para otras empresas o si no es admin, dejar mensaje de "Próximamente"
  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: { xs: '100vh', md: '80vh' },
      width: '100%'
    }}>
      <Typography 
        variant={isMobile ? "h4" : "h3"} 
        sx={{ 
          fontWeight: 800, 
          color: '#222', 
          mb: 1,
          fontSize: { xs: '2rem', md: '3rem' }
        }}
      >
        Dashboard de Métricas
      </Typography>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          color: '#6C63FF', 
          mb: 4,
          fontSize: { xs: '1rem', md: '1.125rem' }
        }}
      >
        Análisis completo del rendimiento de tu negocio
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: { xs: 300, md: 400 }
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecf3 100%)',
          border: '1.5px solid #d1d5db',
          width: '100%',
          maxWidth: { xs: '100%', md: 700 },
          textAlign: 'center',
          boxShadow: '0 4px 32px #6C63FF10',
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Box sx={{
              bgcolor: '#6C63FF',
              color: '#fff',
              width: { xs: 48, md: 56 },
              height: { xs: 48, md: 56 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              fontSize: { xs: 28, md: 36 },
              boxShadow: '0 2px 12px #6C63FF30',
            }}>
              <span role="img" aria-label="metrics">📊</span>
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 800, 
                color: '#6C63FF', 
                mb: 1,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              Dashboard de Métricas
            </Typography>
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6C63FF', 
              fontWeight: 600, 
              mb: 1,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            Próximamente: Centro de análisis y seguimiento de tu negocio
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6C63FF', 
              opacity: 0.8,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            Estamos trabajando para traerte métricas detalladas y análisis avanzados
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Metrics;