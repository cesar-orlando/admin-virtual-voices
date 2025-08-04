import React, { useState, useEffect } from 'react'
import {
  Box,
  Alert,
  Skeleton,
  Button,
  useTheme,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTableBySlug } from '../api/servicios'
import DynamicDataTable from '../components/DynamicDataTable'
import type { DynamicTable, DynamicRecord } from '../types'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSnackbar } from 'notistack';
import { ExcelImportDialog } from '../components/ExcelImportDialog';
import { importRecords } from '../api/servicios/dynamicTableServices';

export default function TableRecords() {
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
  const theme = useTheme()

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const handleOpenImportDialog = () => setImportDialogOpen(true);
  const handleCloseImportDialog = () => setImportDialogOpen(false);
  const handleImportExcel = async (data: any[], options: any) => {
    if (!table || !tableSlug || !user) {
      return { newRecords: 0, updatedRecords: 0, duplicatesSkipped: 0, errors: ['No hay tabla o usuario disponible'] };
    }
    
    try {
      const recordsToImport = data.map(rowData => ({ data: rowData }));
      const result = await importRecords(tableSlug, recordsToImport, user, options);
      
      enqueueSnackbar(`Importación completada: ${result.created || 0} registros creados`, { variant: 'success' });
      setRefreshTrigger(prev => prev + 1);
      
      return {
        newRecords: result.created || 0,
        updatedRecords: result.updated || 0,
        duplicatesSkipped: result.skipped || 0,
        errors: result.errors || []
      };
    } catch (err) {
      const errorMsg = 'Error al importar registros';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      console.error('Error al importar registros:', err);
      
      return {
        newRecords: 0,
        updatedRecords: 0,
        duplicatesSkipped: 0,
        errors: [errorMsg]
      };
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

  if (loading && !table) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={'calc(80vh - 100px)'} />
      </Box>
    )
  }

  if (error || !table) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No se pudo cargar la tabla'}</Alert>
      </Box>
    )
  }

  return (
    <Box
      component="main"
      sx={{
        p: 3,
        width: '92vw',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
      <Button
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
        tableFields={table ? (table.fields as any[]).map(f => ({ key: f.key, label: f.label, required: f.required, type: f.type })) : []}
        onImport={handleImportExcel}
      />
     
      {/* Tabla dinámica */}
      <DynamicDataTable
        table={table}
        onRecordEdit={handleRecordEdit}
        onRecordView={handleRecordView}
        refreshTrigger={refreshTrigger}
        visibleFields={table.slug === 'asesor' ? ['nombre', 'apellido'] : undefined}
      />

      {/* Botón de nuevo registro (igual que antes) */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleRecordCreate}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          borderRadius: 3,
          px: 3,
          py: 1.5,
          background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          boxShadow: theme.shadows[6],
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[10],
          },
          transition: 'all 0.2s ease-out',
          zIndex: 1200,
        }}
      >
        Nuevo Registro
      </Button>
    </Box>
  )
}
