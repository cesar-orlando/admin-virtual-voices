import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTableBySlug } from '../api/servicios'
import DynamicDataTable from '../components/DynamicDataTable'
import type { DynamicTable, DynamicRecord } from '../types'
import AddIcon from '@mui/icons-material/Add'
import * as XLSX from 'xlsx';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import ExcelImportDialog from '../components/ExcelImportDialog';
import { importRecords } from '../api/servicios/dynamicTableServices';

// Fuzzy match helper
function fuzzyMatch(str: string, options: string[]): string | null {
  const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, '');
  const strNorm = normalized(str);
  let best = null;
  let bestScore = 0;
  for (const opt of options) {
    const optNorm = normalized(opt);
    let score = 0;
    // Coincidencia exacta
    if (optNorm === strNorm) score = 100;
    // Coincidencia parcial
    else if (optNorm.includes(strNorm) || strNorm.includes(optNorm)) score = 80;
    // Coincidencia por palabras
    else {
      const strParts = strNorm.split(/\s+/);
      const optParts = optNorm.split(/\s+/);
      score = strParts.filter(p => optNorm.includes(p)).length * 10;
      score += optParts.filter(p => strNorm.includes(p)).length * 10;
    }
    if (score > bestScore) {
      best = opt;
      bestScore = score;
    }
  }
  return bestScore >= 50 ? best : null;
}

// Al inicializar el mapeo, todos los selects deben estar en 'Ignorar'
const initializeFieldMapping = (excelFields: string[], tableFields: any[], tableLabels: string[]) => {
  const mapping: { [excelField: string]: string } = {};
  for (const excelField of excelFields) {
    mapping[excelField] = '';
  }
  return mapping;
};

export default function TableRecords() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [table, setTable] = useState<DynamicTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  // Elimina todo lo relacionado con el importador de Excel:
  // - Estados: importDialogOpen, importedRows, importedFields, excelFileName, fieldMapping, mappingError, etc.
  // - Handlers: handleOpenImportDialog, handleCloseImportDialog, handleExcelFile, handleFieldMappingChange, handleImportExcel
  // - UI: <Dialog> de importación, lógica de mapeo, previsualización, validaciones, etc.
  // Deja solo:
  const { enqueueSnackbar } = useSnackbar();

  const { tableSlug } = useParams<{ tableSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const handleOpenImportDialog = () => setImportDialogOpen(true);
  const handleCloseImportDialog = () => setImportDialogOpen(false);
  const handleImportExcel = async (mappedRows: any[]) => {
    if (!table || !tableSlug || !user) return;
    try {
      const recordsToImport = mappedRows.map(data => ({ data }));
      await importRecords(tableSlug, recordsToImport, user);
      enqueueSnackbar('Registros importados exitosamente', { variant: 'success' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      enqueueSnackbar('Error al importar registros', { variant: 'error' });
      console.error('Error al importar registros:', err);
    }
  };

  useEffect(() => {
    if (tableSlug && user) {
      loadTable()
    }
  }, [tableSlug, user, refreshTrigger])

  const loadTable = async () => {
    if (!tableSlug || !user) return

    try {
      setLoading(true)
      setError(null)
      const tableData = await getTableBySlug(tableSlug, user)
      setTable(tableData)
    } catch (err) {
      setError('Error al cargar la tabla')
      console.error('Error loading table:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordCreate = () => {
    navigate(`/tablas/${tableSlug}/nuevo`)
  }

  const handleRecordEdit = (record: DynamicRecord) => {
    navigate(`/tablas/${tableSlug}/editar/${record._id}`)
  }

  const handleRecordView = (record: DynamicRecord) => {
    navigate(`/tablas/${tableSlug}/ver/${record._id}`)
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Para saber si un campo de la tabla es requerido
  const isFieldRequired = (f: any) => f.required;
  const requiredFields = table ? (table.fields as any[]).filter(isFieldRequired) : [];
  const requiredFieldKeys = requiredFields.map(f => f.key);

  if (loading && !table) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: '100%',
          minHeight: { xs: '100vh', md: '85vh' },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        <Skeleton 
          variant="text" 
          width={isMobile ? "80%" : "40%"} 
          height={isMobile ? 36 : 48} 
          sx={{ mb: 2 }} 
        />
        <Skeleton 
          variant="rectangular" 
          height={isMobile ? 'calc(100vh - 200px)' : 'calc(80vh - 100px)'} 
          sx={{ borderRadius: { xs: 2, md: 1 } }}
        />
      </Box>
    )
  }

  if (error || !table) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          {error || 'No se pudo cargar la tabla'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      component="main"
      sx={{
        p: { xs: 2, md: 3 },
        width: '100%',
        minHeight: { xs: '100vh', md: '85vh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
      
{/*       <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={handleOpenImportDialog}
        sx={{ mb: 2, alignSelf: 'flex-end' }}
      >
        Importar Excel
      </Button>
      <ExcelImportDialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        tableFields={table ? (table.fields as any[]).map(f => ({ key: f.key, label: f.label, required: f.required })) : []}
        onImport={handleImportExcel}
      /> */}
     
      {/* Tabla dinámica */}
      <DynamicDataTable
        table={table}
        onRecordEdit={handleRecordEdit}
        onRecordView={handleRecordView}
        refreshTrigger={refreshTrigger}
        visibleFields={table.slug === 'asesor' ? ['nombre', 'apellido'] : undefined}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* Botón de nuevo registro */}
      <Button
        variant="contained"
        startIcon={<AddIcon fontSize={isMobile ? "small" : "medium"} />}
        onClick={handleRecordCreate}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, md: 32 },
          right: { xs: 20, md: 32 },
          borderRadius: { xs: 28, md: 3 },
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 1.5 },
          minWidth: { xs: 56, md: 'auto' },
          width: { xs: 56, md: 'auto' },
          height: { xs: 56, md: 'auto' },
          fontSize: { xs: '0.875rem', md: '1rem' },
          background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          boxShadow: theme.shadows[6],
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[10],
          },
          transition: 'all 0.2s ease-out',
          zIndex: 1200,
          '& .MuiButton-startIcon': {
            marginRight: { xs: 0, md: 1 },
            marginLeft: 0
          }
        }}
      >
        {!isMobile && 'Nuevo Registro'}
      </Button>
    </Box>
  )
}
