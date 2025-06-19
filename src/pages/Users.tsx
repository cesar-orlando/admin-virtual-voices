import React, { useState, useEffect } from 'react';
import { Box, Button, useTheme, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../components/DataTable';
import UserDrawer from '../components/UserDrawer';

interface User {
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  format?: (value: any) => string | JSX.Element;
}

const columns = [
  { id: 'name', label: 'Nombre', minWidth: 170 },
  { id: 'email', label: 'Email', minWidth: 200 },
  {
    id: 'role',
    label: 'Rol',
    minWidth: 130,
    format: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
  },
  {
    id: 'status',
    label: 'Estado',
    minWidth: 130,
    format: (value: string) => {
      const status = value === 'active' ? 'Activo' : 'Inactivo';
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
            backgroundColor: value === 'active' 
              ? 'rgba(139, 92, 246, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            color: value === 'active' 
              ? '#8B5CF6' 
              : '#EF4444',
          }}
        >
          {status}
        </Box>
      );
    },
  },
  {
    id: 'lastLogin',
    label: 'Último acceso',
    minWidth: 170,
    format: (value: string) => {
      const date = new Date(value);
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    },
  },
];

const mockData: User[] = [
  {
    name: 'Korina',
    email: 'korina@admin.com',
    role: 'usuario',
    status: 'active',
    lastLogin: '2024-03-18T18:23:00',
  },
  {
    name: 'Test User',
    email: 'test@testadmin.com',
    role: 'usuario',
    status: 'active',
    lastLogin: '2024-03-18T13:58:00',
  },
];

export default function Users() {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>(mockData);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSort = (column: string) => {
    const isAsc = sortBy === column && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(column);
    
    const sortedUsers = [...users].sort((a, b) => {
      const aValue = a[column as keyof User];
      const bValue = b[column as keyof User];
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

  const handleSubmit = async (userData: User): Promise<void> => {
    try {
      if (selectedUser) {
        // Actualizar usuario existente
        setUsers(users.map(user => 
          user.email === selectedUser.email ? userData : user
        ));
      } else {
        // Agregar nuevo usuario
        setUsers([...users, userData]);
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      throw error;
    }
  };

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
      }}
    >
      <DataTable
        title="Gestión de Usuarios"
        columns={columns}
        rows={users}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        filters={{
          dateAfter: true,
          dateBefore: true,
          evaluation: true,
        }}
        onFilterChange={handleFilterChange}
      />
      
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
      >
        Agregar Usuario
      </Button>

      <UserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialData={selectedUser}
        mode="create"
        onSubmit={handleSubmit}
      />
    </Box>
  );
}