import React, { useState, useEffect } from 'react';
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
import { useParams, useNavigate } from 'react-router-dom';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { 
  getTableBySlug, 
  createRecord, 
  getRecordById, 
  updateRecord 
} from '../api/servicios';
import type { DynamicTable, TableField, CreateRecordRequest, UpdateRecordRequest, DynamicRecord } from '../types';

export default function RecordForm() {
  const [table, setTable] = useState<DynamicTable | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tableSlug, recordId } = useParams<{ tableSlug: string; recordId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!recordId;

  useEffect(() => {
    loadData();
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
          defaultData[field.name] = field.defaultValue ?? (field.type === 'boolean' ? false : '');
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

  const handleSubmit = async () => {
    if (!tableSlug || !user) return;

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

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'currency':
        return (
          <TextField
            fullWidth
            label={field.label}
            type={field.type === 'currency' ? 'number' : field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'date': {
        let formattedDate = '';
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
        return (
          <TextField
            fullWidth
            label={field.label}
            type="date"
            value={formattedDate}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
          />
        );
      }
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
              />
            }
            label={field.label}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              label={field.label}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
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
                onClick={handleSubmit}
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
    </Box>
  );
} 