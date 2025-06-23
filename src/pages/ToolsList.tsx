import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTools, useCategories } from '../hooks/useTools';
import { toast } from 'react-toastify';
import type { ITool, ToolListParams } from '../types';

interface ToolRowProps {
  tool: ITool;
  onEdit: (tool: ITool) => void;
  onDelete: (toolId: string) => void;
  onTest: (tool: ITool) => void;
  onToggleStatus: (toolId: string, isActive: boolean) => void;
}

const ToolRow: React.FC<ToolRowProps> = ({ 
  tool, 
  onEdit, 
  onDelete, 
  onTest, 
  onToggleStatus 
}) => (
  <TableRow hover>
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
        label={tool.category}
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
        {new Date(tool.updatedAt || tool.createdAt).toLocaleDateString()}
      </Typography>
    </TableCell>
    <TableCell>
      <Box display="flex" gap={1}>
        <Tooltip title="Probar">
          <IconButton size="small" onClick={() => onTest(tool)} color="info">
            <PlayIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => onEdit(tool)} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={tool.isActive ? 'Desactivar' : 'Activar'}>
          <IconButton 
            size="small" 
            onClick={() => onToggleStatus(tool._id, !tool.isActive)}
            color={tool.isActive ? 'warning' : 'success'}
          >
            <Switch 
              checked={tool.isActive} 
              size="small"
              onChange={() => onToggleStatus(tool._id, !tool.isActive)}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" onClick={() => onDelete(tool._id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
);

const ToolsList: React.FC = () => {
  const navigate = useNavigate();
  const { useToolsList, useDeleteTool, useToggleToolStatus } = useTools();
  const { useCategoriesList } = useCategories();
  
  // Estado para filtros y paginación
  const [filters, setFilters] = useState<ToolListParams>({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    isActive: undefined,
  });
  
  // Estado para diálogos
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    toolId: string;
    toolName: string;
  }>({
    open: false,
    toolId: '',
    toolName: '',
  });

  // Queries
  const { data: toolsData, isLoading, error, refetch } = useToolsList(filters);
  const { data: categoriesData } = useCategoriesList();
  
  // Mutations
  const deleteToolMutation = useDeleteTool();
  const toggleStatusMutation = useToggleToolStatus();

  const tools = toolsData?.data || [];
  const totalPages = toolsData?.pagination?.totalPages || 0;
  const totalItems = toolsData?.pagination?.totalItems || 0;
  const categories = categoriesData?.data || [];

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

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
      <Alert 
        severity="error" 
        action={
          <Button onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Reintentar
          </Button>
        }
      >
        Error al cargar las herramientas
      </Alert>
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
            Gestiona todas tus herramientas dinámicas
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
            <TextField
              size="small"
              placeholder="Buscar herramientas..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                label="Categoría"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat.name}>
                    {cat.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
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
                tools.map((tool) => (
                  <ToolRow
                    key={tool._id}
                    tool={tool}
                    onEdit={handleEdit}
                    onDelete={(toolId) => setDeleteDialog({
                      open: true,
                      toolId,
                      toolName: tool.displayName,
                    })}
                    onTest={handleTest}
                    onToggleStatus={handleToggleStatus}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron herramientas
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/herramientas/nueva')}
                      sx={{ mt: 2 }}
                    >
                      Crear Primera Herramienta
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {totalItems > 0 && (
          <TablePagination
            component="div"
            count={totalItems}
            page={filters.page! - 1}
            onPageChange={(_, page) => handlePageChange(page)}
            rowsPerPage={filters.limit!}
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
        <DialogTitle>Eliminar Herramienta</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la herramienta{' '}
            <strong>{deleteDialog.toolName}</strong>?
            Esta acción no se puede deshacer.
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
            {deleteToolMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolsList;