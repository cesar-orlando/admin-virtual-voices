import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { 
  getTableBySlug, 
  createRecord, 
  getRecordById, 
  updateRecord
} from '../api/servicios';
import { fetchCompanyUsers } from '../api/servicios/userServices';
import type { DynamicTable, TableField, CreateRecordRequest, UpdateRecordRequest, DynamicRecord } from '../types';
import FileDropzone from '../components/FileDropzone';

export default function RecordForm() {
  const [table, setTable] = useState<DynamicTable | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asesores, setAsesores] = useState<any[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const fieldRefs = useRef<Record<string, any>>({});

  const { tableSlug, recordId } = useParams<{ tableSlug: string; recordId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!recordId;

  useEffect(() => {
    loadData();
    // Si el campo asesor existe, carga los asesores
    if (user && tableSlug) {
      fetchCompanyUsers(user.companySlug || '').then(setAsesores);
    }
  }, [tableSlug, recordId, user]);

  const loadData = async () => {
    if (!tableSlug || !user) return;

    try {
      setLoading(true);
      setError(null);

      const tableData = await getTableBySlug(tableSlug, user);
      setTable(tableData);

      if (isEditMode && recordId) {
        const response = await getRecordById(recordId, user);
        if (response && response.record) {
            setFormData(response.record.data);
        } else {
            throw new Error("El formato de la respuesta del registro es inesperado.");
        }
      } else {
        const defaultData: Record<string, any> = {};
        tableData.fields.forEach((field: TableField) => {
          if (field.type === 'file') {
            defaultData[field.name] = field.defaultValue ?? [];
          } else if (field.type === 'boolean') {
            defaultData[field.name] = field.defaultValue ?? false;
          } else {
            defaultData[field.name] = field.defaultValue ?? '';
          }
        });
        setFormData(defaultData);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tableSlug || !user || !table) return;

    // Validar campos requeridos
    const requiredFields = table.fields.filter(f => f.required);
    const missing: string[] = [];
    requiredFields.forEach(f => {
      const value = formData[f.name];
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        missing.push(f.name);
      }
    });
    setMissingFields(missing);
    if (missing.length > 0) {
      setError(`Faltan campos requeridos: ${missing.map(n => table.fields.find(f => f.name === n)?.label || n).join(', ')}`);
      // Focus al primer campo con error
      setTimeout(() => {
        if (fieldRefs.current[missing[0]] && typeof fieldRefs.current[missing[0]].focus === 'function') {
          fieldRefs.current[missing[0]].focus();
        }
      }, 100);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (isEditMode && recordId) {
        const updateData: UpdateRecordRequest = { data: formData };
        await updateRecord(recordId, updateData, user);
      } else {
        const createData: CreateRecordRequest = { tableSlug, data: formData };
        await createRecord(createData, user);
      }
      navigate(`/tablas/${tableSlug}`);
    } catch (err) {
      setError('Error al guardar el registro');
      console.error('Error saving record:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const renderField = (field: TableField) => {
    const value = formData[field.name] ?? '';
    const isMissing = missingFields.includes(field.name);
    // Si el campo es 'asesor', renderiza un select con los asesores
    if (field.name === 'asesor') {
      return (
        <FormControl fullWidth error={isMissing}>
          <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
          <Select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            label={field.label + (field.required ? ' *' : '')}
            inputRef={el => fieldRefs.current[field.name] = el}
          >
            {asesores.map((asesor) => (
              <MenuItem key={asesor._id || asesor.id || asesor.email} value={asesor._id || asesor.id || asesor.email}>
                {asesor.nombre || asesor.name || asesor.email || asesor._id}
                {asesor.apellido ? ` ${asesor.apellido}` : ''}
              </MenuItem>
            ))}
          </Select>
          {isMissing && (
            <Typography variant="caption" color="error">Este campo es obligatorio</Typography>
          )}
        </FormControl>
      );
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'currency':
        return (
          <TextField
            fullWidth
            label={field.label + (field.required ? ' *' : '')}
            type={field.type === 'currency' ? 'number' : field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            error={isMissing}
            helperText={isMissing ? 'Este campo es obligatorio' : ''}
            inputRef={el => fieldRefs.current[field.name] = el}
          />
        );
      case 'date': {
        const dateValue = value ? new Date(value) : null;
        return (
          <DateTimePicker
            label={field.label + (field.required ? ' *' : '')}
            value={dateValue}
            onChange={(newValue) => handleInputChange(field.name, newValue)}
            sx={{ width: '100%' }}
            slotProps={{
              textField: {
                error: isMissing,
                helperText: isMissing ? 'Este campo es obligatorio' : '',
                inputRef: (el: any) => fieldRefs.current[field.name] = el
              }
            }}
          />
        );
      }
      case 'boolean':
        return (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!value}
                  onChange={(e) => handleInputChange(field.name, e.target.checked)}
                  inputRef={el => fieldRefs.current[field.name] = el}
                />
              }
              label={field.label + (field.required ? ' *' : '')}
            />
            {isMissing && (
              <Typography variant="caption" color="error">Este campo es obligatorio</Typography>
            )}
          </Box>
        );
      case 'select':
        return (
          <FormControl fullWidth error={isMissing}>
            <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              label={field.label + (field.required ? ' *' : '')}
              inputRef={el => fieldRefs.current[field.name] = el}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {isMissing && (
              <Typography variant="caption" color="error">Este campo es obligatorio</Typography>
            )}
          </FormControl>
        );
      case 'file':
        return (
          <Box>
            <FileDropzone
              value={Array.isArray(value) ? value : (value ? [value] : [])}
              onChange={(urls) => handleInputChange(field.name, urls)}
              label={field.label + (field.required ? ' *' : '')}
              maxFiles={10}
              // acceptedFileTypes eliminado para aceptar cualquier archivo
            />
            {isMissing && (
              <Typography variant="caption" color="error">Este campo es obligatorio</Typography>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  // Solo ocultar el formulario si el error es de carga de datos
  if (error && (error.startsWith('Error al cargar') || error.startsWith('Error loading'))) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate(`/tablas/${tableSlug}`)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
            </IconButton>
            <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    {isEditMode ? 'Editar Registro' : 'Nuevo Registro'} en {table?.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Completa los campos para {isEditMode ? 'actualizar' : 'crear'} el registro.
                </Typography>
            </Box>
        </Box>

        {/* Alert de error de validación */}
        {missingFields.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Faltan campos obligatorios: {missingFields.map(n => table?.fields.find(f => f.name === n)?.label || n).join(', ')}
          </Alert>
        )}
        {/* Alert de error de guardado */}
        {error && !(error.startsWith('Error al cargar') || error.startsWith('Error loading')) && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <Card>
              <CardContent>
                  <Grid container spacing={3}>
                      {table?.fields.map((field) => (
                          <Grid item xs={12} sm={6} key={field.name}>
                              {renderField(field)}
                          </Grid>
                      ))}
                  </Grid>
              </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                  variant="contained"
                  type="submit"
                  disabled={saving}
                  startIcon={<SaveIcon />}
                  sx={{
                      background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D04EFF 0%, #7A4CF6 100%)',
                      }
                  }}
              >
                  {saving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Registro')}
              </Button>
          </Box>
        </form>
    </Box>
  );
} 