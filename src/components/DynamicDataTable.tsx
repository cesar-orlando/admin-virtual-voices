import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { 
  getRecords, 
  deleteRecord, 
  exportRecords,
  getTableStats 
} from '../api/servicios';
import type { DynamicTable, DynamicRecord, TableField, TableStats } from '../types';

interface DynamicDataTableProps {
  table: DynamicTable;
  onRecordEdit?: (record: DynamicRecord) => void;
  onRecordView?: (record: DynamicRecord) => void;
  onRecordCreate?: () => void;
  refreshTrigger?: number;
}

export default function DynamicDataTable({ 
  table, 
  onRecordEdit, 
  onRecordView, 
  onRecordCreate,
  refreshTrigger = 0 
}: DynamicDataTableProps) {
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<TableStats | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<DynamicRecord | null>(null);

  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [table.slug, page, rowsPerPage, refreshTrigger]);

  const loadRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await getRecords(
        table.slug, 
        user, 
        page + 1, 
        rowsPerPage,
        'createdAt',
        'desc'
      );
      
      setRecords(response.records);
      setTotalRecords(response.pagination.total);
    } catch (err) {
      setError('Error al cargar los registros');
      console.error('Error loading records:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const statsData = await getTableStats(table.slug, user);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDeleteRecord = async (record: DynamicRecord) => {
    if (!user) return;

    try {
      await deleteRecord(record._id, user);
      await loadRecords();
      await loadStats();
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const blob = await exportRecords(table.slug, user, 'json');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table.slug}-records-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, record: DynamicRecord) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecord(null);
  };

  const formatFieldValue = (value: any, field: TableField): string => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString('es-ES');
      case 'boolean':
        return value ? 'Sí' : 'No';
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('es-MX').format(value);
      default:
        return String(value);
    }
  };

  const getFieldColor = (field: TableField): "primary" | "secondary" | "info" | "success" | "warning" | "error" | "default" => {
    switch (field.type) {
      case 'email': return 'primary';
      case 'number': return 'secondary';
      case 'date': return 'info';
      case 'boolean': return 'success';
      case 'currency': return 'warning';
      case 'select': return 'default';
      default: return 'default';
    }
  };

  if (loading && records.length === 0) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          px: 2,
          py: 1,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <span>{table.icon}</span>
            {table.name}
          </Typography>
          {stats && (
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
              <Chip 
                label={`${stats.totalRecords} registros total`} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label={`${stats.recentRecords} nuevos (30 días)`} 
                color="secondary" 
                variant="outlined" 
                size="small" 
              />
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportData}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onRecordCreate}
            sx={{
              background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
              }
            }}
          >
            Nuevo Registro
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ flexGrow: 1, mx: 0, borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.action.hover }}>ID</TableCell>
              {table.fields?.map((field) => (
                <TableCell
                  key={field.name}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: theme.palette.action.hover,
                    minWidth: field.width || 150
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{field.label}</span>
                    <Chip 
                      label={field.type} 
                      size="small" 
                      color={getFieldColor(field)}
                      variant="outlined"
                    />
                    {field.required && (
                      <Chip 
                        label="*" 
                        size="small" 
                        color="error"
                        sx={{ minWidth: 20, height: 20 }}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.action.hover, width: 100 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={table.fields.length + 2} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record._id} hover>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{record._id.slice(-8)}</Typography>
                  </TableCell>
                  {table.fields?.map((field) => (
                    <TableCell key={field.name}>{formatFieldValue(record.data[field.name], field)}</TableCell>
                  ))}
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, record)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalRecords}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        sx={{ mr: 2 }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 150, boxShadow: theme.shadows[8] } }}
      >
        <MenuItem onClick={() => {
          if (selectedRecord && onRecordView) {
            onRecordView(selectedRecord);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedRecord && onRecordEdit) {
            onRecordEdit(selectedRecord);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedRecord) {
              handleDeleteRecord(selectedRecord);
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
} 