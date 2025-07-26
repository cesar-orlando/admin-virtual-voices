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
  useMediaQuery,
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
  exportTable,
  getTableStats
} from '../api/servicios';
import { exportTableStructure } from '../utils/exportUtils';
import type { DynamicTable } from '../types';
import { useSnackbar } from 'notistack';

export default function Tables() {
  const [tables, setTables] = useState<DynamicTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTable, setSelectedTable] = useState<DynamicTable | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSlug, setNewTableSlug] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTableStats, setDeleteTableStats] = useState<{ totalRecords: number } | null>(null);

  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
  };

  const handleCreateTable = () => {
    navigate('/tablas/nueva');
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

  const handleDuplicateTable = () => {
    if (selectedTable) {
      setNewTableName(`${selectedTable.name} - Copia`);
      setNewTableSlug(`${selectedTable.slug}-copia`);
      setDuplicateDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleExportTable = async () => {
    if (selectedTable) {
      try {
        const exportData = await exportTable(selectedTable.slug, user);
        exportTableStructure(exportData, selectedTable.name);
        enqueueSnackbar('Tabla exportada exitosamente', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Error al exportar la tabla', { variant: 'error' });
      }
    }
    handleMenuClose();
  };

  const handleOpenDeleteDialog = async (table: DynamicTable) => {
    try {
      const stats = await getTableStats(table.slug, user);
      setDeleteTableStats(stats);
    } catch (error) {
      setDeleteTableStats({ totalRecords: 0 });
    }
    setConfirmDeleteOpen(true);
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    try {
      await deleteTable(selectedTable._id!, user);
      enqueueSnackbar('Tabla eliminada exitosamente', { variant: 'success' });
      loadTables();
      setConfirmDeleteOpen(false);
      setSelectedTable(null);
    } catch (error) {
      enqueueSnackbar('Error al eliminar la tabla', { variant: 'error' });
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!selectedTable || !newTableName || !newTableSlug) return;
    try {
      await duplicateTable(selectedTable.slug, newTableName, newTableSlug, user);
      enqueueSnackbar('Tabla duplicada exitosamente', { variant: 'success' });
      loadTables();
      setDuplicateDialogOpen(false);
      setNewTableName('');
      setNewTableSlug('');
    } catch (error) {
      enqueueSnackbar('Error al duplicar la tabla', { variant: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 2, md: 3 }, 
        width: '100%', 
        height: { xs: '100%', md: '80vh' } 
      }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
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
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      width: '100%', 
      height: { xs: '100%', md: '80vh' },
      minHeight: { xs: '100vh', md: '80vh' }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: { xs: 2, md: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '2.125rem' }
            }}
          >
            Tablas Dinámicas
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Gestiona tus tablas personalizadas y sus datos
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTable}
            sx={{
              background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              fontSize: { md: '1rem' },
              px: { md: 3 },
              py: { md: 1.5 },
              '&:hover': {
                background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
              }
            }}
          >
            Crear Tabla
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: { xs: 4, md: 8 },
          mx: { xs: 0, md: 'auto' },
          maxWidth: { md: 600 }
        }}>
          <CardContent>
            <TableIcon sx={{ 
              fontSize: { xs: 48, md: 64 }, 
              color: 'text.secondary', 
              mb: 2 
            }} />
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              gutterBottom
              sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
            >
              No hay tablas creadas
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontSize: { xs: '0.875rem', md: '1rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              Crea tu primera tabla personalizada para empezar a gestionar datos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTable}
              size={isMobile ? "large" : "large"}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                fontSize: { xs: '1rem', md: '1.125rem' },
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
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
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {tables.map((table) => (
            <Grid item xs={12} sm={6} md={4} key={table._id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: { xs: 'none', md: 'translateY(-4px)' },
                    boxShadow: { xs: theme.shadows[2], md: theme.shadows[8] },
                  }
                }}
                onClick={() => navigate(`/tablas/${table.slug}`)}
              >
                <CardContent sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: { xs: 2, md: 2.5 }
                }}>
                  {/* Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 2 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      flex: 1,
                      minWidth: 0
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: { xs: 18, md: 20 },
                          flexShrink: 0
                        }}
                      >
                        {table.icon || "📋"}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1.125rem', md: '1.25rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {table.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, table);
                      }}
                      sx={{ flexShrink: 0 }}
                    >
                      <MoreVertIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mb: 2, 
                    flexWrap: 'wrap' 
                  }}>
                    <Chip
                      icon={<StorageIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
                      label={`${table.recordsCount || 0} registros`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    />
                    <Chip
                      icon={<FieldsIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
                      label={`${table.fields?.length || 0} campos`}
                      size="small"  
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    />
                  </Box>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      flexGrow: 1,
                      fontSize: { xs: '0.875rem', md: '0.875rem' },
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: { xs: 2, md: 3 },
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {table.description || `Tabla con ${table.fields?.length || 0} campos personalizables`}
                  </Typography>

                  {/* Footer */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 'auto', 
                    pt: 1,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: { xs: '0.75rem', md: '0.75rem' }
                      }}
                    >
                      <CalendarIcon sx={{ 
                        fontSize: { xs: 12, md: 14 }, 
                        mr: 0.5 
                      }} />
                      Creada {formatDate(table.createdAt || '')}
                    </Typography>
                    <Chip
                      label={table.isActive ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={table.isActive ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ 
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 }
                      }}
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
          <ListItemText sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Ver Tabla
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditTable}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Editar
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateTable}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Duplicar
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportTable}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Exportar
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenDeleteDialog(selectedTable!);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Eliminar
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Duplicate Dialog */}
      <Dialog 
        open={duplicateDialogOpen} 
        onClose={() => setDuplicateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Duplicar Tabla
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la nueva tabla"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Slug de la nueva tabla"
            value={newTableSlug}
            onChange={(e) => setNewTableSlug(e.target.value)}
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
            helperText="Identificador único para la tabla (sin espacios ni caracteres especiales)"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              },
              '& .MuiFormHelperText-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            onClick={() => setDuplicateDialogOpen(false)}
            size={isMobile ? "medium" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDuplicate} 
            variant="contained"
            disabled={!newTableName || !newTableSlug}
            size={isMobile ? "medium" : "medium"}
          >
            Duplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog 
        open={confirmDeleteOpen} 
        onClose={() => { setConfirmDeleteOpen(false); setSelectedTable(null); }}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          ¿Estás seguro que quieres eliminar esta tabla?
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            Esta acción <strong>eliminará la tabla y todos sus registros asociados</strong>. No se puede deshacer.
          </Alert>
          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Nombre de la tabla: <strong>{selectedTable?.name}</strong>
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Registros asociados: <strong>{deleteTableStats ? deleteTableStats.totalRecords : '...'}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            onClick={() => setConfirmDeleteOpen(false)}
            size={isMobile ? "medium" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteTable} 
            color="error" 
            variant="contained"
            size={isMobile ? "medium" : "medium"}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button - Solo en móviles */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Crear tabla"
          onClick={handleCreateTable}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
} 