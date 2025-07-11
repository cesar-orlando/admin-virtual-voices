import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Preview as PreviewIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createTable, importRecords } from '../api/servicios';
import type { TableField, FieldType } from '../types';
import * as XLSX from 'xlsx';

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Texto', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'date', label: 'Fecha', icon: '📅' },
  { value: 'boolean', label: 'Booleano', icon: '✅' },
  { value: 'select', label: 'Selección', icon: '📋' },
  { value: 'currency', label: 'Moneda', icon: '💰' },
  { value: 'file', label: 'Archivo', icon: '📎' },
];

const ICONS = [
  '📊', '📈', '📉', '📋', '📝', '📄', '📁', '📂', '📌', '📍', '🎯', '⭐', '💡', '🔧', '⚙️', '🎨',
  '👥', '👤', '👨‍💼', '👩‍💼', '🏢', '🏪', '🏭', '🏗️', '🚗', '✈️', '🚢', '📦', '📱', '💻', '🖥️', '📺'
];

const steps = ['Información Básica', 'Definir Campos', 'Revisar y Crear'];

interface ImportReport {
  successful: number;
  failed: number;
  total: number;
  errors: { index: number; error: string }[];
  duplicatesRemoved: number;
  duplicateFields: { fieldName: string; count: number }[];
}

// Utilidad para normalizar encabezados
function normalizeHeader(header: string, index: number, existing: Set<string>): string {
  let base = header
    ? header
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    : `campo_${index + 1}`;
  let name = base;
  let count = 1;
  while (existing.has(name)) {
    name = `${base}_${count++}`;
  }
  existing.add(name);
  return name;
}

// Utilidad para detectar tipo de campo
function detectType(values: any[]): string {
  const nonEmpty = values.filter((v: any) => v !== undefined && v !== null && v !== '');
  if (nonEmpty.length === 0) return 'text';
  if (nonEmpty.every((v: any) => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''))) return 'number';
  if (nonEmpty.every((v: any) => !isNaN(Date.parse(v)))) return 'date';
  if (nonEmpty.every((v: any) => ['true', 'false', '1', '0'].includes(String(v).toLowerCase()))) return 'boolean';
  return 'text';
}

// Función para detectar registros duplicados basándose en campos específicos
const detectAndRemoveDuplicates = (records: Record<string, any>[], fields: TableField[]): {
  uniqueRecords: Record<string, any>[];
  duplicatesRemoved: number;
  duplicateFields: { fieldName: string; count: number }[];
} => {
  const seen = new Set<string>();
  const uniqueRecords: Record<string, any>[] = [];
  let duplicatesRemoved = 0;

  records.forEach((record) => {
    // Crea una clave única usando TODOS los campos
    const key = fields.map(field => {
      const value = record[field.name];
      return value !== undefined && value !== null && value !== '' ? String(value).toLowerCase().trim() : '';
    }).join('|');

    if (key && seen.has(key)) {
      duplicatesRemoved++;
    } else {
      if (key) seen.add(key);
      uniqueRecords.push(record);
    }
  });

  return {
    uniqueRecords,
    duplicatesRemoved,
    duplicateFields: [] // Opcional: puedes eliminar este reporte o ajustarlo si quieres
  };
};

export default function CreateTable() {
  const [activeStep, setActiveStep] = useState(0);
  const [tableName, setTableName] = useState('');
  const [tableSlug, setTableSlug] = useState('');
  const [tableIcon, setTableIcon] = useState('📊');
  const [tableDescription, setTableDescription] = useState('');
  const [fields, setFields] = useState<TableField[]>([]);
  const [importedRecords, setImportedRecords] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formErrors, setFormErrors] = useState<{ slug?: string; general?: string }>({});
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectOptionsInputs, setSelectOptionsInputs] = useState<{ [index: number]: string }>({});
  const [duplicateReport, setDuplicateReport] = useState<{
    duplicatesRemoved: number;
    duplicateFields: { fieldName: string; count: number }[];
    originalCount: number;
    finalCount: number;
  } | null>(null);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNext = () => {
    if (activeStep === 0) {
      if (!tableName || !tableSlug) {
        setFormErrors({ general: 'Por favor completa todos los campos requeridos' });
        return;
      }
    }
    if (activeStep === 1) {
      if (fields.length === 0) {
        setFormErrors({ general: 'Debes agregar al menos un campo' });
        return;
      }
    }
    setFormErrors({});
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddField = () => {
    const newField: TableField = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      order: fields.length + 1,
      width: 150,
    };
    setFields([...fields, newField]);
  };

  // Normaliza el nombre del campo a formato slug
  function normalizeFieldName(label: string): string {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/ñ/g, 'n')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

