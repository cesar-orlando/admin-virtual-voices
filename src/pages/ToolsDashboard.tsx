import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Build as BuildIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTools, useCategories } from '../hooks/useTools';
import type { ToolAnalytics } from '../types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card elevation={2}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="div" 
              color={`${color}.main`} 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '1.5rem', md: '2.125rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton 
            size={isMobile ? "medium" : "large"}
            sx={{ 
              backgroundColor: `${color}.light`, 
              color: `${color}.main`,
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              '&:hover': { backgroundColor: `${color}.main`, color: 'white' }
            }}
          >
            {icon}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

interface TopToolCardProps {
  tool: ToolAnalytics['stats'][0];
  rank: number;
}

const TopToolCard: React.FC<TopToolCardProps> = ({ tool, rank }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper elevation={1} sx={{ p: { xs: 1.5, md: 2 }, mb: 1 }}>
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1, sm: 0 }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          gap={{ xs: 1.5, md: 2 }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            color="primary" 
            fontWeight="bold"
            sx={{ 
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              minWidth: 'fit-content'
            }}
          >
            #{rank}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body1" 
              fontWeight="medium"
              sx={{ 
                fontSize: { xs: '0.875rem', md: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {tool.displayName}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                display: 'block'
              }}
            >
              {tool.toolName}
            </Typography>
          </Box>
        </Box>
        <Box 
          textAlign={{ xs: 'center', sm: 'right' }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Typography 
            variant="body2" 
            fontWeight="bold"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            {tool.totalExecutions} ejecuciones
          </Typography>
          <Chip 
            label={`${Math.round((tool.successfulExecutions / tool.totalExecutions) * 100)}% éxito`}
            size="small"
            color={tool.successfulExecutions / tool.totalExecutions >= 0.9 ? 'success' : tool.successfulExecutions / tool.totalExecutions >= 0.7 ? 'warning' : 'error'}
            sx={{ 
              fontSize: { xs: '0.7rem', md: '0.75rem' },
              height: { xs: 20, md: 24 }
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

const ToolsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { useToolsList, useAnalytics } = useTools();
  const { useCategoriesList } = useCategories();

  // Fetching data from multiple sources
  const { data: allToolsData, isLoading: loadingTools } = useToolsList({ limit: 1 });
  const { data: activeToolsData, isLoading: loadingActiveTools } = useToolsList({ limit: 1, isActive: true });
  const { data: categoriesData, isLoading: loadingCategories } = useCategoriesList();
  const { 
    data: analyticsData, 
    isLoading: loadingAnalytics, 
    error: analyticsError, 
    refetch: refetchAnalytics 
  } = useAnalytics();
  
  const isLoading = loadingTools || loadingActiveTools || loadingCategories || loadingAnalytics;

  const dashboardStats = useMemo(() => {
    if (isLoading || !allToolsData || !activeToolsData || !categoriesData || !analyticsData) {
      return null;
    }
    
    const totalTools = allToolsData.pagination.totalItems;
    const activeTools = activeToolsData.pagination.totalItems;
    const categoriesCount = (categoriesData.data || []).length;

    const today = new Date().toISOString().split('T')[0];
    const executionsToday = (analyticsData.data?.stats || [])
      .filter((stat: any) => stat.lastExecuted && new Date(stat.lastExecuted).toISOString().split('T')[0] === today)
      .reduce((acc: any, stat: any) => acc + stat.totalExecutions, 0);

    const totalExecutions = (analyticsData.data?.stats || []).reduce((acc: any, stat: any) => acc + stat.totalExecutions, 0);
    const totalSuccessful = (analyticsData.data?.stats || []).reduce((acc: any, stat: any) => acc + stat.successfulExecutions, 0);
    const successRate = totalExecutions > 0 ? Math.round((totalSuccessful / totalExecutions) * 100) : 0;

    const topTools = (analyticsData.data?.stats || [])
        .sort((a: any, b: any) => b.totalExecutions - a.totalExecutions)
        .slice(0, 5);

    return {
      totalTools,
      activeTools,
      categoriesCount,
      executionsToday,
      successRate,
      topTools
    };
  }, [isLoading, allToolsData, activeToolsData, categoriesData, analyticsData]);

  const refetchAll = () => {
    refetchAnalytics();
    // Invalidate queries for other data if needed via queryClient
  };

  if (isLoading && !dashboardStats) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ p: { xs: 2, md: 0 } }}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (analyticsError) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              onClick={refetchAll} 
              startIcon={<RefreshIcon />}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              {isMobile ? 'Reintentar' : 'Reintentar'}
            </Button>
          }
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          Error al cargar las estadísticas: {analyticsError.message || 'Error desconocido'}
        </Alert>
      </Box>
    );
  }

  if (!dashboardStats || dashboardStats.totalTools === 0) {
    return (
      <Box sx={{ 
        p: { xs: 2, md: 3 }, 
        textAlign: 'center', 
        py: { xs: 4, md: 8 } 
      }}>
        <WarningIcon sx={{ 
          fontSize: { xs: 48, md: 64 }, 
          color: 'text.secondary', 
          mb: 3 
        }} />
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          No hay herramientas creadas
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          mb={4}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            px: { xs: 2, md: 0 }
          }}
        >
          Crea tu primera herramienta para comenzar a ver estadísticas y métricas de uso.
        </Typography>
        <Button
          variant="contained"
          size={isMobile ? "medium" : "large"}
          startIcon={<AddIcon />}
          onClick={() => navigate('/herramientas/nueva')}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            px: { xs: 3, md: 4 },
            py: { xs: 1, md: 1.5 }
          }}
        >
          {isMobile ? 'Crear Herramienta' : 'Crear Primera Herramienta'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      width: '100%',
      minHeight: { xs: '100vh', md: '80vh' }
    }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={4}
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={{ xs: 2, md: 0 }}
      >
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
            Dashboard de Herramientas
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Gestiona y monitorea tus herramientas dinámicas para IA
          </Typography>
        </Box>
        <Box 
          display="flex" 
          gap={{ xs: 1, md: 2 }}
          flexDirection={{ xs: 'row', sm: 'row' }}
          width={{ xs: '100%', md: 'auto' }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize={isMobile ? "small" : "medium"} />}
            onClick={refetchAll}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              flex: { xs: 1, md: 'none' }
            }}
          >
            {isMobile ? 'Actualizar' : 'Actualizar'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize={isMobile ? "small" : "medium"} />}
            onClick={() => navigate('/herramientas/nueva')}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              flex: { xs: 1, md: 'none' }
            }}
          >
            {isMobile ? 'Nueva' : 'Nueva Herramienta'}
          </Button>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} mb={4}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Herramientas"
            value={dashboardStats.totalTools}
            icon={<BuildIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Herramientas Activas"
            value={dashboardStats.activeTools}
            icon={<CheckIcon />}
            color="success"
            subtitle={`${dashboardStats.totalTools - dashboardStats.activeTools} inactivas`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Ejecuciones Hoy"
            value={dashboardStats.executionsToday}
            icon={<PlayIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Tasa de Éxito"
            value={`${dashboardStats.successRate}%`}
            icon={<TrendingUpIcon />}
            color={dashboardStats.successRate >= 90 ? 'success' : dashboardStats.successRate >= 70 ? 'warning' : 'error'}
          />
        </Grid>
      </Grid>

      {/* Main Content: Top Tools */}
      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
          >
            Herramientas Más Utilizadas
          </Typography>
          {dashboardStats.topTools.length > 0 ? (
            <Box>
              {dashboardStats.topTools.map((tool, index) => (
                <TopToolCard key={tool._id} tool={tool} rank={index + 1} />
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={{ xs: 2, md: 4 }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                No hay herramientas con ejecuciones registradas.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ToolsDashboard;