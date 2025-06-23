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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTools, useCategories } from '../hooks/useTools';
import type { ITool, ToolListParams } from '../types';

const ToolsList: React.FC = () => {
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button onClick={() => refetch()} startIcon={<RefreshIcon />}>
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Herramientas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona todas tus herramientas dinámicas para IA
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

      {/* Filters */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                label="Categoría"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((cat: any) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.isActive === undefined ? '' : String(filters.isActive)}
                onChange={(e) => {
                  const value = e.target.value;
                  handleStatusFilter(
                    value === '' ? undefined : value === 'true'
                  );
                }}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activas</MenuItem>
                <MenuItem value="false">Inactivas</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
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
        
        {pagination && pagination.total > 0 && (
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
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, toolId: '', toolName: '' })}
      >
        <DialogTitle>Desactivar Herramienta</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas desactivar la herramienta{' '}
            <strong>{deleteDialog.toolName}</strong>?
            Esta acción la marcará como inactiva.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, toolId: '', toolName: '' })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteToolMutation.isPending}
          >
            {deleteToolMutation.isPending ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolsList;