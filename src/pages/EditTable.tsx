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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTableBySlug, updateTable } from '../api/servicios';
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
  '👥', '👤', '👨‍💼', '👩‍💼', '🏢', '🏪', '🏭', '🏗️', '🚗', '✈️', '🚢', '📦', '📱', '💻', '🖥️', '📺'
];

export default function EditTable() {
  const [table, setTable] = useState<DynamicTable | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { tableSlug } = useParams<{ tableSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
    } catch (err) {
      setError('Error al cargar la tabla');
      console.error('Error loading table:', err);
    } finally {
      setLoading(false);
    }
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

      const tableData: UpdateTableRequest = {
        name: table.name,
        slug: table.slug,
        icon: table.icon,
        description: table.description,
        fields: fields,
        isActive: table.isActive,
      };

      await updateTable(table._id, tableData, user);
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
              <FormControlLabel
                control={
                  <Switch
                    checked={table.isActive}
                    onChange={(e) => handleTablePropChange('isActive', e.target.checked)}
                  />
                }
                label="Tabla Activa"
              />
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
            <Grid container spacing={2}>
                {fields.map((field, index) => (
                <Grid item xs={12} key={index}>
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth label="Nombre del campo" value={field.name} onChange={(e) => handleUpdateField(index, { name: e.target.value })} size="small" required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth label="Etiqueta" value={field.label} onChange={(e) => handleUpdateField(index, { label: e.target.value })} size="small" required />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo</InputLabel>
                                <Select value={field.type} onChange={(e) => handleUpdateField(index, { type: e.target.value as FieldType })} label="Tipo">
                                {FIELD_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>{type.icon} {type.label}</MenuItem>
                                ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <FormControlLabel control={<Switch checked={field.required || false} onChange={(e) => handleUpdateField(index, { required: e.target.checked })} />} label="Requerido" />
                        </Grid>
                        <Grid item xs={6} sm={2} md={2} sx={{ textAlign: 'right' }}>
                            <IconButton color="error" onClick={() => handleRemoveField(index)} size="small"><DeleteIcon /></IconButton>
                        </Grid>
                         {field.type === 'select' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Opciones (separadas por comas)"
                                    value={field.options?.join(', ') || ''}
                                    onChange={(e) => handleUpdateField(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    size="small"
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={handleUpdateTable} disabled={saving} startIcon={<SaveIcon />}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Icon Picker Dialog */}
      <Dialog open={showIconPicker} onClose={() => setShowIconPicker(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar Ícono</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            {ICONS.map((icon) => (
              <Grid item key={icon}>
                <Button variant={table.icon === icon ? 'contained' : 'outlined'} onClick={() => { handleTablePropChange('icon', icon); setShowIconPicker(false); }} sx={{ minWidth: 48, height: 48, fontSize: 20 }}>
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
    </Box>
  );
} 