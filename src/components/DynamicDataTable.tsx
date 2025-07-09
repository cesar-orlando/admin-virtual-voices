import React, { useState, useEffect, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  TableSortLabel,
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
  CalendarToday as CalendarIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as InsertDriveFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Movie as MovieIcon,
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
  onImportExcel?: () => void; // NUEVO: handler para importar Excel
}

export default function DynamicDataTable({ 
  table, 
  onRecordEdit, 
  onRecordView, 
  onRecordCreate,
  refreshTrigger = 0,
  onImportExcel
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
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<DynamicRecord | null>(null);
  
  // State for date filters
  const [dateFields, setDateFields] = useState<{name: string, label: string}[]>([]);
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // File handling functions
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const theme = useTheme();
  const { user } = useAuth();

  // Sorting state
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Identificar los campos de fecha disponibles para filtrar
    const availableDateFields = table.fields
      .filter(field => field.type === 'date')
      .map(field => ({ name: field.name, label: field.label }));
    setDateFields(availableDateFields);
  }, [table.fields]);

  useEffect(() => {
    // Carga de datos
    loadRecords();
    if (!searchQuery) { // Solo cargar stats si no es una búsqueda para evitar llamadas extra
        loadStats();
    }
  }, [table.slug, page, rowsPerPage, refreshTrigger, activeFilters]); // Recargar si los filtros cambian

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
        'desc',
        activeFilters
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
      const response = await searchRecords(table.slug, user, query, activeFilters, 1, rowsPerPage);
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

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyDateFilter = () => {
    if (selectedDateField && startDate && endDate) {
      const newFilters = {
        ...activeFilters,
        [selectedDateField]: {
          $gte: new Date(startDate).toISOString(),
          $lte: new Date(endDate).toISOString(),
        }
      };
      setActiveFilters(newFilters);
      setPage(0); // Reset page to 1 on new filter
    }
    handleFilterClose();
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSelectedDateField('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    handleFilterClose();
  };

  const handleFileClick = (files: any[], fieldName: string) => {
    setSelectedFiles(files || []);
    setSelectedFieldName(fieldName);
    setFileModalOpen(true);
    setGalleryIndex(0);
  };

  const handleGalleryPrev = () => setGalleryIndex((prev) => Math.max(prev - 1, 0));
  const handleGalleryNext = () => setGalleryIndex((prev) => Math.min(prev + 1, selectedFiles.length - 1));

  const formatFieldValue = (value: any, field: TableField): string | JSX.Element => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'date': {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return '-';
        }
        return date.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
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
      case 'file':
        // Manejar diferentes formatos de archivos
        let files: any[] = [];
        if (Array.isArray(value)) {
          files = value;
        } else if (typeof value === 'string') {
          // Si es una cadena de URLs separadas por espacio
          if (value.includes('http')) {
            files = value.split(/\s+/).filter((url) => url.startsWith('http'));
          } else {
            files = [value];
          }
        } else if (value && typeof value === 'object') {
          if (value.urls && Array.isArray(value.urls)) {
            files = value.urls;
          } else if (value.files && Array.isArray(value.files)) {
            files = value.files;
          } else {
            files = Object.values(value).filter(v => typeof v === 'string' && v.startsWith('http'));
          }
        }
        const validFiles = files.filter(file => typeof file === 'string' && file.startsWith('http'));
        if (validFiles.length > 0) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                }
              }}
              onClick={() => handleFileClick(validFiles, field.name)}
            >
              <AttachFileIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                {validFiles.length} archivo{validFiles.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          );
        }
        return '-';
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

  const handleSort = (name: string) => {
    if (sortBy === name) {
      setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(name);
      setSortDirection('asc');
    }
    setPage(0);
  };

  // Antes del renderizado de las filas, ordena los records si sortBy está definido y es de tipo sortable
  const sortableTypes = ['number', 'currency', 'date'];
  const sortableField = table.fields.find(f => f.name === sortBy && sortableTypes.includes(f.type));
  let sortedRecords = [...records];
  if (sortableField && sortBy) {
    sortedRecords.sort((a, b) => {
      let aValue = a.data[sortBy];
      let bValue = b.data[sortBy];
      if (sortableField.type === 'currency' || sortableField.type === 'number') {
        aValue = Number(String(aValue).replace(/[^\d.-]+/g, ''));
        bValue = Number(String(bValue).replace(/[^\d.-]+/g, ''));
        if (isNaN(aValue)) aValue = 0;
        if (isNaN(bValue)) bValue = 0;
      } else if (sortableField.type === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

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
            onClick={handleFilterOpen}
          >
            Filtros
          </Button>
          {/* Botón de acciones Importar/Exportar */}
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            sx={{ borderRadius: 2 }}
            onClick={e => setActionsAnchorEl(e.currentTarget)}
          >
            Acciones
          </Button>
          <Menu
            anchorEl={actionsAnchorEl}
            open={Boolean(actionsAnchorEl)}
            onClose={() => setActionsAnchorEl(null)}
          >
            {/*
            <MenuItem onClick={() => { setActionsAnchorEl(null); onImportExcel && onImportExcel(); }}>
              <ListItemIcon><ImportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Importar Excel</ListItemText>
            </MenuItem>
            */}
            <MenuItem onClick={() => { setActionsAnchorEl(null); handleExportData(); }}>
              <ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Exportar</ListItemText>
            </MenuItem>
          </Menu>
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
                {table.fields.map((field, idx) => {
                  const isSortable = ['number', 'currency', 'date'].includes(field.type);
                  return (
                    <TableCell key={field.name} sx={{ minWidth: field.width || 150, fontWeight: 'bold', maxWidth: 220, p: 1 }}>
                      <Tooltip title={field.label} placement="top" arrow>
                        <Box sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          lineHeight: 1.2,
                          maxHeight: '2.6em',
                          whiteSpace: 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          {isSortable ? (
                            <TableSortLabel
                              active={sortBy === field.name}
                              direction={sortBy === field.name ? sortDirection : 'asc'}
                              onClick={() => handleSort(field.name)}
                            >
                              {field.label}
                            </TableSortLabel>
                          ) : field.label}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
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
                sortedRecords.map((record) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={record._id}>
                    {table.fields.map((field, idx) => (
                      <TableCell key={field.name} sx={{ maxWidth: 220, p: 1 }}>
                        {idx === 0 ? (
                          <Chip
                            label={record.data[field.name] || '-'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(224, 94, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                              fontSize: '0.95rem',
                              px: 2,
                              py: 0.5,
                              borderRadius: 2,
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          />
                        ) : field.type === 'text' ? (
                          <Tooltip title={record.data[field.name] || ''} placement="top" arrow>
                            <Box sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'flex',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              fontSize: '0.95rem',
                              lineHeight: 1.2,
                              maxHeight: '2.6em',
                              whiteSpace: 'normal',
                            }}>
                              {record.data[field.name]}
                            </Box>
                          </Tooltip>
                        ) : (
                          formatFieldValue(record.data[field.name], field)
                        )}
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

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { width: 320, p: 2, borderRadius: 2 } }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Filtrar por Fecha</Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Campo de Fecha</InputLabel>
          <Select
            value={selectedDateField}
            label="Campo de Fecha"
            onChange={(e) => setSelectedDateField(e.target.value)}
          >
            {dateFields.map(field => (
              <MenuItem key={field.name} value={field.name}>{field.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Fecha de Inicio"
          type="date"
          fullWidth
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Fecha de Fin"
          type="date"
          fullWidth
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleClearFilters} size="small">Limpiar</Button>
          <Button onClick={handleApplyDateFilter} variant="contained" size="small">Aplicar</Button>
        </Box>
      </Menu>

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

      {/* File Modal */}
      <Dialog
        open={fileModalOpen}
        onClose={() => {
          setFileModalOpen(false);
          setSelectedFiles([]);
          setSelectedFieldName('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <AttachFileIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Archivos - {selectedFieldName}
          </Typography>
          <Chip label={`${selectedFiles.length} archivo${selectedFiles.length !== 1 ? 's' : ''}`} color="primary" size="small" sx={{ ml: 'auto' }} />
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedFiles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AttachFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No hay archivos para mostrar</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {/* Galería principal */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button onClick={handleGalleryPrev} disabled={galleryIndex === 0}>&lt;</Button>
                {(() => {
                  const fileUrl = selectedFiles[galleryIndex];
                  const ext = fileUrl.split('.').pop()?.toLowerCase();
                  if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) {
                    return <img src={fileUrl} alt="preview" style={{ maxHeight: 320, maxWidth: 480, borderRadius: 8, boxShadow: theme.shadows[3] }} />;
                  } else if (["mp4","avi","mov","wmv","webm"].includes(ext)) {
                    return <video src={fileUrl} controls style={{ maxHeight: 320, maxWidth: 480, borderRadius: 8, boxShadow: theme.shadows[3] }} />;
                  } else if (ext === "pdf") {
                    return <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handleOpenFile({ url: fileUrl, name: extractFileNameFromUrl(fileUrl) })}>Ver PDF</Button>;
                  } else {
                    return <Button variant="outlined" startIcon={<InsertDriveFileIcon />} onClick={() => handleOpenFile({ url: fileUrl, name: extractFileNameFromUrl(fileUrl) })}>Abrir archivo</Button>;
                  }
                })()}
                <Button onClick={handleGalleryNext} disabled={galleryIndex === selectedFiles.length - 1}>&gt;</Button>
              </Box>
              {/* Thumbnails */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {selectedFiles.map((fileUrl, idx) => {
                  const ext = fileUrl.split('.').pop()?.toLowerCase();
                  return (
                    <Box
                      key={idx}
                      sx={{
                        border: idx === galleryIndex ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                        borderRadius: 2,
                        p: 0.5,
                        cursor: 'pointer',
                        background: idx === galleryIndex ? theme.palette.action.selected : 'transparent',
                      }}
                      onClick={() => setGalleryIndex(idx)}
                    >
                      { ["jpg","jpeg","png","gif","bmp","webp"].includes(ext) ? (
                        <img src={fileUrl} alt="thumb" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                      ) : ["mp4","avi","mov","wmv","webm"].includes(ext) ? (
                        <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eee', borderRadius: 4 }}>
                          <MovieIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        </Box>
                      ) : ext === "pdf" ? (
                        <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eee', borderRadius: 4 }}>
                          <PictureAsPdfIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eee', borderRadius: 4 }}>
                          <InsertDriveFileIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => {
            setFileModalOpen(false);
            setSelectedFiles([]);
            setSelectedFieldName('');
          }} variant="outlined">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function extractFileNameFromUrl(url: string): string {
  try {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const cleanFileName = fileName.split('?')[0];
    if (!cleanFileName.includes('.')) {
      const pathParts = url.split('/');
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (pathParts[i].includes('.')) {
          return pathParts[i].split('?')[0];
        }
      }
    }
    return cleanFileName || 'Archivo';
  } catch (error) {
    return 'Archivo';
  }
}

const handleOpenFile = (fileInfo: { name: string; url: string; size?: number }) => {
  if (fileInfo.url) {
    window.open(fileInfo.url, '_blank');
  }
}; 