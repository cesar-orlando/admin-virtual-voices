import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  useTheme, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Chip, 
  Divider, 
  Snackbar, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import SpeedIcon from '@mui/icons-material/Speed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DataTable from '../components/DataTable';
import UserDrawer from '../components/UserDrawer';
import { fetchCompanyUsers, createUser, deleteUser, updateUser } from '../api/servicios';
import Loading from '../components/Loading';
import { useCompanyStatuses } from '../hooks/useCompanyStatuses';
import { getCompanyConfig } from '../api/servicios/aiConfigServices';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  password?: string;
}

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  format?: (value: any) => string | JSX.Element;
}

export default function Users() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const theme = useTheme();
  const { statuses } = useCompanyStatuses();
  const [users, setUsers] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [companyStatuses, setCompanyStatuses] = useState<string[]>(["active", "inactive"]);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [selectedUserForMetrics, setSelectedUserForMetrics] = useState<User | null>(null);

  // Si el usuario no es admin, no puede ver la página
  if (user.role !== 'Administrador') {
    return (
      <Box sx={{ 
        width: '100%', 
        height: { xs: '100vh', md: '80vh' }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        px: { xs: 2, md: 0 }
      }}>
        <Typography 
          variant={useMediaQuery(theme.breakpoints.down('sm')) ? "h6" : "h5"} 
          color="error" 
          fontWeight={700}
          textAlign="center"
          sx={{ 
            px: { xs: 2, md: 0 },
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}
        >
          Acceso denegado: solo el administrador puede ver esta página.
        </Typography>
      </Box>
    );
  }

  // Cargar statuses de la empresa al montar Users
  useEffect(() => {
    getCompanyConfig(user.c_name).then(data => {
      setCompanyStatuses(data.statuses || ["active", "inactive"]);
    });
  }, [user.c_name]);

  const handleSort = (column: string) => {
    const isAsc = sortBy === column && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(column);
    
    const sortedUsers = [...users].sort((a, b) => {
      const aValue = a[column as keyof User] || '';
      const bValue = b[column as keyof User] || '';
      if (aValue < bValue) return isAsc ? 1 : -1;
      if (aValue > bValue) return isAsc ? -1 : 1;
      return 0;
    });
    
    setUsers(sortedUsers);
  };

  const handleFilterChange = (filters: any) => {
    // Implementar filtrado
    console.log('Filters:', filters);
  };

  const handleSubmit = async (userData: any): Promise<void> => {
    setLoading(true);
    try {
      console.log('handleSubmit called with:', { userData, selectedUser });
      const token = localStorage.getItem('token') || undefined;
      if (selectedUser && selectedUser.id) {
        console.log('Editing user with ID:', selectedUser.id);
        // Actualizar usuario existente usando el servicio
        const result = await updateUser(selectedUser.id, {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          status: userData.status,
          c_name: user.c_name
        }, token);
        console.log('Update result:', result);
        await loadUsers();
        setSnackbar({
          open: true,
          message: 'Usuario actualizado correctamente',
          severity: 'success'
        });
        setSelectedUser(null);
      } else {
        console.log('Creating new user');
        // Crear nuevo usuario en el backend
        const newUser = await createUser({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'user',
          c_name: user.c_name,
        });
        
        console.log('Create result:', newUser);
        
        // Agregar el nuevo usuario a la lista local
        setUsers([...users, {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: userData.status || statuses[0] || 'active',
          lastLogin: '-',
        }]);
        setSnackbar({
          open: true,
          message: 'Usuario creado correctamente',
          severity: 'success'
        });
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setSnackbar({
        open: true,
        message: `Error al guardar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    // Usar el nuevo servicio y pasar el companySlug
    const companySlug = user.c_name || user.companySlug || 'test';
    const usersArray = await fetchCompanyUsers(companySlug);
    // Asegura que todos los usuarios tengan los campos requeridos
    const safeUsers = (usersArray || []).map((u: any) => ({
      id: u.id || u._id,
      name: u.name || '-',
      email: u.email || '-',
      role: u.role || '-',
      status: u.status || statuses[0] || 'active',
      lastLogin: u.lastLogin || '-',
    }));
    setUsers(safeUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Componente para las acciones de usuario
  const UserActions = ({ userData }: { userData: User }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleEdit = () => {
      setSelectedUser(userData);
      setDrawerOpen(true);
      handleClose();
    };

    const handleMetrics = () => {
      setSelectedUserForMetrics(userData);
      setMetricsModalOpen(true);
      handleClose();
    };

    const handleDelete = async () => {
      if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userData.name}?`)) {
        try {
          if (userData.id) {
            await deleteUser(userData.id);
            // Remover de la lista local
            setUsers(users.filter(u => u.id !== userData.id));
            setSnackbar({
              open: true,
              message: 'Usuario eliminado correctamente',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          setSnackbar({
            open: true,
            message: 'Error al eliminar usuario',
            severity: 'error'
          });
        }
      }
      handleClose();
    };

    return (
      <>
        <IconButton
          aria-label="más opciones"
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          sx={{ color: '#8B5CF6' }}
          disabled={statusLoading === userData.id}
        >
          {statusLoading === userData.id ? (
            <CircularProgress size={20} sx={{ color: '#8B5CF6' }} />
          ) : (
            <MoreVertIcon />
          )}
        </IconButton>
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'user-menu-button',
          }}
        >
          <MenuItem onClick={handleEdit}>
            Editar
          </MenuItem>
          <MenuItem onClick={handleMetrics}>
            Métricas
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: '#EF4444' }}>
            Eliminar
          </MenuItem>
        </Menu>
      </>
    );
  };

  // Definir las columnas con la función de acciones
  const columns: Column[] = [
    { id: 'name', label: 'Nombre', minWidth: 170 },
    { id: 'email', label: 'Email', minWidth: 200 },
    {
      id: 'role',
      label: 'Rol',
      minWidth: 130,
      format: (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '-',
    },
    {
      id: 'status',
      label: 'Estado',
      minWidth: 130,
      format: (value: string) => {
        const isActive = value === 'active';
        return (
          <Box
            component="span"
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              backgroundColor: isActive
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              color: isActive
                ? '#8B5CF6' 
                : '#EF4444',
            }}
          >
            {value || 'active'}
          </Box>
        );
      },
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 100,
      format: (value: any) => {
        // Buscar el usuario correspondiente en la lista
        const userData = users.find(u => u.email === value.email);
        if (!userData) return <></>;
        return <UserActions userData={userData} />;
      },
    },
  ];

  // Preparar los datos para la tabla
  const tableData = users.map(user => ({
    ...user,
    actions: user // Pasar el usuario completo para que la función format pueda acceder a él
  }));

  // Mock data para métricas de usuario específico
  const getUserMetrics = (userData: User) => {
    // Generar datos únicos basados en el nombre del usuario para simular métricas reales
    const nameHash = userData.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseValue = (nameHash % 100) + 50; // Valor base entre 50-150
    
    return {
      overview: {
        totalProspects: baseValue * 8,
        totalClients: Math.floor(baseValue * 2.5),
        totalSales: Math.floor(baseValue * 1.2),
        unansweredMessages: Math.floor(baseValue * 0.3),
        prospectsChange: (nameHash % 20) - 10, // -10 a +10
        clientsChange: (nameHash % 15) - 7, // -7 a +8
        salesChange: (nameHash % 12) - 6, // -6 a +6
        messagesChange: (nameHash % 10) - 5, // -5 a +5
      },
      performance: {
        conversionRate: (baseValue % 20) + 5, // 5-25%
        averageResponseTime: (baseValue % 5) + 1, // 1-6 minutos
        customerSatisfaction: ((baseValue % 20) + 30) / 10, // 3.0-5.0
        productivityScore: (baseValue % 30) + 70, // 70-100
      },
      weeklyActivity: [
        { day: 'Lun', prospects: Math.floor(baseValue * 0.4), clients: Math.floor(baseValue * 0.1), sales: Math.floor(baseValue * 0.08) },
        { day: 'Mar', prospects: Math.floor(baseValue * 0.45), clients: Math.floor(baseValue * 0.12), sales: Math.floor(baseValue * 0.09) },
        { day: 'Mié', prospects: Math.floor(baseValue * 0.35), clients: Math.floor(baseValue * 0.08), sales: Math.floor(baseValue * 0.06) },
        { day: 'Jue', prospects: Math.floor(baseValue * 0.55), clients: Math.floor(baseValue * 0.15), sales: Math.floor(baseValue * 0.12) },
        { day: 'Vie', prospects: Math.floor(baseValue * 0.4), clients: Math.floor(baseValue * 0.1), sales: Math.floor(baseValue * 0.08) },
        { day: 'Sáb', prospects: Math.floor(baseValue * 0.25), clients: Math.floor(baseValue * 0.06), sales: Math.floor(baseValue * 0.04) },
        { day: 'Dom', prospects: Math.floor(baseValue * 0.2), clients: Math.floor(baseValue * 0.04), sales: Math.floor(baseValue * 0.03) },
      ],
      statusBreakdown: [
        { status: 'Nuevo', count: Math.floor(baseValue * 0.35), color: '#FF6B6B' },
        { status: 'En Proceso', count: Math.floor(baseValue * 0.28), color: '#4ECDC4' },
        { status: 'Calificado', count: Math.floor(baseValue * 0.2), color: '#45B7D1' },
        { status: 'Convertido', count: Math.floor(baseValue * 0.12), color: '#96CEB4' },
        { status: 'Perdido', count: Math.floor(baseValue * 0.05), color: '#FFEAA7' },
      ],
    };
  };

  // Componente para mostrar métricas de usuario
  const UserMetricsModal = ({ userData, open, onClose }: { userData: User; open: boolean; onClose: () => void }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const metrics = getUserMetrics(userData);

    const MetricCard = ({ title, value, change, icon, color, subtitle }: {
      title: string;
      value: string | number;
      change?: number;
      icon: React.ReactNode;
      color: string;
      subtitle?: string;
    }) => (
      <Card sx={{ 
        height: '100%', 
        background: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.9)' 
          : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${color}20`,
        }
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                {title}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color, mt: 0.5 }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color, width: 40, height: 40 }}>
              {icon}
            </Avatar>
          </Box>
          
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {change >= 0 ? (
                <TrendingUpIcon sx={{ color: '#10B981', fontSize: 14 }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 14 }} />
              )}
              <Typography variant="body2" sx={{ 
                color: change >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}>
                {change >= 0 ? '+' : ''}{change}%
              </Typography>
            </Box>
          )}
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.7rem' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,40,0.95)' 
              : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: isMobile ? 0 : 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Métricas de {userData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Análisis detallado del rendimiento del usuario
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {/* Métricas principales */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Prospectos"
                value={metrics.overview.totalProspects}
                change={metrics.overview.prospectsChange}
                icon={<PeopleIcon />}
                color="#8B5CF6"
                subtitle="Leads generados"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Clientes"
                value={metrics.overview.totalClients}
                change={metrics.overview.clientsChange}
                icon={<CheckCircleIcon />}
                color="#10B981"
                subtitle="Conversiones"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Ventas"
                value={metrics.overview.totalSales}
                change={metrics.overview.salesChange}
                icon={<AssessmentIcon />}
                color="#F59E0B"
                subtitle="Transacciones"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Sin Contestar"
                value={metrics.overview.unansweredMessages}
                change={metrics.overview.messagesChange}
                icon={<MessageIcon />}
                color="#EF4444"
                subtitle="Pendientes"
              />
            </Grid>
          </Grid>

          {/* Métricas de rendimiento */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(30,30,40,0.8)' 
                  : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Rendimiento
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Conversión
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics.performance.conversionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.performance.conversionRate} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#10B981',
                          borderRadius: 3,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tiempo Respuesta Promedio
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics.performance.averageResponseTime} min
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics.performance.averageResponseTime / 10) * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#8B5CF6',
                          borderRadius: 3,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Satisfacción Cliente
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics.performance.customerSatisfaction}/5
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics.performance.customerSatisfaction / 5) * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#F59E0B',
                          borderRadius: 3,
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Productividad
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics.performance.productivityScore}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.performance.productivityScore} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#EF4444',
                          borderRadius: 3,
                        }
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(30,30,40,0.8)' 
                  : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Distribución por Estado
                  </Typography>
                  
                  {metrics.statusBreakdown.map((item, index) => (
                    <Box key={index} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: item.color 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.status}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.count}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(item.count / Math.max(...metrics.statusBreakdown.map(s => s.count))) * 100} 
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: item.color,
                            borderRadius: 2,
                          }
                        }} 
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={onClose}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box 
      component="main"
      sx={{
        width: '100%',
        height: { xs: '100%', md: '80vh' },
        minHeight: { xs: '100vh', md: '80vh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
        position: 'relative',
      }}
    >
      <DataTable
        title="Gestión de Usuarios"
        columns={columns}
        rows={tableData}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        filters={{
          dateRange: true,
          evaluation: true,
        }}
        onFilterChange={handleFilterChange}
      />
      
      {/* Notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Button
        variant="contained"
        startIcon={<AddIcon fontSize={useMediaQuery(theme.breakpoints.down('sm')) ? "small" : "medium"} />}
        onClick={() => {
          setSelectedUser(null);
          setDrawerOpen(true);
        }}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 32 },
          right: { xs: 16, md: 32 },
          borderRadius: { xs: 2, md: 3 },
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 1.5 },
          fontSize: { xs: '0.875rem', md: '1rem' },
          backgroundColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
          backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 24px rgba(139, 92, 246, 0.3)'
            : '0 4px 24px rgba(59, 130, 246, 0.3)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
            transform: 'translateY(-1px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 32px rgba(139, 92, 246, 0.4)'
              : '0 4px 32px rgba(59, 130, 246, 0.4)',
          },
          transition: 'all 0.2s ease-out',
          zIndex: 1200,
          minWidth: { xs: 'auto', md: 'auto' },
        }}
        disabled={user.role !== 'admin'}
        size={useMediaQuery(theme.breakpoints.down('sm')) ? "small" : "medium"}
      >
        {useMediaQuery(theme.breakpoints.down('sm')) ? 'Agregar' : 'Agregar Usuario'}
      </Button>

      <UserDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUser(null);
        }}
        initialData={selectedUser || {}}
        mode={selectedUser ? 'edit' : 'create'}
        onSubmit={(data) => handleSubmit({ ...data, c_name: user.c_name })}
        statuses={companyStatuses}
        companyName={user.c_name}
        currentUserRole={user.role}
      />

      {/* Loading overlay que bloquea toda la interfaz */}
      {loading && <Loading overlay message="Guardando usuario..." />}

      {selectedUserForMetrics && (
        <UserMetricsModal
          userData={selectedUserForMetrics}
          open={metricsModalOpen}
          onClose={() => setMetricsModalOpen(false)}
        />
      )}
    </Box>
  );
}