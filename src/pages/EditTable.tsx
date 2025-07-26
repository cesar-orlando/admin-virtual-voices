import React, { useState, useEffect } from 'react';
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
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTableBySlug, updateTable, getTableStats, addFieldToAllRecords, renameFieldInAllRecords } from '../api/servicios';
import type { DynamicTable, TableField, FieldType, UpdateTableRequest } from '../types';

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
  '👥', '👤', '👨‍💼', '👩‍💼', '🏢', '🏪', '🏭', '🏗️', '🚗', '✈️', '🚢', '📦', '📱', '🖥️', '📺'
];

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

export default function EditTable() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [table, setTable] = useState<DynamicTable | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [originalFields, setOriginalFields] = useState<TableField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectOptionsInputs, setSelectOptionsInputs] = useState<{ [index: number]: string }>({});
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [newFieldIndex, setNewFieldIndex] = useState<number | null>(null);
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState<string>('');
  const [tableStats, setTableStats] = useState<{ totalRecords: number } | null>(null);
  const [wasInactive, setWasInactive] = useState(false);

  const { tableSlug } = useParams<{ tableSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isProspectsTable = tableSlug === 'prospectos';
  
  useEffect(() => {
    loadTableData();
  }, [tableSlug, user]);

  const loadTableData = async () => {
    if (!tableSlug || !user) return;
    try {
      setLoading(true);
      setError(null);
      const tableData = await getTableBySlug(tableSlug, user);
      setTable(tableData);
      setFields(tableData.fields);
      setOriginalFields(tableData.fields);
      setWasInactive(!tableData.isActive);
      
      // Cargar estadísticas de la tabla para saber cuántos registros tiene
      try {
        const stats = await getTableStats(tableSlug, user);
        setTableStats(stats);
      } catch (err) {
        console.error('Error loading table stats:', err);
      }
    } catch (err) {
      setError('Error al cargar la tabla');
      console.error('Error loading table:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para detectar nuevos campos
  const detectNewFields = (currentFields: TableField[], originalFields: TableField[]) => {
    const originalFieldNames = new Set(originalFields.map(f => f.name));
    return currentFields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => !originalFieldNames.has(field.name));
  };

  // Función para detectar campos renombrados
  const detectRenamedFields = (currentFields: TableField[], originalFields: TableField[]) => {
    const renamedFields: Array<{ 
      oldField: TableField; 
      newField: TableField; 
      index: number; 
      oldName: string; 
      newName: string; 
    }> = [];

    currentFields.forEach((field, index) => {
      const originalField = originalFields[index];
      if (!originalField) {
        // Es un campo nuevo, no nos interesa aquí
        return;
      }

      // Detectar si el name cambió (esto indica un renombre)
      if (originalField.name !== field.name) {
        renamedFields.push({
          oldField: originalField,
          newField: field,
          index,
          oldName: originalField.name,
          newName: field.name
        });
      }
    });

    return renamedFields;
  };

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
    setFields(fields.map((field, i) => (i === index ? { ...field, ...updates } : field)));
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateTable = async () => {
    if (!table || !user) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare table data
      const updateData: UpdateTableRequest = {
        name: table.name,
        slug: table.slug,
        description: table.description || '',
        icon: table.icon,
        fields,
        isActive: table.isActive,
      };

      await updateTable(table.slug, updateData, user);

      // Handle new fields (add default values to existing records)
      const newFields = detectNewFields(fields, originalFields);
      for (const { field, index } of newFields) {
        try {
          const defaultValue = field.defaultValue || getSuggestedDefaultValue(field.type);
          await addFieldToAllRecords(table.slug, field.name, defaultValue, user);
        } catch (err) {
          console.error(`Error adding field ${field.name} to all records:`, err);
          // Don't throw error here to not interrupt table saving
        }
      }

      // Handle renamed fields
      const renamedFields = detectRenamedFields(fields, originalFields);
      for (const { oldName, newName } of renamedFields) {
        try {
          await renameFieldInAllRecords(table.slug, oldName, newName, user);
        } catch (err) {
          console.error(`Error renaming field ${oldName} to ${newName} in all records:`, err);
          // Don't throw error here to not interrupt table saving
        }
      }

      navigate('/tablas');
    } catch (err) {
      setError('Error al actualizar la tabla');
      console.error('Error updating table:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleTablePropChange = (prop: keyof DynamicTable, value: any) => {
    if (table) {
      setTable({ ...table, [prop]: value });
    }
  };

  const handleNewFieldDialogClose = () => {
    setShowNewFieldDialog(false);
    setNewFieldIndex(null);
    setNewFieldDefaultValue('');
  };

  const handleSetDefaultValue = () => {
    if (newFieldIndex !== null) {
      const updatedFields = [...fields];
      updatedFields[newFieldIndex] = {
        ...updatedFields[newFieldIndex],
        defaultValue: newFieldDefaultValue
      };
      setFields(updatedFields);
    }
    handleNewFieldDialogClose();
  };

  const handleSkipDefaultValue = () => {
    handleNewFieldDialogClose();
  };

  // Función para obtener el tipo de valor por defecto sugerido
  const getSuggestedDefaultValue = (fieldType: FieldType): string => {
    switch (fieldType) {
      case 'text':
        return '';
      case 'email':
        return '';
      case 'number':
        return '0';
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'boolean':
        return 'false';
      case 'select':
        return '';
      case 'currency':
        return '0.00';
      case 'file':
        return '';
      default:
        return '';
    }
  };

  const handleFieldLabelBlur = (index: number) => {
    const field = fields[index];
    const originalField = originalFields[index];
    const newName = normalizeFieldName(field.label);

    // Solo si el name realmente cambia y hay registros
    if (
      originalField &&
      originalField.name !== newName &&
      tableStats &&
      tableStats.totalRecords > 0
    ) {
      handleUpdateField(index, { name: newName });
      setNewFieldIndex(index);
      setShowNewFieldDialog(true);
    } else {
      // Solo actualiza el name si no hay registros (para consistencia)
      if (field.name !== newName) {
        handleUpdateField(index, { name: newName });
      }
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ p: { xs: 2, md: 0 } }}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (error || !table) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          {error || 'No se pudo encontrar la tabla'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      width: '100%',
      minHeight: { xs: '100vh', md: '80vh' },
      overflowY: 'auto' 
    }}>
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
            Editar Tabla: {table.name}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Modifica la estructura y propiedades de tu tabla
          </Typography>
        </Box>
      </Box>

      {/* Status Alert */}
      {!table.isActive && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
          action={
            <Button 
              color="inherit" 
              size={isMobile ? "small" : "medium"}
              onClick={() => handleTablePropChange('isActive', true)}
            >
              Activar
            </Button>
          }
        >
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            <strong>Esta tabla está inactiva.</strong> Puedes editarla y activarla nuevamente cuando esté lista.
            Las tablas inactivas no aparecen en las listas principales pero mantienen todos sus datos.
          </Typography>
        </Alert>
      )}

      {/* Success Alert for Reactivated Table */}
      {wasInactive && table.isActive && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
          onClose={() => setWasInactive(false)}
        >
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            <strong>¡Tabla activada exitosamente!</strong> La tabla "{table.name}" ahora está activa y visible en todas las listas.
          </Typography>
        </Alert>
      )}

      {/* Basic Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 600
            }}
          >
            Información Básica
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la tabla"
                value={table.name}
                onChange={(e) => handleTablePropChange('name', e.target.value)}
                required
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug (identificador)"
                value={table.slug}
                onChange={(e) => handleTablePropChange('slug', e.target.value)}
                required
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button 
                variant="outlined" 
                onClick={() => setShowIconPicker(true)}
                size={isMobile ? "small" : "medium"}
                sx={{
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  py: { xs: 1, md: 1.5 },
                  px: { xs: 2, md: 3 }
                }}
              >
                Seleccionar Ícono: {table.icon}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' }
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={table.isActive}
                      onChange={(e) => handleTablePropChange('isActive', e.target.checked)}
                      color={table.isActive ? "success" : "warning"}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label={
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                      >
                        {table.isActive ? 'Tabla Activa' : 'Tabla Inactiva'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {table.isActive 
                          ? 'Visible en todas las listas y funcional' 
                          : 'Oculta de las listas principales pero editable'
                        }
                      </Typography>
                    </Box>
                  }
                />
                {!table.isActive && (
                  <Chip 
                    label="Inactiva" 
                    color="warning" 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción (opcional)"
                value={table.description || ''}
                onChange={(e) => handleTablePropChange('description', e.target.value)}
                multiline
                rows={isMobile ? 3 : 4}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Fields Builder Card */}
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
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              sx={{ 
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 600
              }}
            >
              Campos de la Tabla ({fields.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleAddField}
              size={isMobile ? "small" : "medium"}
              sx={{
                fontSize: { xs: '0.875rem', md: '1rem' },
                px: { xs: 2, md: 3 }
              }}
            >
              {isMobile ? 'Agregar' : 'Agregar Campo'}
            </Button>
          </Box>
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
                        onBlur={() => handleFieldLabelBlur(index)}
                        size="small"
                        required
                        helperText="Este será el nombre de la columna en tu tabla"
                        disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: { xs: '0.7rem', md: '0.75rem' }
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
                          disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
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
                        disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
                        sx={{
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
                    {field.type === 'select' && (
                      <Grid item xs={12}>
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
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 4,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/tablas')}
          startIcon={<ArrowBackIcon />}
          size={isMobile ? "medium" : "large"}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            order: { xs: 2, sm: 1 }
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdateTable}
          disabled={saving}
          startIcon={<SaveIcon />}
          size={isMobile ? "medium" : "large"}
          sx={{
            background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            fontSize: { xs: '0.875rem', md: '1rem' },
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 1, sm: 2 },
            '&:hover': {
              background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
            }
          }}
        >
          {saving ? 'Guardando...' : `Guardar Cambios${!table.isActive ? ' (Inactiva)' : ''}`}
        </Button>
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
                  variant={table.icon === icon ? 'contained' : 'outlined'}
                  onClick={() => {
                    handleTablePropChange('icon', icon);
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

      {/* New Field Dialog */}
      <Dialog 
        open={showNewFieldDialog} 
        onClose={handleNewFieldDialogClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}>
            <WarningIcon color="warning" />
            {newFieldIndex !== null && fields[newFieldIndex] && 
             originalFields[newFieldIndex] && 
             originalFields[newFieldIndex].name !== fields[newFieldIndex].name 
              ? 'Campo Renombrado' 
              : 'Nuevo Campo Detectado'
            }
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {newFieldIndex !== null && fields[newFieldIndex] && (
            <Box>
              {originalFields[newFieldIndex] && 
               originalFields[newFieldIndex].name !== fields[newFieldIndex].name ? (
                // Campo renombrado
                <>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                  >
                    Has renombrado el campo: <strong>{originalFields[newFieldIndex].label || originalFields[newFieldIndex].name}</strong> → <strong>{fields[newFieldIndex].label || fields[newFieldIndex].name}</strong>
                  </Typography>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3,
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      Este cambio afectará a <strong>{tableStats?.totalRecords || 0} registros existentes</strong>. 
                      Los datos existentes se migrarán al nuevo nombre del campo.
                    </Typography>
                  </Alert>
                </>
              ) : (
                // Nuevo campo
                <>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                  >
                    Has agregado un nuevo campo: <strong>{fields[newFieldIndex].label || fields[newFieldIndex].name}</strong>
                  </Typography>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3,
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      Esta tabla tiene <strong>{tableStats?.totalRecords || 0} registros existentes</strong>. 
                      ¿Qué valor quieres asignar a este campo para todos los registros existentes?
                    </Typography>
                  </Alert>

                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
                    >
                      Opciones disponibles:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Establecer un valor por defecto"
                          secondary="Todos los registros existentes tendrán este valor en el nuevo campo"
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          }}
                          secondaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CancelIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Dejar vacío"
                          secondary="Los registros existentes tendrán este campo vacío (null)"
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          }}
                          secondaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <TextField
                    fullWidth
                    label="Valor por defecto (opcional)"
                    value={newFieldDefaultValue}
                    onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                    placeholder={getSuggestedDefaultValue(fields[newFieldIndex].type)}
                    helperText={`Sugerido para tipo ${fields[newFieldIndex].type}: ${getSuggestedDefaultValue(fields[newFieldIndex].type)}`}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      },
                      '& .MuiFormHelperText-root': {
                        fontSize: { xs: '0.7rem', md: '0.75rem' }
                      }
                    }}
                  />
                </>
              )}

              <Alert 
                severity="warning"
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                >
                  <strong>Nota:</strong> Esta acción afectará a todos los {tableStats?.totalRecords || 0} registros existentes. 
                  {originalFields[newFieldIndex] && originalFields[newFieldIndex].name !== fields[newFieldIndex].name 
                    ? ' Los datos existentes se migrarán al nuevo nombre del campo.'
                    : ' Puedes modificar los valores individuales después desde la vista de registros.'
                  }
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          {(!originalFields[newFieldIndex!] || originalFields[newFieldIndex!].name === fields[newFieldIndex!]?.name) && (
            <Button 
              onClick={handleSkipDefaultValue} 
              color="secondary"
              size={isMobile ? "medium" : "large"}
            >
              Dejar Vacío
            </Button>
          )}
          <Button 
            onClick={handleSetDefaultValue} 
            variant="contained"
            size={isMobile ? "medium" : "large"}
            sx={{
              background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
              }
            }}
          >
            {originalFields[newFieldIndex!] && originalFields[newFieldIndex!].name !== fields[newFieldIndex!]?.name 
              ? 'Confirmar Cambio' 
              : 'Establecer Valor'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 