const handleUpdateField = (index: number, field: Partial<TableField>) => {
  const updatedFields = [...fields];
  // Si cambia la etiqueta, actualiza el nombre automáticamente
  if (field.label !== undefined) {
    updatedFields[index] = {
      ...updatedFields[index],
      ...field,
      name: normalizeFieldName(field.label)
    };
  } else {
    updatedFields[index] = { ...updatedFields[index], ...field };
  }
  setFields(updatedFields);

  // Si se actualiza el tipo a 'select', inicializa el input de opciones si no existe
  if (field.type === 'select' && selectOptionsInputs[index] === undefined) {
    setSelectOptionsInputs((prev) => ({
      ...prev,
      [index]: updatedFields[index].options?.join(', ') || '',
    }));
  }
};

  const handleRemoveField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    // Reordenar los campos
    updatedFields.forEach((field, i) => {
      field.order = i + 1;
    });
    setFields(updatedFields);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormErrors({});
    setDuplicateReport(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rows || rows.length === 0) throw new Error('El archivo está vacío.');

        // ¿La primera fila es encabezado?
        let headers = rows[0];
        let dataStart = 1;
        let hasHeader = headers.every(h => typeof h === 'string' && h.trim() !== '');
        if (!hasHeader) {
          // Si la primera fila no es encabezado, genera nombres genéricos
          headers = Array.from({ length: rows[0].length }, (_, i) => `campo_${i + 1}`);
          dataStart = 0;
        }
        // Normaliza encabezados y asegura unicidad
        const existing: Set<string> = new Set();
        const normalizedHeaders = headers.map((h: string, i: number) => normalizeHeader(h, i, existing));

        // Extrae columnas para detección de tipo
        const columns = normalizedHeaders.map((_, colIdx) => rows.slice(dataStart).map(row => row[colIdx]));
        const types = columns.map(col => detectType(col));

        // Crea los campos sugeridos
        const newFields: TableField[] = normalizedHeaders.map((name, i) => ({
          name,
          label: headers[i] || name,
          type: types[i] as FieldType,
          required: false,
          order: i + 1,
          width: 150,
        }));
        setFields(newFields);

        // Mapear los datos de los registros para usar los nombres de campo internos (slugs)
        const allRecordsData: any[] = rows.slice(dataStart).map(row => {
          const newRow: Record<string, any> = {};
          normalizedHeaders.forEach((name, i) => {
            newRow[name] = row[i];
          });
          return newRow;
        });

        // Detectar y eliminar duplicados
        const { uniqueRecords, duplicatesRemoved, duplicateFields } = detectAndRemoveDuplicates(allRecordsData, newFields);
        
        setImportedRecords(uniqueRecords);
        
        // Mostrar reporte de duplicados
        if (duplicatesRemoved > 0) {
          setDuplicateReport({
            duplicatesRemoved,
            duplicateFields,
            originalCount: allRecordsData.length,
            finalCount: uniqueRecords.length
          });
        }

        // Sugerir nombre de tabla basado en el nombre del archivo
        handleNameChange(file.name.replace(/\.(xlsx|xls|csv)$/, ''));
      } catch (err) {
        setFormErrors({ general: err instanceof Error ? err.message : 'Error al procesar el archivo. Asegúrate de que sea un formato válido.' });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Al guardar (handleCreateTable), antes de enviar los fields al backend, genera el nombre interno:
  const prepareFieldsForBackend = (fields: TableField[]) =>
    fields.map(f => ({
      ...f,
      name: normalizeFieldName(f.label)
    }));

  const handleCreateTable = async () => {
    if (!user) {
      setFormErrors({ general: 'Usuario no autenticado' });
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Creando tabla...');
      setFormErrors({});

      const tableData = {
        name: tableName,
        slug: tableSlug,
        icon: tableIcon,
        description: tableDescription,
        fields: prepareFieldsForBackend(fields),
        isActive: true,
      };

      const newTableResponse = await createTable(tableData, user);

      if (importedRecords.length > 0 && newTableResponse?.table?.slug) {
        setLoadingMessage(`Importando ${importedRecords.length} registros...`);
        const recordsToImport = importedRecords.map(record => ({ data: record }));
        const importResponse = await importRecords(newTableResponse.table.slug, recordsToImport, user);
        
        if (importResponse.summary) {
          setImportReport({
            successful: importResponse.summary.successful,
            failed: importResponse.summary.failed,
            total: importResponse.summary.total,
            errors: importResponse.errors || [],
            duplicatesRemoved: duplicateReport?.duplicatesRemoved || 0,
            duplicateFields: duplicateReport?.duplicateFields || []
          });
        } else {
          navigate('/tablas');
        }

      } else {
        navigate('/tablas');
      }
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || (err instanceof Error ? err.message : 'Ocurrió un error inesperado.');

      if (errorMessage.includes('slug already exists')) {
        setFormErrors({ slug: 'Este slug ya está en uso. Por favor, elige otro.' });
      } else {
        setFormErrors({ general: `Error: ${errorMessage}` });
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCloseReport = () => {
    setImportReport(null);
    navigate('/tablas');
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setTableName(name);
    setTableSlug(generateSlug(name));
    if (formErrors.slug) {
      setFormErrors({ ...formErrors, slug: undefined });
    }
  };

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Información de la Tabla
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la tabla"
              value={tableName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              helperText="Ej: Clientes, Productos, Ventas"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Slug (identificador)"
              value={tableSlug}
              InputProps={{ readOnly: true, startAdornment: <LockIcon sx={{ color: 'action.active', mr: 1 }} /> }}
              required
              error={!!formErrors.slug}
              sx={{ background: '#f5f6fa' }}
              helperText={formErrors.slug || "Este campo se llena automáticamente"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Button
                variant="outlined"
                onClick={() => setShowIconPicker(true)}
                sx={{ mb: 1 }}
              >
                Seleccionar Ícono: {tableIcon}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary">
                El ícono se mostrará en el sidebar
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={tableDescription}
              onChange={(e) => setTableDescription(e.target.value)}
              multiline
              rows={3}
              helperText="Describe el propósito de esta tabla"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderFieldBuilder = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Campos de la Tabla ({fields.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Importar desde Excel
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              style={{ display: 'none' }}
              accept=".xlsx, .xls, .csv"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddField}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                }
              }}
            >
              Agregar Campo
            </Button>
          </Box>
        </Box>

        {importedRecords.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se importarán {importedRecords.length} registros junto con la tabla.
            {duplicateReport && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Duplicados eliminados:</strong> {duplicateReport.duplicatesRemoved} de {duplicateReport.originalCount} registros originales
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Reporte de duplicados */}
        {duplicateReport && duplicateReport.duplicatesRemoved > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Reporte de Duplicados Eliminados
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Total eliminados:</strong> {duplicateReport.duplicatesRemoved} registros duplicados
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Registros únicos:</strong> {duplicateReport.finalCount} de {duplicateReport.originalCount} originales
            </Typography>
            
            {duplicateReport.duplicateFields.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Campos con más duplicados:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {duplicateReport.duplicateFields.slice(0, 5).map((field, index) => (
                    <Chip
                      key={index}
                      label={`${field.fieldName}: ${field.count}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Alert>
        )}

        {fields.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No hay campos definidos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega al menos un campo para definir la estructura de tu tabla
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1}>
            {fields.map((field, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={6} md={7}>
                      <TextField
                        fullWidth
                        label="Etiqueta"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={field.type}
                          onChange={(e) => handleUpdateField(index, { type: e.target.value as FieldType })}
                          label="Tipo"
                        >
                          {FIELD_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={3} sm={2} md={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.required || false}
                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                          />
                        }
                        label="Requerido"
                        sx={{ ml: 0 }}
                      />
                    </Grid>
                    <Grid item xs={3} sm={1} md={1} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveField(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {/* Opciones adicionales para campos tipo select */}
                  {field.type === 'select' && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Opciones (separadas por comas)"
                        value={selectOptionsInputs[index] ?? field.options?.join(', ') ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectOptionsInputs((prev) => ({
                            ...prev,
                            [index]: value,
                          }));
                          // No actualices field.options aquí, solo el input
                        }}
                        onBlur={() => {
                          // Al salir del input, actualiza el campo real
                          const options = (selectOptionsInputs[index] ?? '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                          handleUpdateField(index, { options });
                        }}
                        size="small"
                        helperText="Ej: Opción 1, Opción 2, Opción 3"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  const renderPreview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vista Previa de la Tabla
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{tableIcon}</span>
            {tableName}
          </Typography>
          {tableDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {tableDescription}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Estructura de Campos ({fields.length})
        </Typography>
        
        <Grid container spacing={2}>
          {fields.map((field, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {field.label}
                  </Typography>
                  <Chip
                    label={field.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {field.name}
                </Typography>
                {field.required && (
                  <Chip
                    label="Requerido"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
                {field.type === 'select' && field.options && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Opciones: {field.options.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderFieldBuilder();
      case 2:
        return renderPreview();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, width: '90vw', height: '80vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/tablas')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Crear Nueva Tabla
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Define la estructura de tu tabla personalizada
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {formErrors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formErrors.general}
        </Alert>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Anterior
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleCreateTable}
              disabled={loading}
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                }
              }}
            >
              {loading ? 'Creando...' : 'Crear Tabla'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={<PreviewIcon />}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                }
              }}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </Box>

      {/* Icon Picker Dialog */}
      <Dialog open={showIconPicker} onClose={() => setShowIconPicker(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar Ícono</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            {ICONS.map((icon) => (
              <Grid item key={icon}>
                <Button
                  variant={tableIcon === icon ? 'contained' : 'outlined'}
                  onClick={() => {
                    setTableIcon(icon);
                    setShowIconPicker(false);
                  }}
                  sx={{ minWidth: 48, height: 48, fontSize: 20 }}
                >
                  {icon}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIconPicker(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Loading Modal */}
      <Dialog open={loading}>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
          <CircularProgress />
          <Typography>{loadingMessage || 'Procesando...'}</Typography>
        </DialogContent>
      </Dialog>

      {/* Import Report Modal */}
      <Dialog open={!!importReport} onClose={handleCloseReport} maxWidth="md" fullWidth>
        <DialogTitle>Reporte de Importación</DialogTitle>
        <DialogContent dividers>
          {importReport && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resumen: {importReport.successful} de {importReport.total} registros importados.
              </Typography>
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${importReport.successful} exitosos`} 
                color="success" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                icon={<ErrorIcon />} 
                label={`${importReport.failed} con errores`} 
                color="error" 
                sx={{ mr: 1 }}
              />
              {importReport.duplicatesRemoved > 0 && (
                <Chip 
                  icon={<ErrorIcon />} 
                  label={`${importReport.duplicatesRemoved} duplicados eliminados`} 
                  color="warning" 
                />
              )}
              
              {/* Mostrar información de duplicados */}
              {importReport.duplicatesRemoved > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📊 Duplicados Eliminados
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Se eliminaron {importReport.duplicatesRemoved} registros duplicados antes de la importación.
                  </Typography>
                  
                  {importReport.duplicateFields.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Campos con más duplicados:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {importReport.duplicateFields.slice(0, 5).map((field, index) => (
                          <Chip
                            key={index}
                            label={`${field.fieldName}: ${field.count}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {importReport.failed > 0 && (
                <Box sx={{ mt: 3, maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="subtitle1" gutterBottom>Detalle de errores:</Typography>
                  <List dense>
                    {importReport.errors.map((err, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Fila ${err.index + 2}: ${err.error}`} 
                          secondary="Revisa esta fila en tu archivo Excel."
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 