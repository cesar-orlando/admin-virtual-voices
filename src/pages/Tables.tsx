import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Skeleton,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  TableChart as TableIcon,
  Visibility as ViewIcon,
  Storage as StorageIcon,
  CalendarToday as CalendarIcon,
  ListAlt as FieldsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  getTables, 
  deleteTable, 
  duplicateTable, 
  exportTable 
} from '../api/servicios';
import type { DynamicTable } from '../types';

export default function Tables() {
  const [tables, setTables] = useState<DynamicTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTable, setSelectedTable] = useState<DynamicTable | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSlug, setNewTableSlug] = useState('');

  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    loadTables();
  }, [location.key]);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }
      const response = await getTables(user);
      setTables(response.tables || []);
    } catch (err) {
      setError('Error al cargar las tablas');
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, table: DynamicTable) => {
    setAnchorEl(event.currentTarget);
    setSelectedTable(table);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTable(null);
  };

  const handleViewTable = () => {
    if (selectedTable) {
      navigate(`/tablas/${selectedTable.slug}`);
    }
    handleMenuClose();
  };

  const handleEditTable = () => {
    if (selectedTable) {
      navigate(`/tablas/${selectedTable.slug}/editar`);
    }
    handleMenuClose();
  };

  const handleDeleteTable = async () => {
    if (!selectedTable || !user) return;

    try {
      await deleteTable(selectedTable._id, user);
      await loadTables();
      handleMenuClose();
    } catch (err) {
      console.error('Error deleting table:', err);
    }
  };

  const handleDuplicateTable = () => {
    if (selectedTable) {
      setNewTableName(`${selectedTable.name} (Copia)`);
      setNewTableSlug(`${selectedTable.slug}-copia`);
      setDuplicateDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmDuplicate = async () => {
    if (!selectedTable || !user) return;

    try {
      await duplicateTable(selectedTable._id, newTableName, newTableSlug, user);
      await loadTables();
      setDuplicateDialogOpen(false);
      setNewTableName('');
      setNewTableSlug('');
    } catch (err) {
      console.error('Error duplicating table:', err);
    }
  };

  const handleExportTable = async () => {
    if (!selectedTable || !user) return;

    try {
      const blob = await exportTable(selectedTable.slug, user);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable.slug}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting table:', err);
    }
    handleMenuClose();
  };

  const handleCreateTable = () => {
    navigate('/tablas/nueva');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tablas Dinámicas
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '90vw', height: '80vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Tablas Dinámicas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus tablas personalizadas y sus datos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTable}
          sx={{
            background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
              boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
            }
          }}
        >
          Crear Tabla
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <TableIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No hay tablas creadas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea tu primera tabla personalizada para empezar a gestionar datos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTable}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                }
              }}
            >
              Crear Primera Tabla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {tables.map((table) => (
            <Grid item xs={12} sm={6} md={4} key={table._id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
                onClick={() => navigate(`/tablas/${table.slug}`)}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: 20 }}>
                        {table.icon || "📋"}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {table.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, table);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<StorageIcon sx={{ fontSize: 16 }} />}
                      label={`${table.recordsCount || 0} registros`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<FieldsIcon sx={{ fontSize: 16 }} />}
                      label={`${table.fields?.length || 0} campos`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {table.description || `Tabla con ${table.fields?.length || 0} campos personalizables`}
                  </Typography>

                  {/* Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Creada {formatDate(table.createdAt || '')}
                    </Typography>
                    <Chip
                      label={table.isActive ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={table.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <MenuItem onClick={handleViewTable}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Tabla</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditTable}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateTable}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportTable}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteTable} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Duplicar Tabla</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la nueva tabla"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Slug de la nueva tabla"
            value={newTableSlug}
            onChange={(e) => setNewTableSlug(e.target.value)}
            margin="normal"
            required
            helperText="Identificador único para la tabla (sin espacios ni caracteres especiales)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfirmDuplicate} 
            variant="contained"
            disabled={!newTableName || !newTableSlug}
          >
            Duplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Crear tabla"
        onClick={handleCreateTable}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
          }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 