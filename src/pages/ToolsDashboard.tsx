import React from 'react';
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
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import type { ToolDashboardStats } from '../types';

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
  tool: {
    id: string;
    name: string;
    displayName: string;
    executions: number;
    successRate: number;
  };
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
            {tool.name}
          </Typography>
        </Box>
      </Box>
      <Box textAlign="right">
        <Typography variant="body2" fontWeight="bold">
          {tool.executions} ejecuciones
        </Typography>
        <Chip 
          label={`${tool.successRate}% éxito`}
          size="small"
          color={tool.successRate >= 90 ? 'success' : tool.successRate >= 70 ? 'warning' : 'error'}
        />
      </Box>
    </Box>
  </Paper>
);

interface CategoryDistributionProps {
  categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

const CategoryDistribution: React.FC<CategoryDistributionProps> = ({ categories }) => (
  <Box>
    {categories.map((cat) => (
      <Box key={cat.category} sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight="medium">
            {cat.category}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cat.count} ({cat.percentage}%)
          </Typography>
        </Box>
        <Box 
          sx={{ 
            width: '100%', 
            height: 8, 
            backgroundColor: 'grey.200',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              width: `${cat.percentage}%`, 
              height: '100%', 
              backgroundColor: 'primary.main',
              transition: 'width 0.3s ease'
            }} 
          />
        </Box>
      </Box>
    ))}
  </Box>
);

const ToolsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { useDashboardStats } = useTools();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Reintentar
          </Button>
        }
      >
        Error al cargar las estadísticas del dashboard
      </Alert>
    );
  }

  const dashboardStats: ToolDashboardStats = stats?.data || {
    totalTools: 0,
    activeTools: 0,
    executionsToday: 0,
    successRate: 0,
    categoriesCount: 0,
    executionsTrend: [],
    topTools: [],
    categoryDistribution: []
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard de Herramientas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona y monitorea tus herramientas dinámicas
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
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

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Top Tools */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Herramientas Más Utilizadas
              </Typography>
              {dashboardStats.topTools.length > 0 ? (
                <Box>
                  {dashboardStats.topTools.map((tool, index) => (
                    <TopToolCard key={tool.id} tool={tool} rank={index + 1} />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No hay datos de herramientas disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Distribución por Categoría
                </Typography>
              </Box>
              {dashboardStats.categoryDistribution.length > 0 ? (
                <CategoryDistribution categories={dashboardStats.categoryDistribution} />
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No hay categorías disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card elevation={2} sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Acciones Rápidas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/herramientas/nueva')}
              >
                Crear Herramienta
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BuildIcon />}
                onClick={() => navigate('/herramientas')}
              >
                Ver Todas
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={() => navigate('/herramientas/tester')}
              >
                Probar Herramienta
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/herramientas/analytics')}
              >
                Ver Analytics
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ToolsDashboard;