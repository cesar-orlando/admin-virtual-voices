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

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton 
          size="large" 
          sx={{ 
            backgroundColor: `${color}.light`, 
            color: `${color}.main`,
            '&:hover': { backgroundColor: `${color}.main`, color: 'white' }
          }}
        >
          {icon}
        </IconButton>
      </Box>
    </CardContent>
  </Card>
);

interface TopToolCardProps {
  tool: ToolAnalytics['stats'][0];
  rank: number;
}

const TopToolCard: React.FC<TopToolCardProps> = ({ tool, rank }) => (
  <Paper elevation={1} sx={{ p: 2, mb: 1 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          #{rank}
        </Typography>
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {tool.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tool.toolName}
          </Typography>
        </Box>
      </Box>
      <Box textAlign="right">
        <Typography variant="body2" fontWeight="bold">
          {tool.totalExecutions} ejecuciones
        </Typography>
        <Chip 
          label={`${Math.round((tool.successfulExecutions / tool.totalExecutions) * 100)}% éxito`}
          size="small"
          color={tool.successfulExecutions / tool.totalExecutions >= 0.9 ? 'success' : tool.successfulExecutions / tool.totalExecutions >= 0.7 ? 'warning' : 'error'}
        />
      </Box>
    </Box>
  </Paper>
);

const ToolsDashboard: React.FC = () => {
  const navigate = useNavigate();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (analyticsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button onClick={refetchAll} startIcon={<RefreshIcon />}>
              Reintentar
            </Button>
          }
        >
          Error al cargar las estadísticas: {analyticsError.message || 'Error desconocido'}
        </Alert>
      </Box>
    );
  }

  if (!dashboardStats || dashboardStats.totalTools === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 8 }}>
        <WarningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No hay herramientas creadas
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Crea tu primera herramienta para comenzar a ver estadísticas y métricas de uso.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/herramientas/nueva')}
        >
          Crear Primera Herramienta
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard de Herramientas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona y monitorea tus herramientas dinámicas para IA
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchAll}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/herramientas/nueva')}
          >
            Nueva Herramienta
          </Button>
        </Box>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Herramientas"
            value={dashboardStats.totalTools}
            icon={<BuildIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Herramientas Activas"
            value={dashboardStats.activeTools}
            icon={<CheckIcon />}
            color="success"
            subtitle={`${dashboardStats.totalTools - dashboardStats.activeTools} inactivas`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ejecuciones Hoy"
            value={dashboardStats.executionsToday}
            icon={<PlayIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Herramientas Más Utilizadas
          </Typography>
          {dashboardStats.topTools.length > 0 ? (
            <Box>
              {dashboardStats.topTools.map((tool, index) => (
                <TopToolCard key={tool._id} tool={tool} rank={index + 1} />
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
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