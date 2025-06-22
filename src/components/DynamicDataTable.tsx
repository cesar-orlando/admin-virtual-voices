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
import { useDebounce } from '../hooks/useDebounce';
import { 
  getRecords, 
  deleteRecord, 
  exportRecords,
  getTableStats,
  searchRecords,
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
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [stats, setStats] = useState<TableStats | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<DynamicRecord | null>(null);

  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [table.slug, page, rowsPerPage, refreshTrigger]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery);
    } else {
      loadRecords();
    }
  }, [debouncedSearchQuery]);

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

  const handleSearch = async (query: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setPage(0);
    try {
      const response = await searchRecords(table.slug, user, query, {}, 1, rowsPerPage);
      setRecords(response.records);
      setTotalRecords(response.pagination.total);
    } catch (err) {
      setError('Error al buscar registros');
      console.error('Error searching records:', err);
    } finally {
      setLoading(false);
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
      case 'date': {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return '-';
        }
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
            <span style={{ fontSize: '1.5rem' }}>{table.icon}</span>
            {table.name}
          </Typography>
          {stats ? (
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
              <Chip label={`${stats.totalRecords} registros total`} color="primary" variant="outlined" size="small" />
              <Chip label={`${stats.recentRecords} nuevos (30 días)`} color="secondary" variant="outlined" size="small" />
            </Box>
          ) : <Skeleton variant="text" width={200} height={20} />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: 200,
              
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.05)',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(59, 130, 246, 0.1)',
                },
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: '#8B5CF6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#8B5CF6',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon 
                    fontSize="small" 
                    sx={{ color:'#8B5CF6', }}
                  />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            sx={{ borderRadius: 2 }}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportData}
            sx={{ borderRadius: 2 }}
          >
            Exportar
          </Button>
          {onRecordCreate && (
             <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onRecordCreate}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                }
              }}
            >
              Nuevo Registro
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table & Pagination Container */}
      <Paper sx={{ flexGrow: 1, m: 3, mt: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '80px', fontWeight: 'bold' }}>ID</TableCell>
                {table.fields.map((field) => (
                  <TableCell key={field.name} sx={{ minWidth: field.width || 150, fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {field.label}
                      <Chip label={field.type} size="small" color={getFieldColor(field)} variant="outlined" />
                    </Box>
                  </TableCell>
                ))}
                <TableCell sx={{ width: '50px' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={table.fields.length + 2}>
                      <Skeleton variant="text" height={40} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                records.map((record) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={record._id}>
                    <TableCell>
                      <Chip 
                        label={record._id.slice(-6).toUpperCase()} 
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(224, 94, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        }}
                        onClick={() => onRecordView?.(record)}
                      />
                    </TableCell>
                    {table.fields.map((field) => (
                      <TableCell key={field.name}>
                        {formatFieldValue(record.data[field.name], field)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, record)}>
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
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onRecordView?.(selectedRecord!); handleMenuClose(); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Ver Detalle</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onRecordEdit?.(selectedRecord!); handleMenuClose(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteRecord(selectedRecord!); handleMenuClose(); }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
} 