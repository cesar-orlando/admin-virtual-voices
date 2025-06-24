import React, { useState, useEffect } from 'react';
import { Box, Button, useTheme, Typography, IconButton, Menu, MenuItem, Chip, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  const [companyStatuses, setCompanyStatuses] = useState<string[]>(["Activo", "Inactivo"]);

  // Si el usuario no es admin, no puede ver la página
  if (user.role !== 'admin') {
    return (
      <Box sx={{ width: '100vw', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="error" fontWeight={700}>
          Acceso denegado: solo el administrador puede ver esta página.
        </Typography>
      </Box>
    );
  }

  // Cargar statuses de la empresa al montar Users
  useEffect(() => {
    getCompanyConfig(user.c_name).then(data => {
      setCompanyStatuses(data.statuses || ["Activo", "Inactivo"]);
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
        });
        
        console.log('Update result:', result);
        
        // Recargar la lista completa para asegurar datos actualizados
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
          status: userData.status || statuses[0] || 'Activo',
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
    const data = await fetchCompanyUsers(user);
    // Asegura que todos los usuarios tengan los campos requeridos
    const safeUsers = (data || []).map((u: any) => ({
      id: u.id || u._id,
      name: u.name || '-',
      email: u.email || '-',
      role: u.role || '-',
      status: u.status || statuses[0] || 'Activo',
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
      // TODO: Implementar vista de métricas del usuario
      console.log('Ver métricas de:', userData.name);
      setSnackbar({
        open: true,
        message: 'Funcionalidad de métricas en desarrollo',
        severity: 'info'
      });
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
        const isActive = value === 'Activo';
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
            {value || 'Activo'}
          </Box>
        );
      },
    },
    {
      id: 'lastLogin',
      label: 'Último acceso',
      minWidth: 170,
      format: (value: string) => {
        if (!value) return "-";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "-";
        return new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
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

  return (
    <Box 
      component="main"
      sx={{
        width: '90vw',
        height: '80vh',
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          setSelectedUser(null);
          setDrawerOpen(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          borderRadius: 3,
          px: 3,
          py: 1.5,
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
        }}
        disabled={user.role !== 'admin'}
      >
        Agregar Usuario
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
      />

      {/* Loading overlay que bloquea toda la interfaz */}
      {loading && <Loading overlay message="Guardando usuario..." />}
    </Box>
  );
}