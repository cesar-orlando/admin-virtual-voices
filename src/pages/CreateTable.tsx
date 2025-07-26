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
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectOptionsInputs, setSelectOptionsInputs] = useState<{ [key: number]: string }>({});
  const [duplicateReport, setDuplicateReport] = useState<any>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    setTableName(name);
    if (!name.trim()) {
      setTableSlug('');
      return;
    }
    const slug = generateSlug(name);
    setTableSlug(slug);
  };

  // Navigation handlers
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate basic info
      if (!tableName.trim()) {
        setFormErrors({ general: 'El nombre de la tabla es requerido' });
        return;
      }
      if (!tableSlug.trim()) {
        setFormErrors({ general: 'El slug de la tabla es requerido' });
        return;
      }
      setFormErrors({});
    } else if (activeStep === 1) {
      // Validate fields
      if (fields.length === 0) {
        setFormErrors({ general: 'Debes agregar al menos un campo' });
        return;
      }
      if (fields.some(field => !field.label.trim())) {
        setFormErrors({ general: 'Todos los campos deben tener una etiqueta' });
        return;
      }
      setFormErrors({});
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Field management
  const handleAddField = () => {
    const newField: TableField = {
      name: `campo_${fields.length + 1}`,
      label: '',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<TableField>) => {
    setFields(fields.map((field, i) => {
      if (i === index) {
        const updatedField = { ...field, ...updates };
        // Auto-generate name from label
        if (updates.label !== undefined) {
          updatedField.name = generateSlug(updates.label) || `campo_${index + 1}`;
        }
        return updatedField;
      }
      return field;
    }));
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // File upload and import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingMessage('Procesando archivo Excel...');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length < 2) {
            setFormErrors({ general: 'El archivo debe tener al menos una fila de encabezados y una fila de datos' });
            setLoading(false);
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          // Generate fields from headers
          const existingNames = new Set<string>();
          const newFields: TableField[] = headers.map((header, index) => {
            const name = normalizeHeader(header, index, existingNames);
            const columnValues = rows.map(row => row[index]);
            const type = detectType(columnValues) as FieldType;

            return {
              name,
              label: header || `Campo ${index + 1}`,
              type,
              required: false,
            };
          });

          // Convert rows to records
          const records = rows
            .filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
            .map(row => {
              const record: Record<string, any> = {};
              newFields.forEach((field, index) => {
                record[field.name] = row[index] || '';
              });
              return record;
            });

          // Detect and remove duplicates
          const { uniqueRecords, duplicatesRemoved } = detectAndRemoveDuplicates(records, newFields);

          setFields(newFields);
          setImportedRecords(uniqueRecords);
          
          if (duplicatesRemoved > 0) {
            setDuplicateReport({
              originalCount: records.length,
              finalCount: uniqueRecords.length,
              duplicatesRemoved,
              duplicateFields: []
            });
          }

          setLoading(false);
          setLoadingMessage('');
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setFormErrors({ general: 'Error al procesar el archivo Excel' });
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setFormErrors({ general: 'Error al leer el archivo' });
      setLoading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create table
  const handleCreateTable = async () => {
    setLoading(true);
    setLoadingMessage('Creando tabla...');

    try {
      const tableData = {
        name: tableName,
        slug: tableSlug,
        description: tableDescription,
        icon: tableIcon,
        fields,
        isActive: true,
      };

      const result = await createTable(tableData, user);

      if (importedRecords.length > 0) {
        setLoadingMessage('Importando registros...');
        const importResult = await importRecords(result.slug, importedRecords, user);
        setImportReport(importResult);
      } else {
        navigate('/tablas');
      }
    } catch (error: any) {
      console.error('Error creating table:', error);
      setFormErrors({ general: error.message || 'Error al crear la tabla' });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCloseReport = () => {
    setImportReport(null);
    navigate('/tablas');
  };

  const renderBasicInfo = () => (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}
        >
          Información Básica
        </Typography>
        
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre de la Tabla"
              value={tableName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              size={isMobile ? "small" : "medium"}
              sx={{ mb: { xs: 2, md: 3 } }}
            />
            
            <TextField
              fullWidth
              label="Slug (Identificador único)"
              value={tableSlug}
              onChange={(e) => setTableSlug(e.target.value)}
              required
              size={isMobile ? "small" : "medium"}
              helperText="Se genera automáticamente del nombre. Solo letras minúsculas, números y guiones."
              sx={{ mb: { xs: 2, md: 3 } }}
            />
            
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={tableDescription}
              onChange={(e) => setTableDescription(e.target.value)}
              multiline
              rows={isMobile ? 3 : 4}
              size={isMobile ? "small" : "medium"}
              sx={{ mb: { xs: 2, md: 3 } }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
              >
                Ícono de la Tabla
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setShowIconPicker(true)}
                sx={{
                  fontSize: { xs: 32, md: 48 },
                  minWidth: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  mb: 2,
                  borderStyle: 'dashed',
                }}
              >
                {tableIcon}
              </Button>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
              >
                Haz clic para cambiar
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderFieldBuilder = () => (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 3,
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          <Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              Definir Campos ({fields.length})
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
              Define la estructura de tu tabla agregando campos
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, md: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', md: 'auto' }
          }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                flex: { xs: 1, sm: 'none' }
              }}
            >
              {isMobile ? 'Importar Excel' : 'Importar desde Excel'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddField}
              size={isMobile ? "small" : "medium"}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                flex: { xs: 1, sm: 'none' },
                '&:hover': {
                  background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                }
              }}
            >
              {isMobile ? 'Agregar' : 'Agregar Campo'}
            </Button>
          </Box>
        </Box>

        {importedRecords.length > 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            Se importarán {importedRecords.length} registros junto con la tabla.
            {duplicateReport && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  <strong>Duplicados eliminados:</strong> {duplicateReport.duplicatesRemoved} de {duplicateReport.originalCount} registros originales
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Reporte de duplicados */}
        {duplicateReport && duplicateReport.duplicatesRemoved > 0 && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
            >
              📊 Reporte de Duplicados Eliminados
            </Typography>
            <Typography 
              variant="body2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              <strong>Total eliminados:</strong> {duplicateReport.duplicatesRemoved} registros duplicados
            </Typography>
            <Typography 
              variant="body2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              <strong>Registros únicos:</strong> {duplicateReport.finalCount} de {duplicateReport.originalCount} originales
            </Typography>
            
            {duplicateReport.duplicateFields.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
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
                      sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Alert>
        )}

        {fields.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 3, md: 4 } 
          }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
              No hay campos definidos
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              Agrega al menos un campo para definir la estructura de tu tabla
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 1, md: 2 }}>
            {fields.map((field, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ 
                  p: { xs: 1.5, md: 2 }, 
                  border: '1px solid', 
                  borderColor: 'divider' 
                }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={6} md={7}>
                      <TextField
                        fullWidth
                        label="Etiqueta"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        size="small"
                        required
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          Tipo
                        </InputLabel>
                        <Select
                          value={field.type}
                          onChange={(e) => handleUpdateField(index, { type: e.target.value as FieldType })}
                          label="Tipo"
                          sx={{
                            '& .MuiSelect-select': {
                              fontSize: { xs: '0.875rem', md: '1rem' }
                            }
                          }}
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
                            size={isMobile ? "small" : "medium"}
                          />
                        }
                        label="Requerido"
                        sx={{ 
                          ml: 0,
                          '& .MuiFormControlLabel-label': {
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={3} sm={1} md={1} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveField(index)}
                        size="small"
                      >
                        <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
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
                        }}
                        onBlur={() => {
                          const options = (selectOptionsInputs[index] ?? '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                          handleUpdateField(index, { options });
                        }}
                        size="small"
                        helperText="Ej: Opción 1, Opción 2, Opción 3"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: { xs: '0.7rem', md: '0.75rem' }
                          }
                        }}
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
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}
        >
          Vista Previa de la Tabla
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}
          >
            <span>{tableIcon}</span>
            {tableName}
          </Typography>
          {tableDescription && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              {tableDescription}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography 
          variant="subtitle1" 
          gutterBottom
          sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
        >
          Estructura de Campos ({fields.length})
        </Typography>
        
        <Grid container spacing={{ xs: 1, md: 2 }}>
          {fields.map((field, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ 
                p: { xs: 1.5, md: 2 }, 
                border: '1px solid', 
                borderColor: 'divider' 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 1,
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Chip
                    label={field.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                >
                  {field.name}
                </Typography>
                {field.required && (
                  <Chip
                    label="Requerido"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ 
                      ml: 1,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      height: { xs: 20, md: 24 }
                    }}
                  />
                )}
                {field.type === 'select' && field.options && (
                  <Box sx={{ mt: 1 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    >
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
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      width: '100%',
      minHeight: { xs: '100vh', md: '80vh' }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <IconButton 
          onClick={() => navigate('/tablas')} 
          sx={{ mr: { xs: 1, md: 2 } }}
          size={isMobile ? "small" : "medium"}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '2.125rem' }
            }}
          >
            Crear Nueva Tabla
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Define la estructura de tu tabla personalizada
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          mb: 4,
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.75rem', md: '0.875rem' }
          }
        }}
        orientation={isMobile ? "vertical" : "horizontal"}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{isMobile ? label.split(' ')[0] : label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {formErrors.general && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {formErrors.general}
        </Alert>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 4,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          size={isMobile ? "medium" : "large"}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            order: { xs: 2, sm: 1 }
          }}
        >
          Anterior
        </Button>
        <Box sx={{ order: { xs: 1, sm: 2 } }}>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleCreateTable}
              disabled={loading}
              startIcon={<SaveIcon />}
              size={isMobile ? "medium" : "large"}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                fontSize: { xs: '0.875rem', md: '1rem' },
                width: { xs: '100%', sm: 'auto' },
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
              size={isMobile ? "medium" : "large"}
              sx={{
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                fontSize: { xs: '0.875rem', md: '1rem' },
                width: { xs: '100%', sm: 'auto' },
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
      <Dialog 
        open={showIconPicker} 
        onClose={() => setShowIconPicker(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Seleccionar Ícono
        </DialogTitle>
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
                  sx={{ 
                    minWidth: { xs: 40, md: 48 }, 
                    height: { xs: 40, md: 48 }, 
                    fontSize: { xs: 16, md: 20 }
                  }}
                >
                  {icon}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowIconPicker(false)}
            size={isMobile ? "medium" : "large"}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Modal */}
      <Dialog open={loading}>
        <DialogContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: { xs: 2, md: 3 }
        }}>
          <CircularProgress size={isMobile ? 20 : 24} />
          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            {loadingMessage || 'Procesando...'}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Import Report Modal */}
      <Dialog 
        open={!!importReport} 
        onClose={handleCloseReport} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Reporte de Importación
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {importReport && (
            <Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom
                sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
              >
                Resumen: {importReport.successful} de {importReport.total} registros importados.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                mb: 2 
              }}>
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label={`${importReport.successful} exitosos`} 
                  color="success" 
                  size={isMobile ? "small" : "medium"}
                />
                <Chip 
                  icon={<ErrorIcon />} 
                  label={`${importReport.failed} con errores`} 
                  color="error" 
                  size={isMobile ? "small" : "medium"}
                />
                {importReport.duplicatesRemoved > 0 && (
                  <Chip 
                    icon={<ErrorIcon />} 
                    label={`${importReport.duplicatesRemoved} duplicados eliminados`} 
                    color="warning" 
                    size={isMobile ? "small" : "medium"}
                  />
                )}
              </Box>
              
              {/* Mostrar información de duplicados */}
              {importReport.duplicatesRemoved > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'warning.50', 
                  borderRadius: 1 
                }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
                  >
                    📊 Duplicados Eliminados
                  </Typography>
                  <Typography 
                    variant="body2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Se eliminaron {importReport.duplicatesRemoved} registros duplicados antes de la importación.
                  </Typography>
                  
                  {importReport.duplicateFields.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                      >
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
                            sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {importReport.failed > 0 && (
                <Box sx={{ 
                  mt: 3, 
                  maxHeight: { xs: 200, md: 400 }, 
                  overflow: 'auto' 
                }}>
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
                  >
                    Detalle de errores:
                  </Typography>
                  <List dense>
                    {importReport.errors.map((err, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Fila ${err.index + 2}: ${err.error}`}
                          secondary="Revisa esta fila en tu archivo Excel."
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          }}
                          secondaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            onClick={handleCloseReport}
            size={isMobile ? "medium" : "large"}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 