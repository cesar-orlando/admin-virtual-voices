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
      name: '',
      label: '',
      type: 'text',
      required: false,
      order: fields.length + 1,
      width: 150,
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    
    // Verificar si hay registros en la tabla y si este es un nuevo campo
    if (tableStats && tableStats.totalRecords > 0) {
      const newFields = detectNewFields(updatedFields, originalFields);
      if (newFields.length > 0) {
        const latestNewField = newFields[newFields.length - 1];
        setNewFieldIndex(latestNewField.index);
        setShowNewFieldDialog(true);
      }
    }
  };

  const handleUpdateField = (index: number, field: Partial<TableField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);

    // Si se actualiza el tipo a 'select', inicializa el input de opciones si no existe
    if (field.type === 'select' && selectOptionsInputs[index] === undefined) {
      setSelectOptionsInputs((prev) => ({
        ...prev,
        [index]: updatedFields[index].options?.join(', ') || '',
      }));
    }

    // Detectar si se cambió el name de un campo y hay registros existentes
    if (field.name && tableStats && tableStats.totalRecords > 0) {
      const originalField = originalFields[index];
      if (originalField && originalField.name !== field.name) {
        // El name cambió, esto es un renombre
        setNewFieldIndex(index);
        setShowNewFieldDialog(true);
      }
    }
  };

  const handleRemoveField = (index: number) => {
    const field = fields[index];

    // Bloquear eliminación de campos "Número" e "IA" en la tabla "prospectos"
    if (isProspectsTable && (field.label === 'Número' || field.label === 'IA')) {
      return; // No eliminar estos campos
    }

    const updatedFields = fields.filter((_, i) => i !== index);
    updatedFields.forEach((field, i) => {
      field.order = i + 1;
    });
    setFields(updatedFields);
  };

  const handleUpdateTable = async () => {
    if (!user || !table) {
      setError('No se puede actualizar la tabla');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Detectar nuevos campos y campos renombrados antes de guardar
      const newFields = detectNewFields(fields, originalFields);
      const renamedFields = detectRenamedFields(fields, originalFields);
      
      // Si hay nuevos campos y registros existentes, actualizar el valor por defecto
      if (newFields.length > 0 && tableStats && tableStats.totalRecords > 0) {
        const updatedFieldsWithDefaults = [...fields];
        newFields.forEach(({ field, index }) => {
          if (newFieldDefaultValue && index === newFieldIndex) {
            updatedFieldsWithDefaults[index] = {
              ...updatedFieldsWithDefaults[index],
              defaultValue: newFieldDefaultValue
            };
          }
        });
        setFields(updatedFieldsWithDefaults);
      }

      const tableData: UpdateTableRequest = {
        name: table.name,
        slug: table.slug,
        icon: table.icon,
        description: table.description,
        fields: fields,
        isActive: table.isActive,
      };

      await updateTable(table._id, tableData, user);

      // Mostrar mensaje especial si se activó una tabla inactiva
      if (wasInactive && table.isActive) {
        // Se activó una tabla que estaba inactiva
        console.log('¡Tabla activada exitosamente!');
      }

      // Si hay nuevos campos con valor por defecto, actualizar todos los registros existentes
      if (newFields.length > 0 && tableStats && tableStats.totalRecords > 0) {
        for (const { field, index } of newFields) {
          if (newFieldDefaultValue && index === newFieldIndex) {
            try {
              await addFieldToAllRecords(
                table.slug,
                field.name,
                newFieldDefaultValue,
                user
              );
            } catch (err) {
              console.error(`Error adding field ${field.name} to all records:`, err);
              // No lanzar error aquí para no interrumpir el guardado de la tabla
            }
          }
        }
      }

      // Si hay campos renombrados, actualizar todos los registros existentes
      if (renamedFields.length > 0 && tableStats && tableStats.totalRecords > 0) {
        for (const { oldName, newName } of renamedFields) {
          try {
            await renameFieldInAllRecords(
              table.slug,
              oldName,
              newName,
              user
            );
          } catch (err) {
            console.error(`Error renaming field ${oldName} to ${newName} in all records:`, err);
            // No lanzar error aquí para no interrumpir el guardado de la tabla
          }
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
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error || !table) {
    return <Alert severity="error">{error || 'No se pudo encontrar la tabla'}</Alert>;
  }

  return (
    <Box sx={{ p: 3, width: '90vw', height: '80vh', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/tablas')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Editar Tabla: {table.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Modifica la estructura y propiedades de tu tabla
          </Typography>
        </Box>
      </Box>

      {/* Status Alert */}
      {!table.isActive && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => handleTablePropChange('isActive', true)}
            >
              Activar
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Esta tabla está inactiva.</strong> Puedes editarla y activarla nuevamente cuando esté lista.
            Las tablas inactivas no aparecen en las listas principales pero mantienen todos sus datos.
          </Typography>
        </Alert>
      )}

      {/* Success Alert for Reactivated Table */}
      {wasInactive && table.isActive && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setWasInactive(false)}
        >
          <Typography variant="body2">
            <strong>¡Tabla activada exitosamente!</strong> La tabla "{table.name}" ahora está activa y visible en todas las listas.
          </Typography>
        </Alert>
      )}

      {/* Basic Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Información Básica</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la tabla"
                value={table.name}
                onChange={(e) => handleTablePropChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug (identificador)"
                value={table.slug}
                onChange={(e) => handleTablePropChange('slug', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="outlined" onClick={() => setShowIconPicker(true)}>
                Seleccionar Ícono: {table.icon}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={table.isActive}
                      onChange={(e) => handleTablePropChange('isActive', e.target.checked)}
                      color={table.isActive ? "success" : "warning"}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {table.isActive ? 'Tabla Activa' : 'Tabla Inactiva'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Fields Builder Card */}
      <Card>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Campos de la Tabla ({fields.length})</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddField}>
                    Agregar Campo
                </Button>
            </Box>
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
                              onChange={(e) => handleUpdateField(index, { label: e.target.value })} // Solo label
                              onBlur={() => handleFieldLabelBlur(index)}
                              size="small"
                              required
                              helperText="Este será el nombre de la columna en tu tabla"
                              disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipo</InputLabel>
                              <Select 
                                value={field.type} 
                                onChange={(e) => handleUpdateField(index, { type: e.target.value as FieldType })} 
                                label="Tipo"
                                disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
                              >
                                {FIELD_TYPES.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3} sm={2} md={2}>
                            <FormControlLabel
                              control={<Switch checked={field.required || false} onChange={(e) => handleUpdateField(index, { required: e.target.checked })} />}
                              label="Requerido"
                              disabled={isProspectsTable && (field.label === 'Número' || field.label === 'IA')}
                            />
                        </Grid>
                        <Grid item xs={3} sm={1} md={1} sx={{ textAlign: 'right' }}>
                            <IconButton color="error" onClick={() => handleRemoveField(index)} size="small"><DeleteIcon /></IconButton>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/tablas')}
          startIcon={<ArrowBackIcon />}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdateTable}
          disabled={saving}
          startIcon={<SaveIcon />}
          sx={{
            background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
            }
          }}
        >
          {saving ? 'Guardando...' : `Guardar Cambios${!table.isActive ? ' (Inactiva)' : ''}`}
        </Button>
      </Box>

      {/* Icon Picker Dialog */}
      <Dialog open={showIconPicker} onClose={() => setShowIconPicker(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar Ícono</DialogTitle>
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

      {/* New Field Dialog */}
      <Dialog open={showNewFieldDialog} onClose={handleNewFieldDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            {newFieldIndex !== null && fields[newFieldIndex] && 
             originalFields[newFieldIndex] && 
             originalFields[newFieldIndex].name !== fields[newFieldIndex].name 
              ? 'Campo Renombrado' 
              : 'Nuevo Campo Detectado'
            }
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {newFieldIndex !== null && fields[newFieldIndex] && (
            <Box>
              {originalFields[newFieldIndex] && 
               originalFields[newFieldIndex].name !== fields[newFieldIndex].name ? (
                // Campo renombrado
                <>
                  <Typography variant="h6" gutterBottom>
                    Has renombrado el campo: <strong>{originalFields[newFieldIndex].label || originalFields[newFieldIndex].name}</strong> → <strong>{fields[newFieldIndex].label || fields[newFieldIndex].name}</strong>
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Este cambio afectará a <strong>{tableStats?.totalRecords || 0} registros existentes</strong>. 
                      Los datos existentes se migrarán al nuevo nombre del campo.
                    </Typography>
                  </Alert>
                </>
              ) : (
                // Nuevo campo
                <>
                  <Typography variant="h6" gutterBottom>
                    Has agregado un nuevo campo: <strong>{fields[newFieldIndex].label || fields[newFieldIndex].name}</strong>
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Esta tabla tiene <strong>{tableStats?.totalRecords || 0} registros existentes</strong>. 
                      ¿Qué valor quieres asignar a este campo para todos los registros existentes?
                    </Typography>
                  </Alert>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
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
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CancelIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Dejar vacío"
                          secondary="Los registros existentes tendrán este campo vacío (null)"
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
                    sx={{ mb: 2 }}
                  />
                </>
              )}

              <Alert severity="warning">
                <Typography variant="body2">
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
        <DialogActions>
          {(!originalFields[newFieldIndex!] || originalFields[newFieldIndex!].name === fields[newFieldIndex!]?.name) && (
            <Button onClick={handleSkipDefaultValue} color="secondary">
              Dejar Vacío
            </Button>
          )}
          <Button 
            onClick={handleSetDefaultValue} 
            variant="contained"
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