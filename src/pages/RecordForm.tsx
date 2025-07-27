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
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
        <FormControl fullWidth error={isMissing} size={isMobile ? "small" : "medium"}>
          <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            {field.label + (field.required ? ' *' : '')}
          </InputLabel>
          <Select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            label={field.label + (field.required ? ' *' : '')}
            inputRef={el => fieldRefs.current[field.name] = el}
            sx={{
              '& .MuiSelect-select': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          >
            {asesores.map((asesor) => (
              <MenuItem key={asesor._id || asesor.id || asesor.email} value={asesor._id || asesor.id || asesor.email}>
                {asesor.nombre || asesor.name || asesor.email || asesor._id}
                {asesor.apellido ? ` ${asesor.apellido}` : ''}
              </MenuItem>
            ))}
          </Select>
          {isMissing && (
            <Typography 
              variant="caption" 
              color="error"
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              Este campo es obligatorio
            </Typography>
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
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              },
              '& .MuiFormHelperText-root': {
                fontSize: { xs: '0.7rem', md: '0.75rem' }
              }
            }}
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
                inputRef: (el: any) => fieldRefs.current[field.name] = el,
                size: isMobile ? "small" : "medium",
                sx: {
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }
                }
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
                  size={isMobile ? "small" : "medium"}
                />
              }
              label={field.label + (field.required ? ' *' : '')}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
            {isMissing && (
              <Typography 
                variant="caption" 
                color="error"
                sx={{ 
                  display: 'block',
                  fontSize: { xs: '0.7rem', md: '0.75rem' }
                }}
              >
                Este campo es obligatorio
              </Typography>
            )}
          </Box>
        );
        
      case 'select':
        return (
          <FormControl fullWidth error={isMissing} size={isMobile ? "small" : "medium"}>
            <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {field.label + (field.required ? ' *' : '')}
            </InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              label={field.label + (field.required ? ' *' : '')}
              inputRef={el => fieldRefs.current[field.name] = el}
              sx={{
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {isMissing && (
              <Typography 
                variant="caption" 
                color="error"
                sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
              >
                Este campo es obligatorio
              </Typography>
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
              <Typography 
                variant="caption" 
                color="error"
                sx={{ 
                  display: 'block',
                  mt: 1,
                  fontSize: { xs: '0.7rem', md: '0.75rem' }
                }}
              >
                Este campo es obligatorio
              </Typography>
            )}
          </Box>
        );
        
      default:
        return null;
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

  // Solo ocultar el formulario si el error es de carga de datos
  if (error && (error.startsWith('Error al cargar') || error.startsWith('Error loading'))) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      width: '100%',
      minHeight: { xs: '100vh', md: '80vh' }
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <IconButton 
          onClick={() => navigate(`/tablas/${tableSlug}`)} 
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
            {isEditMode ? 'Editar Registro' : 'Nuevo Registro'} en {table?.name}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Completa los campos para {isEditMode ? 'actualizar' : 'crear'} el registro.
          </Typography>
        </Box>
      </Box>

      {/* Alert de error de validación */}
      {missingFields.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          Faltan campos obligatorios: {missingFields.map(n => table?.fields.find(f => f.name === n)?.label || n).join(', ')}
        </Alert>
      )}
      
      {/* Alert de error de guardado */}
      {error && !(error.startsWith('Error al cargar') || error.startsWith('Error loading')) && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {table?.fields.map((field) => (
                <Grid item xs={12} sm={6} md={6} key={field.name}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'center', md: 'flex-end' }, 
          mt: 3 
        }}>
          <Button
            variant="contained"
            type="submit"
            disabled={saving}
            startIcon={<SaveIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{
              background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              fontSize: { xs: '0.875rem', md: '1rem' },
              px: { xs: 3, md: 4 },
              py: { xs: 1, md: 1.5 },
              width: { xs: '100%', sm: 'auto' },
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