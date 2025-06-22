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
}

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

  const handleUpdateField = (index: number, field: Partial<TableField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Extraer los encabezados de la primera fila
        const headers: string[] = (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]);
        if (!headers || headers.length === 0) {
            throw new Error("El archivo de Excel no contiene encabezados en la primera fila.");
        }

        // Crear los campos a partir de los encabezados
        const newFields: TableField[] = headers.map((header, index) => ({
          name: generateSlug(String(header)).replace(/-/g, '_'),
          label: String(header),
          type: 'text',
          required: false,
          order: index + 1,
          width: 150,
        }));
        setFields(newFields);

        // Extraer los registros (filas de datos)
        const recordsData: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Mapear los datos de los registros para usar los nombres de campo internos (slugs)
        const formattedRecords = recordsData.map(row => {
            const newRow: Record<string, any> = {};
            newFields.forEach(field => {
                if (row[field.label] !== undefined) {
                    newRow[field.name] = row[field.label];
                }
            });
            return newRow;
        });
        setImportedRecords(formattedRecords);
        console.log('Registros formateados desde Excel:', formattedRecords);
        
        // Sugerir nombre de tabla basado en el nombre del archivo
        handleNameChange(file.name.replace(/\.(xlsx|xls|csv)$/, ''));
        
      } catch (err) {
         console.error("Error parsing Excel file:", err);
         setFormErrors({ general: err instanceof Error ? err.message : "Error al procesar el archivo. Asegúrate de que sea un formato válido." });
      } finally {
         if (fileInputRef.current) {
           fileInputRef.current.value = '';
         }
      }
    };
    reader.readAsArrayBuffer(file);
  };

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
        fields: fields,
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
              onChange={(e) => setTableSlug(e.target.value)}
              required
              error={!!formErrors.slug}
              helperText={formErrors.slug || "Identificador único para la tabla"}
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
          <Grid container spacing={2}>
            {fields.map((field, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Nombre del campo"
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        size="small"
                        required
                        helperText="Nombre interno (sin espacios)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Etiqueta"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        size="small"
                        required
                        helperText="Nombre que verá el usuario"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
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
                    <Grid item xs={6} sm={4} md={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.required || false}
                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                          />
                        }
                        label="Requerido"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2} md={2} sx={{ textAlign: 'right' }}>
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
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => {
                          const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
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
              />
              
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