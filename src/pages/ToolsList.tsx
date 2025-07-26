import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTools, useCategories } from '../hooks/useTools';
import type { ITool, ToolListParams } from '../types';

const ToolsList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const navigate = useNavigate();
  const { useToolsList, useDeleteTool, useToggleToolStatus } = useTools();
  const { useCategoriesList } = useCategories();
  
  const [filters, setFilters] = useState<ToolListParams>({
    page: 1,
    limit: 10,
    category: '',
    isActive: undefined,
  });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    toolId: string;
    toolName: string;
  }>({
    open: false,
    toolId: '',
    toolName: '',
  });

  const { data: toolsData, isLoading, error, refetch } = useToolsList(filters);
  const { data: categoriesData } = useCategoriesList();

  const deleteToolMutation = useDeleteTool();
  const toggleStatusMutation = useToggleToolStatus();

  const tools = (toolsData as any)?.tools || [];
  const pagination = (toolsData as any)?.pagination;
  const categories = (categoriesData as any)?.categories || [];

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handleStatusFilter = (isActive?: boolean) => {
    setFilters(prev => ({ ...prev, isActive, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page: page + 1 }));
  };

  const handleRowsPerPageChange = (rowsPerPage: number) => {
    setFilters(prev => ({ ...prev, limit: rowsPerPage, page: 1 }));
  };

  const handleEdit = (tool: ITool) => {
    navigate(`/herramientas/${tool._id}/editar`);
  };

  const handleTest = (tool: ITool) => {
    navigate(`/herramientas/${tool._id}/test`);
  };

  const handleDelete = async () => {
    try {
      await deleteToolMutation.mutateAsync(deleteDialog.toolId);
      toast.success('Herramienta eliminada correctamente');
      setDeleteDialog({ open: false, toolId: '', toolName: '' });
    } catch (error) {
      toast.error('Error al eliminar la herramienta');
    }
  };

  const handleToggleStatus = async (toolId: string, isActive: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ toolId, isActive });
      toast.success(`Herramienta ${isActive ? 'activada' : 'desactivada'} correctamente`);
    } catch (error) {
      toast.error('Error al cambiar el estado de la herramienta');
    }
  };

  // Mobile Card Component
  const ToolCard = ({ tool }: { tool: ITool }) => (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <BuildIcon color="primary" sx={{ mt: 0.5 }} />
          <Box flex={1} minWidth={0}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1rem', md: '1.125rem' },
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
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              {tool.name}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            <Chip 
              label={tool.isActive ? 'Activa' : 'Inactiva'}
              size="small"
              color={tool.isActive ? 'success' : 'default'}
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            />
            <Chip 
              label={tool.config.method}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            />
          </Box>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          mb={2}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {tool.description}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip 
            label={categories.find((c: any) => c.name === tool.category)?.displayName || tool.category}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
          />
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
          >
            {new Date(tool.updatedAt || tool.createdAt || '').toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Switch 
              checked={tool.isActive} 
              size="small"
              onChange={() => handleToggleStatus(tool._id!, !tool.isActive)}
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              {tool.isActive ? 'Activa' : 'Inactiva'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Probar">
              <IconButton size="small" onClick={() => handleTest(tool)} color="info">
                <PlayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => handleEdit(tool)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton 
                size="small" 
                onClick={() => setDeleteDialog({
                  open: true,
                  toolId: tool._id!,
                  toolName: tool.displayName,
                })} 
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading) {
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

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error" 
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          action={
            <Button 
              onClick={() => refetch()} 
              startIcon={<RefreshIcon />}
              size={isMobile ? "small" : "medium"}
            >
              Reintentar
            </Button>
          }
        >
          Error al cargar las herramientas: {error.message || 'Error desconocido'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      minHeight: { xs: '100vh', md: '85vh' }
    }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", md: "center" }}
        mb={4}
        flexDirection={{ xs: "column", md: "row" }}
        gap={{ xs: 2, md: 0 }}
      >
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
            Herramientas
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Gestiona todas tus herramientas dinámicas para IA
          </Typography>
        </Box>
        <Box 
          display="flex" 
          gap={2}
          width={{ xs: '100%', md: 'auto' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              fontSize: { xs: '0.875rem', md: '1rem' },
              flex: { xs: 1, sm: 'none' }
            }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/herramientas/nueva')}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              fontSize: { xs: '0.875rem', md: '1rem' },
              flex: { xs: 1, sm: 'none' }
            }}
          >
            Nueva Herramienta
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  Categoría
                </InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  label="Categoría"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((cat: any) => (
                    <MenuItem key={cat.name} value={cat.name}>
                      {cat.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  Estado
                </InputLabel>
                <Select
                  value={filters.isActive === undefined ? '' : String(filters.isActive)}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleStatusFilter(
                      value === '' ? undefined : value === 'true'
                    );
                  }}
                  label="Estado"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activas</MenuItem>
                  <MenuItem value="false">Inactivas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tools Display */}
      {isMobile ? (
        // Mobile Card Layout
        <Box>
          {tools.length > 0 ? (
            tools.map((tool: ITool) => (
              <ToolCard key={tool._id} tool={tool} />
            ))
          ) : (
            <Card elevation={1}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box textAlign="center" py={4}>
                  <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                  >
                    No hay herramientas que coincidan
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    mb={3}
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Prueba con otros filtros o crea una nueva herramienta.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/herramientas/nueva')}
                    size={isMobile ? "medium" : "large"}
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Crear Herramienta
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        // Desktop Table Layout
        <Card elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Actualizada</TableCell>
                  <TableCell width={200}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tools.length > 0 ? (
                  tools.map((tool: ITool) => (
                    <TableRow hover key={tool._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {tool.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tool.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                          {tool.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={categories.find((c: any) => c.name === tool.category)?.displayName || tool.category}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tool.isActive ? 'Activa' : 'Inactiva'}
                          size="small"
                          color={tool.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{tool.config.method}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tool.updatedAt || tool.createdAt || '').toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Probar">
                            <IconButton size="small" onClick={() => handleTest(tool)} color="info">
                              <PlayIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEdit(tool)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={tool.isActive ? 'Desactivar' : 'Activar'}>
                            <Switch 
                              checked={tool.isActive} 
                              size="small"
                              onChange={() => handleToggleStatus(tool._id!, !tool.isActive)}
                            />
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              onClick={() => setDeleteDialog({
                                open: true,
                                toolId: tool._id!,
                                toolName: tool.displayName,
                              })} 
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box textAlign="center" py={4}>
                        <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No hay herramientas que coincidan
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                          Prueba con otros filtros o crea una nueva herramienta.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/herramientas/nueva')}
                        >
                          Crear Herramienta
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Box mt={3}>
          <Card elevation={1}>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={(_, page) => handlePageChange(page)}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              labelRowsPerPage="Filas por página:"
              sx={{
                '& .MuiTablePagination-toolbar': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
          </Card>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, toolId: '', toolName: '' })}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Desactivar Herramienta
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            ¿Estás seguro de que deseas desactivar la herramienta{' '}
            <strong>{deleteDialog.toolName}</strong>?
            Esta acción la marcará como inactiva.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, toolId: '', toolName: '' })}
            size={isMobile ? "medium" : "large"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteToolMutation.isPending}
            size={isMobile ? "medium" : "large"}
          >
            {deleteToolMutation.isPending ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolsList;