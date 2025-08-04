import React, { useState } from 'react';
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
import { ExcelImportDialog } from '../components/ExcelImportDialog';

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

export default function CreateTable() {
  const [activeStep, setActiveStep] = useState(0);
  const [tableName, setTableName] = useState('');
  const [tableSlug, setTableSlug] = useState('');
  const [tableIcon, setTableIcon] = useState('📊');
  const [tableDescription, setTableDescription] = useState('');
  const [fields, setFields] = useState<TableField[]>([]);
  const [importedRecords, setImportedRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formErrors, setFormErrors] = useState<{ slug?: string; general?: string }>({});
  const [showMultiSheetDialog, setShowMultiSheetDialog] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectOptionsInputs, setSelectOptionsInputs] = useState<{ [index: number]: string }>({});
  const [duplicateReport] = useState<{
    duplicatesRemoved: number;
    duplicateFields: { fieldName: string; count: number }[];
    originalCount: number;
    finalCount: number;
  } | null>(null);

  
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

  // Función para manejar la importación desde el diálogo de Excel
  const handleMultiSheetImport = (tableData: {
    tableName: string;
    fields: TableField[];
    records: Record<string, unknown>[];
  }) => {
    setTableName(tableData.tableName);
    setTableSlug(tableData.tableName.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    setFields(tableData.fields);
    setImportedRecords(tableData.records);
    setShowMultiSheetDialog(false);
  };

  // Function to generate unique slug
  const generateUniqueSlug = (baseName: string): string => {
    const baseSlug = baseName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}_${timestamp}_${randomSuffix}`;
  };

  // Function to transform data values based on field types
  const transformDataForImport = (data: Record<string, unknown>[], fields: TableField[]): Record<string, unknown>[] => {
    return data.map((record) => {
      const transformedRecord: Record<string, unknown> = {};
      
      Object.keys(record).forEach(originalKey => {
        // Find the field by matching the original label
        const field = fields.find(f => f.label === originalKey);
        let value = record[originalKey];
        
        if (field) {
          // Use the normalized field name as the key
          const normalizedKey = field.name;
          
          // Transform value based on field type
          if (field.type === 'date' && value != null) {
            // Handle different date formats
            if (typeof value === 'number') {
              // Excel serial date number (days since 1900-01-01, with 1900-01-01 = 1)
              const excelEpoch = new Date(1899, 11, 30); // Excel epoch (December 30, 1899)
              const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
              value = date.toISOString();
            } else if (typeof value === 'string') {
              // Transform date from DD/MM/YYYY to ISO format
              const dateStr = value.trim();
              if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                try {
                  const [day, month, year] = dateStr.split('/');
                  const isoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  if (!isNaN(isoDate.getTime())) {
                    value = isoDate.toISOString();
                  }
                } catch (error) {
                  console.warn(`Error converting date: ${dateStr}`);
                }
              }
            }
          } else if (field.type === 'boolean' && value != null) {
            // Transform boolean values to true/false
            const strValue = String(value).toLowerCase().trim();
            
            if (['true', '1', 'si', 'sí', 'yes', 'y'].includes(strValue)) {
              value = true;
            } else if (['false', '0', 'no', 'n'].includes(strValue)) {
              value = false;
            } else {
              value = false; // Default to false for unrecognized values
            }
          } else if (field.type === 'text' && typeof value === 'number') {
            // Convert numbers to strings for text fields (like phone numbers)
            value = String(value);
          }
          
          // Map using normalized field name
          transformedRecord[normalizedKey] = value;
        } else {
          // If field not found, keep original key
          transformedRecord[originalKey] = value;
        }
      });
      
      return transformedRecord;
    });
  };

  // Function to detect fields from Excel data
  const detectFieldsFromData = (data: Record<string, unknown>[]): TableField[] => {
    if (data.length === 0) return [];
    
    const sampleRow = data[0];
    const fields: TableField[] = [];
    
    Object.keys(sampleRow).forEach((key, index) => {
      const values = data.slice(0, 10).map(row => row[key]).filter(val => val != null && val !== '');
      
      // Detect field type based on sample values
      let type: 'text' | 'number' | 'date' | 'boolean' = 'text';
      
      if (values.length > 0) {
        // Check for dates FIRST (including Excel serial dates for fields named like dates)
        const isDateField = key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date');
        const isExcelSerialDate = isDateField && values.every(val => {
          const num = Number(val);
          // Excel serial dates are typically between 1 (1900-01-01) and 50000+ (modern dates)
          return !isNaN(num) && num > 1 && num < 100000;
        });
        
        const isDate = isExcelSerialDate || values.some(val => {
          const str = String(val);
          return /\d{1,2}\/\d{1,2}\/\d{4}/.test(str) || 
                 /\d{4}-\d{2}-\d{2}/.test(str) ||
                 (!isNaN(Date.parse(str)) && isNaN(Number(val)));
        });
        
        if (isDate) {
          type = 'date';
        } else {
          // Check for numbers (but exclude dates)
          const isNumber = values.every(val => !isNaN(Number(val)) && val !== '' && !isNaN(parseFloat(String(val))));
          
          if (isNumber) {
            type = 'number';
          } else {
            // Check for booleans
            const isBoolean = values.every(val => {
              const str = String(val).toLowerCase();
              return ['true', 'false', '1', '0', 'si', 'no', 'sí'].includes(str);
            });
            
            if (isBoolean) {
              type = 'boolean';
            }
          }
        }
      }
      
      const normalizedName = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      fields.push({
        name: normalizedName,
        label: key,
        type,
        required: false,
        order: index
      });
    });
    
    return fields;
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
      
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error?.response?.data?.message || (err instanceof Error ? err.message : 'Ocurrió un error inesperado.');

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
              onClick={() => setShowMultiSheetDialog(true)}
            >
              Subir archivo Excel
            </Button>
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
  
  {/* Excel upload button on the right */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        Ícono:
      </Typography>
      <Button
        variant="outlined"
        onClick={() => setShowIconPicker(true)}
        sx={{ 
          minWidth: 48, 
          height: 48, 
          fontSize: 20,
          borderColor: '#8B5CF6',
          color: '#8B5CF6',
          '&:hover': {
            borderColor: '#7A4CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          }
        }}
      >
        {tableIcon}
      </Button>
    </Box>
    <Button
      variant="outlined"
      startIcon={<UploadFileIcon />}
      onClick={() => setShowMultiSheetDialog(true)}
      sx={{
        borderColor: '#8B5CF6',
        color: '#8B5CF6',
        '&:hover': {
          borderColor: '#7A4CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }
      }}
    >
      Subir archivo Excel
    </Button>
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

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={showMultiSheetDialog}
        onClose={() => setShowMultiSheetDialog(false)}
        tableFields={[]}
        onImport={async (data, options, tableName) => {
          if (tableName) {
            // Single table creation
            handleMultiSheetImport({
              tableName,
              fields: [], // Fields will be detected from data
              records: data as Record<string, unknown>[]
            });
          }
          return { 
            success: true, 
            message: 'Importación exitosa',
            newRecords: data.length,
            updatedRecords: 0,
            duplicatesSkipped: 0,
            errors: []
          };
        }}
        onCreateTable={async (tableName, data) => {
          try {
            // Create the table directly instead of just setting state
            if (!user) {
              throw new Error('Usuario no autenticado');
            }
            
            // Verify user is still authenticated before proceeding
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
              throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
            
            // Validate table name
            if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
              throw new Error('El nombre de la tabla es requerido');
            }
            
            // Detect fields from data
            const detectedFields = detectFieldsFromData(data);
            
            // Generate unique slug to avoid duplicates
            const uniqueSlug = generateUniqueSlug(tableName);
            
            const tablePayload = {
              name: tableName.trim(),
              slug: uniqueSlug,
              icon: tableIcon, // Use the selected icon from state
              description: `Tabla importada desde Excel: ${tableName}`,
              fields: detectedFields,
              isActive: true
            };
            
            const response = await createTable(tablePayload, user);
            
            if (data.length > 0 && response?.table?.slug) {
              // Transform data based on field types (especially dates)
              const transformedData = transformDataForImport(data, detectedFields);
              
              const recordsData = transformedData.map((item) => ({ data: item }));
              
              try {
                await importRecords(response.table.slug, recordsData, user);
              } catch (importError) {
                console.error('Error importing records:', importError);
                // Don't throw here, table creation was successful
                alert('La tabla se creó correctamente, pero hubo un error al importar algunos registros. Puedes importarlos manualmente más tarde.');
              }
            }
            
            // Navigate to tables page
            navigate('/tablas');
            
          } catch (error) {
            console.error('Error in onCreateTable:', error);
            throw error; // Re-throw to let ExcelImportDialog handle it
          }
        }}
      />
    </Box>
  );
}
