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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { useSnackbar } from 'notistack';
import { 
  getRecords, 
  deleteRecord, 
  exportRecords,
  getTableStats,
  importRecords,
} from '../api/servicios';
import { exportTableData } from '../utils/exportUtils';
import type { DynamicTable, DynamicRecord, TableField, TableStats } from '../types';
import { ExcelImportDialog } from './ExcelImportDialog';

interface DynamicDataTableProps {
  table: DynamicTable;
  onRecordEdit?: (record: DynamicRecord) => void;
  onRecordView?: (record: DynamicRecord) => void;
  onRecordCreate?: () => void;
  refreshTrigger?: number;
  onImportExcel?: () => void; // NUEVO: handler para importar Excel
  visibleFields?: string[]; // NUEVO: lista de campos visibles
}

export default function DynamicDataTable({ 
  table, 
  onRecordEdit, 
  onRecordView, 
  onRecordCreate,
  refreshTrigger = 0,
  onImportExcel,
  visibleFields // NUEVO
}: DynamicDataTableProps) {
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [stats, setStats] = useState<TableStats | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<DynamicRecord | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // State for date filters
  const [dateFields, setDateFields] = useState<{name: string, label: string}[]>([]);
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // File handling functions
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const theme = useTheme();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Sorting state
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);

  // State para exportación
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    // Identificar los campos de fecha disponibles para filtrar
    const availableDateFields = table.fields
      .filter(field => field.type === 'date')
      .map(field => ({ name: field.name, label: field.label }));
    availableDateFields.push({name: 'createdAt', label: 'Fecha de Creacion'})
    setDateFields(availableDateFields);
  }, [table.fields]);

  useEffect(() => {
    // Carga de datos
    loadRecords();
    if (!searchQuery) { // Solo cargar stats si no es una búsqueda para evitar llamadas extra
        loadStats();
    }
  }, [table.slug, page, rowsPerPage, refreshTrigger, activeFilters, searchQuery]); // Add searchQuery to trigger reload when needed

  // Enhanced search with local filtering approach
  useEffect(() => {
    // Reset to first page whenever search changes
    setPage(0);
  }, [debouncedSearchQuery, table.name]);

  // Filtrar campos visibles si visibleFields está definido
  const displayedFields = useMemo(() => {
    if (!visibleFields) return table.fields;
    return table.fields.filter(f => visibleFields.includes(f.name));
  }, [table.fields, visibleFields]);

  // Local search helper for client-side filtering (as backup)
  const matchesLocalSearch = useMemo(() => {
    return (record: DynamicRecord, query: string): boolean => {
      if (!query) return true;
      
      const normalizedQuery = query.toLowerCase().trim();
      
      // Search in all visible fields of the current table
      for (const field of displayedFields) {
        const value = record.data[field.name];
        if (value == null) continue;
        
        let searchableText = '';
        
        // Handle different field types
        if (typeof value === 'string') {
          searchableText = value;
        } else if (typeof value === 'number') {
          searchableText = value.toString();
        } else if (typeof value === 'boolean') {
          searchableText = value ? 'si' : 'no';
        } else if (typeof value === 'object') {
          // Handle objects (like asesor field)
          try {
            if ('name' in value) {
              searchableText = String(value.name);
            } else {
              searchableText = JSON.stringify(value);
            }
          } catch {
            searchableText = String(value);
          }
        } else {
          searchableText = String(value);
        }
        
        // Simple case-insensitive search
        if (searchableText.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
      }
      
      return false;
    };
  }, [displayedFields]);

  const handleImportExcel = async (data: any[], options: any) => {
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const result = await importRecords(
      table.slug, 
      data.map(record => ({ data: record })), 
      user, 
      options
    );
    
    // Refresh the table data
    await loadRecords();
    await loadStats();
    
    return {
      newRecords: result.summary?.newRecords || 0,
      updatedRecords: result.summary?.updatedRecords || 0,
      duplicatesSkipped: result.summary?.duplicatesSkipped || 0,
      errors: result.errors || []
    };
  } catch (error: any) {
    console.error('Import error:', error);
    throw new Error('Error during import: ' + (error.message || 'Unknown error'));
  }
};

  const loadRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load records without search filters - let frontend handle search
      const filtersWithoutSearch = { ...activeFilters };
      delete filtersWithoutSearch.search;
      delete filtersWithoutSearch.q;
      delete filtersWithoutSearch.query;
      delete filtersWithoutSearch.originalQuery;
      
      // When searching, load more records to improve search results
      const effectiveLimit = searchQuery ? Math.max(rowsPerPage * 4, 100) : rowsPerPage;
      const effectivePage = searchQuery ? 1 : page + 1; // Always load first page when searching
      
      const response = await getRecords(
        table.slug, 
        user, 
        effectivePage, 
        effectiveLimit,
        'updatedAt',
        'desc',
        Object.keys(filtersWithoutSearch).length > 0 ? filtersWithoutSearch : undefined
      );
      
      setRecords(response.records);
      
      // Only update totalRecords when not searching (since we're loading more data for search)
      if (!searchQuery) {
        setTotalRecords(response.pagination.total);
      }
    } catch (err) {
      setError('Error al cargar los registros');
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
  // Función para obtener todos los registros de la tabla
  const getAllRecordsForExport = async (): Promise<DynamicRecord[]> => {
    if (!user) return [];

    try {
      setExporting(true);
      setExportProgress(0);
      
      const allRecords: DynamicRecord[] = [];
      let currentPage = 1;
      const pageSize = 100; // Obtener 100 registros por página para optimizar
      let hasMoreRecords = true;
      let totalRecords = 0;

      // Primero obtener el total de registros
      const firstResponse = await getRecords(
        table.slug, 
        user, 
        1, 
        1,
        'createdAt',
        'desc',
        activeFilters
      );
      totalRecords = firstResponse.pagination.total;

      while (hasMoreRecords) {
        const response = await getRecords(
          table.slug, 
          user, 
          currentPage, 
          pageSize,
          'createdAt',
          'desc',
          activeFilters
        );
        
        allRecords.push(...response.records);
        
        // Actualizar progreso
        const progress = Math.min((allRecords.length / totalRecords) * 100, 100);
        setExportProgress(progress);
        
        // Verificar si hay más páginas
        if (response.records.length < pageSize || allRecords.length >= totalRecords) {
          hasMoreRecords = false;
        } else {
          currentPage++;
        }
      }

      setExportProgress(100);
      return allRecords;
    } catch (error) {
      console.error('Error getting all records for export:', error);
      throw new Error('No se pudieron obtener todos los registros para exportar');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }

    handleMenuClose();
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
    if (selectedDateField && selectedDates.length > 0) {
      const newFilters = Object.entries(activeFilters)
        .filter(([key, val]) => {
          if (typeof val === 'object' && val !== null && ('$gte' in val || '$lte' in val)) {
            return false;
          }
          return true;
        })
        .reduce((acc, [key, val]) => {
          acc[key] = val;
          return acc;
        }, {} as Record<string, unknown>);

      // Si solo hay una fecha seleccionada, filtrar por ese día
      if (selectedDates.length === 1) {
        const selectedDate = selectedDates[0]; // "YYYY-MM-DD"
        newFilters[selectedDateField] = {
          $gte: selectedDate,
          $lte: selectedDate
        };
      } else if (selectedDates.length === 2) {
        // Si hay dos fechas, usar como rango
        const sortedDates = [...selectedDates].sort();
        newFilters[selectedDateField] = {
          $gte: sortedDates[0],
          $lte: sortedDates[1]
        };
      }
      
      setActiveFilters(newFilters);
      setPage(0); // Reset page to 1 on new filter
    }
    handleFilterClose();
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSelectedDateField('');
    setSelectedDates([]);
    setPage(0);
    handleFilterClose();
  };

  const handleDateClick = (day: number) => {
    // Crear fecha string manualmente para evitar problemas de zona horaria
    const year = currentYear;
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        // Si la fecha ya está seleccionada, la quitamos
        return prev.filter(d => d !== dateString);
      } else if (prev.length < 2) {
        // Si hay menos de 2 fechas, agregamos la nueva
        return [...prev, dateString].sort();
      } else {
        // Si ya hay 2 fechas, reemplazamos con la nueva
        return [dateString];
      }
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Ajustar para que lunes sea 0
  };

  const isDateSelected = (day: number) => {
    const year = currentYear;
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return selectedDates.includes(dateString);
  };

  const getDateColor = (day: number) => {
    const year = currentYear;
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    const index = selectedDates.indexOf(dateString);
    if (index === 0) return '#1976d2'; // Azul para primera fecha
    if (index === 1) return '#e91e63'; // Rosa para segunda fecha
    return 'transparent';
  };

  const DatePicker = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton onClick={() => navigateMonth('prev')} size="small">
            <Typography sx={{ fontSize: '1.2rem' }}>←</Typography>
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
            {monthNames[currentMonth]} {currentYear}
          </Typography>
          <IconButton onClick={() => navigateMonth('next')} size="small">
            <Typography sx={{ fontSize: '1.2rem' }}>→</Typography>
          </IconButton>
        </Box>

        {/* Days header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {dayNames.map(day => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: 'text.secondary',
                fontSize: '0.875rem',
                p: 1
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* Calendar days */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {/* Empty cells for days before first day of month */}
          {Array.from({ length: firstDay }).map((_, index) => (
            <Box key={`empty-${index}`} sx={{ height: 40 }} />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isSelected = isDateSelected(day);
            const bgColor = getDateColor(day);
            
            return (
              <Box
                key={day}
                onClick={() => handleDateClick(day)}
                sx={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  backgroundColor: isSelected ? bgColor : '#f8fafc',
                  color: isSelected ? 'white' : 'text.primary',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  '&:hover': {
                    backgroundColor: isSelected ? bgColor : '#e2e8f0',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {day}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };





  const handleFileClick = (files: any[], fieldName: string) => {
    setSelectedFiles(files || []);
    setSelectedFieldName(fieldName);
    setFileModalOpen(true);
    setGalleryIndex(0);
  };

  const handleGalleryPrev = () => setGalleryIndex((prev) => Math.max(prev - 1, 0));
  const handleGalleryNext = () => setGalleryIndex((prev) => Math.min(prev + 1, selectedFiles.length - 1));

  // Add this helper function at the top of your component or in a utils file
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  };

  // Update your formatFieldValue function
  const formatFieldValue = (
    value: unknown,
    field: TableField,
    isFirstColumn = false
  ): { content: string | JSX.Element; tooltip?: string } => {
    // Handle "numero" field formatting (ignoring accents and caps)
    if (normalizeText(field.name).includes('numero') || normalizeText(field.label).includes('numero')) {
      const numero = String(value || '').replace(/\D/g, ''); // Remove non-digits
    
      // Format as "521 6441 59 34 90"
      if (numero.length >= 12) {
        const formatted = `${numero.slice(0, 3)} ${numero.slice(3, 7)} ${numero.slice(7, 9)} ${numero.slice(9, 11)} ${numero.slice(11, 13)}`;
        return { 
          content: formatted,
          tooltip: formatted
        };
      } else {
        return { content: numero || '-' };
      }
    }

    // Si el campo es 'asesor', renderiza solo el campo 'name' si existe
    if (field.name === 'asesor') {
      let name = '';
      if (typeof value === 'string') {
        try {
          const obj = JSON.parse(value);
          if (obj && obj.name) name = obj.name;
          else name = value;
        } catch {
          name = value;
        }
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        typeof (value as { name?: unknown }).name === 'string'
      ) {
        name = (value as { name: string }).name;
      } else {
        name = value as string;
      }
      return { 
        content: <Chip label={name} size="small" color="primary" sx={{ fontWeight: 600, color: '#fff' }} />,
        tooltip: name.length > 25 ? name : undefined
      };
    }
    // Si el campo es 'medio', renderiza un Chip de color
    if (field.name === 'medio') {
      const label = String(value || '').toLowerCase();
      const sx: React.CSSProperties = { fontWeight: 600, color: '#fff', border: 0 };
      const display = label.charAt(0).toUpperCase() + label.slice(1);
      switch (label) {
        case 'meta':
          sx.backgroundImage = 'linear-gradient(90deg, #8B5CF6 0%, #E05EFF 100%)';
          break;
        case 'google':
          sx.backgroundImage = 'linear-gradient(90deg, #4285F4 0%, #34A853 100%)';
          break;
        case 'interno':
          sx.backgroundImage = 'linear-gradient(90deg, #10B981 0%, #059669 100%)';
          break;
        default:
          sx.background = '#E5E7EB';
          sx.color = '#374151';
      }
      return { 
        content: <Chip label={display} size="small" sx={sx} />,
        tooltip: display.length > 25 ? display : undefined
      };
    }
    if (isFirstColumn) {
      return { 
        content: (
          <Chip
            label={String(value)}
            size="small"
            color="primary"
            sx={{ fontWeight: 600, color: '#fff' }}
          />
        ),
        tooltip: String(value).length > 25 ? String(value) : undefined
      };
    }
    if (value === null || value === undefined) return { content: '-' };
    
    switch (field.type) {
      case 'date': {
        // Ensure value is string, number, or Date before passing to Date constructor
        let dateValue: string | number | Date = '';
        if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
          dateValue = value;
        }
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return { content: '-' };
        }
        const formattedDate = date.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return { content: formattedDate };
      }
      case 'boolean':
        return { content: value ? 'Sí' : 'No' };
      case 'currency': {
        const numericValue = typeof value === 'number' ? value : Number(value);
        const formattedCurrency = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(isNaN(numericValue) ? 0 : numericValue);
        return { content: formattedCurrency };
      }
      case 'number': {
        const numericValue = typeof value === 'number' ? value : Number(value);
        const formattedNumber = new Intl.NumberFormat('es-MX').format(isNaN(numericValue) ? 0 : numericValue);
        return { content: formattedNumber };
      }
      case 'file': {
        let files: any[] = [];
        if (Array.isArray(value)) {
          files = value;
        } else if (typeof value === 'string') {
          if (value.includes('http')) {
            files = value.split(/\s+/).filter((url) => url.startsWith('http'));
          } else {
            files = [value];
          }
        } else if (value && typeof value === 'object') {
          if ('urls' in value && Array.isArray((value as { urls?: unknown }).urls)) {
            files = (value as { urls: string[] }).urls;
          } else if ('files' in value && Array.isArray((value as { files?: unknown }).files)) {
            files = (value as { files: string[] }).files;
          } else {
            files = Object.values(value).filter(v => typeof v === 'string' && v.startsWith('http'));
          }
        }
        const validFiles = files.filter(file => typeof file === 'string' && file.startsWith('http'));
        if (validFiles.length > 0) {
          return {
            content: (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.15)',
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  }
                }}
                onClick={() => handleFileClick(validFiles, field.name)}
              >
                <AttachFileIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.primary.main, 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {validFiles.length} archivo{validFiles.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            ),
            tooltip: `Ver ${validFiles.length} archivo${validFiles.length !== 1 ? 's' : ''}`
          };
        }
        return { content: '-' };
      }
      default: {
        const stringValue = String(value);
        return { 
          content: stringValue,
          tooltip: stringValue.length > 25 ? stringValue : undefined
        };
      }
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
  
  const sortedRecords = useMemo(() => {
    const sorted = [...records];
    
    if (sortableField && sortBy) {
      sorted.sort((a, b) => {
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
    
    return sorted;
  }, [records, sortBy, sortDirection, sortableField]);

  // Apply local search filtering to all records
  const displayRecords = useMemo(() => {
    let filteredRecords = sortedRecords;
    
    // Apply local search if there's a search query
    if (searchQuery) {
      filteredRecords = sortedRecords.filter(record => 
        matchesLocalSearch(record, searchQuery)
      );
    }
    
    return filteredRecords;
  }, [sortedRecords, searchQuery, matchesLocalSearch]);

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
          {/* Enhanced Search Field */}
          <Box sx={{ position: 'relative', minWidth: 320 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre, teléfono, email, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.08)'
                      : 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.12)'
                        : 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                  },
                  '&.Mui-focused': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.15)'
                        : 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid #8B5CF6',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.25)',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                  '& input': {
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: theme.palette.text.secondary,
                      opacity: 0.7,
                    }
                  }
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon 
                      fontSize="small" 
                      sx={{ 
                        color: searchQuery ? '#8B5CF6' : theme.palette.text.secondary,
                        transition: 'color 0.3s ease'
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: '#8B5CF6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '18px', fontWeight: 'bold' }}>×</Typography>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
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
            <MenuItem onClick={() => { 
              setActionsAnchorEl(null); 
              setImportDialogOpen(true);
            }}>
              <ListItemIcon><ImportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Importar Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={async () => { 
              setActionsAnchorEl(null); 
              try {
                const allRecords = await getAllRecordsForExport();
                exportTableData(table, allRecords, 'csv');
                enqueueSnackbar(`Se exportaron ${allRecords.length} registros a CSV exitosamente`, { variant: 'success' });
              } catch (err) {
                console.error('Error exporting CSV:', err);
                enqueueSnackbar('Error al exportar CSV', { variant: 'error' });
              }
            }}>
              <ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Exportar CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={async () => { 
              setActionsAnchorEl(null); 
              try {
                const allRecords = await getAllRecordsForExport();
                exportTableData(table, allRecords, 'excel');
                enqueueSnackbar(`Se exportaron ${allRecords.length} registros a Excel exitosamente`, { variant: 'success' });
              } catch (err) {
                console.error('Error exporting Excel:', err);
                enqueueSnackbar('Error al exportar Excel', { variant: 'error' });
              }
            }}>
              <ListItemIcon><InsertDriveFileIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Exportar Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={async () => { 
              setActionsAnchorEl(null); 
              try {
                const allRecords = await getAllRecordsForExport();
                exportTableData(table, allRecords, 'json');
                enqueueSnackbar(`Se exportaron ${allRecords.length} registros a JSON exitosamente`, { variant: 'success' });
              } catch (err) {
                console.error('Error exporting JSON:', err);
                enqueueSnackbar('Error al exportar JSON', { variant: 'error' });
              }
            }}>
              <ListItemIcon><AttachFileIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Exportar JSON</ListItemText>
            </MenuItem>
          </Menu>
          
          {/* Indicador de progreso de exportación */}
          {exporting && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Exportando... {Math.round(exportProgress)}%
              </Typography>
            </Box>
          )}
          
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
                {displayedFields.map((field, idx) => {
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
                <TableCell key="createdAt" sx={{ minWidth: 150, fontWeight: 'bold', maxWidth: 220, p: 1 }}>
                  Fecha de Creación
                </TableCell>
                <TableCell sx={{ width: '50px' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={displayedFields.length + 2}>
          <Skeleton variant="text" height={40} />
        </TableCell>
      </TableRow>
                ))
              ) : (
                displayRecords.map((record) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={record._id}>
                    {displayedFields.map((field, idx) => {
                      const fieldData = formatFieldValue(record.data[field.name], field, idx === 0);
                      return (
                        <TableCell key={field.name} sx={{ maxWidth: 220, p: 1 }}>
                          {fieldData.tooltip ? (
                            <Tooltip 
                              title={fieldData.tooltip} 
                              placement="top" 
                              arrow
                              PopperProps={{
                                sx: {
                                  '& .MuiTooltip-tooltip': {
                                    maxWidth: 400,
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                  }
                                }
                              }}
                            >
                              <Box sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}>
                                {fieldData.content}
                              </Box>
                            </Tooltip>
                          ) : (
                            <Box sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {fieldData.content}
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                    {/* Add createdAt field as a new TableCell with a Tooltip */}
                    <TableCell align="left" sx={{ maxWidth: 220, p: 1 }}>
                      <Tooltip title={record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'} placement="top" arrow>
                        <span>{record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}</span>
                      </Tooltip>
                    </TableCell>
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
          rowsPerPageOptions={[ 25, 50, 100]}
          component="div"
          count={searchQuery ? displayRecords.length : totalRecords} // Use filtered count when searching
          rowsPerPage={rowsPerPage}
          page={searchQuery ? 0 : page} // Always show page 0 when searching locally
          onPageChange={(e, newPage) => {
            if (!searchQuery) {
              setPage(newPage)
            }
          }}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 25));
            if (!searchQuery) {
              setPage(0);
            }
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => {
            if (searchQuery) {
              return `${displayRecords.length} resultado${displayRecords.length !== 1 ? 's' : ''} de búsqueda`;
            }
            return `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`;
          }}
        />
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { width: 400, p: 3, borderRadius: 3 } }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
          🗓️ Filtrar por Fecha
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
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

        {/* Calendar Component */}
        {selectedDateField && (
          <Box sx={{ mb: 3 }}>
            <DatePicker />
            
            {/* Fechas Seleccionadas */}
            {selectedDates.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                  Fechas Seleccionadas:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedDates.map((date, index) => (
                    <Chip
                      key={index}
                      label={new Date(date).toLocaleDateString('es-ES')}
                      size="small"
                      sx={{ 
                        fontSize: '0.75rem',
                        backgroundColor: index === 0 ? '#1976d2' : '#e91e63',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      onDelete={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleClearFilters} size="small" variant="outlined">
            Limpiar
          </Button>
          <Button 
            onClick={handleApplyDateFilter} 
            variant="contained" 
            size="small"
            disabled={!selectedDateField || selectedDates.length === 0}
          >
            Aplicar Filtro
          </Button>
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

      {/* Import Excel Dialog */}
      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        tableFields={table.fields.map(f => ({ 
          key: f.name, 
          label: f.label, 
          required: f.required || false,
          type: f.type 
        }))}
        onImport={handleImportExcel}
      />
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