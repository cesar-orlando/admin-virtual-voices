import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton as MuiIconButton,
  Tooltip,
  Chip as MuiChip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTools, useCategories, useValidation } from '../hooks/useTools';
import type { ITool, CreateToolRequest, UpdateToolRequest, ParameterProperty } from '../types';
import { getTables, getTableStructure } from '../api/servicios/dynamicTableServices';
import { useAuth } from '../hooks/useAuth';

// Schema de validación
const toolSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  displayName: z.string().min(1, 'El nombre para mostrar es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  category: z.string().min(1, 'La categoría es requerida'),
  config: z.object({
    endpoint: z.string().url('Debe ser una URL válida'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    headers: z.record(z.string()).optional(),
    authType: z.enum(['none', 'api_key', 'bearer', 'basic']).optional(),
    authConfig: z.object({
      apiKey: z.string().optional(),
      bearerToken: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    }).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    environment: z.string().optional(),
  }),
  parameters: z.object({
    type: z.literal('object'),
    properties: z.record(z.object({
      type: z.enum(['string', 'number', 'boolean', 'array']),
      description: z.string().min(1, 'La descripción es requerida'),
      required: z.boolean().optional(),
      enum: z.array(z.string()).optional(),
      format: z.string().optional(),
      default: z.any().optional(),
    })),
    required: z.array(z.string()),
  }),
  security: z.object({
    rateLimit: z.object({
      requests: z.number().min(1),
      window: z.string(),
    }).optional(),
    allowedDomains: z.array(z.string()).optional(),
    maxTimeout: z.number().optional(),
  }).optional(),
});

type ToolFormData = z.infer<typeof toolSchema>;

const steps = [
  {
    label: 'Información Básica',
    description: 'Datos generales de la herramienta',
  },
  {
    label: 'Configuración de Endpoint',
    description: 'URL y configuración de autenticación',
  },
  {
    label: 'Parámetros',
    description: 'Definir parámetros de entrada',
  },
  {
    label: 'Seguridad',
    description: 'Configuración de límites y seguridad',
  },
  {
    label: 'Vista Previa',
    description: 'Revisar y probar la configuración',
  },
];

const defaultValues: ToolFormData = {
  name: '',
  displayName: '',
  description: '',
  category: '',
  config: {
    endpoint: '',
    method: 'GET',
    headers: {},
    authType: 'none',
    timeout: 15000,
    environment: '',
    authConfig: {},
  },
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  security: {
    rateLimit: {
      requests: 100,
      window: '1h',
    },
  },
};

const mockCategories = [
  { _id: '1', name: 'customers', displayName: 'Clientes' },
  { _id: '2', name: 'billing', displayName: 'Facturación' },
  { _id: '3', name: 'communications', displayName: 'Comunicaciones' },
  { _id: '4', name: 'analytics', displayName: 'Análisis' },
  { _id: '5', name: 'integrations', displayName: 'Integraciones' },
];

const ENV_OPTIONS = [
  { value: 'production', label: 'Producción', baseUrl: 'https://api.tuapp.com' },
  { value: 'development', label: 'Desarrollo', baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api' },
  { value: 'staging', label: 'Staging', baseUrl: 'https://staging.api.tuapp.com' },
  { value: 'other', label: 'Otro', baseUrl: '' },
];

// Tipos para el parámetro dinámico
const PARAM_TYPES = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Booleano' },
  { value: 'array', label: 'Arreglo' },
];
const STRING_FORMATS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'url', label: 'URL' },
  { value: 'uuid', label: 'UUID' },
];
const mapFieldType = (type: string): 'string' | 'number' | 'boolean' | 'array' => {
  switch (type) {
    case 'boolean':
      return 'boolean';
    case 'number':
    case 'int':
      return 'number';
    case 'multiselect':
      return 'array';
    case 'text':
    case 'select':
    default:
      return 'string';
  }
};
const ToolForm: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();
  const isEdit = Boolean(toolId);
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [paramList, setParamList] = useState<any[]>([]);
  const [paramEdit, setParamEdit] = useState<any>(null);
  const [paramError, setParamError] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);

  // Hooks
  const { tool, isLoading: toolLoading } = useTools();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { hasAIConfig, isLoading: aiConfigLoading } = useValidation();
  const { createTool: createToolMutation, updateTool: updateToolMutation } = useTools();

  // Form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Load tables on mount
  useEffect(() => {
    if (user) {
      getTables(user)
        .then(setTables)
        .catch(console.error);
    }
  }, [user]);

  // Handle navigation
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Handle form submission
  const onSubmit = async (data: ToolFormData) => {
    try {
      if (isEdit) {
        await updateToolMutation.mutateAsync({
          id: toolId!,
          ...data,
        } as UpdateToolRequest);
        toast.success('Herramienta actualizada exitosamente');
      } else {
        await createToolMutation.mutateAsync(data as CreateToolRequest);
        toast.success('Herramienta creada exitosamente');
      }
      navigate('/herramientas');
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error('Error al guardar la herramienta');
    }
  };

  // Sincroniza paramList con react-hook-form
  useEffect(() => {
    // Convierte paramList a formato parameters
    const properties: any = {};
    const required: string[] = [];
    paramList.forEach((p) => {
      properties[p.name] = {
        type: p.type,
        description: p.description,
        required: p.required,
        enum: p.enum?.length ? p.enum : undefined,
        format: p.format || undefined,
      };
      if (p.required) required.push(p.name);
    });
    setValue('parameters', {
      type: 'object',
      properties,
      required,
    });
  }, [paramList, setValue]);

  // Al editar herramienta, carga los parámetros existentes
  useEffect(() => {
    if (isEdit && tool?.parameters) {
      // Normaliza el formato de parameters
      const params = tool.parameters || {};
      const props = typeof params.properties === 'object' ? params.properties : {};
      const reqs = Array.isArray(params.required) ? params.required : [];
      setParamList(
        Object.entries(props).map(([name, val]: any) => ({
          name,
          type: val.type || 'string',
          description: val.description || '',
          required: reqs.includes(name),
          enum: val.enum || [],
          enumText: (val.enum || []).join(','),
          format: val.format || '',
        }))
      );
      // Asegura que parameters en el form siempre tenga el formato correcto
      setValue('parameters', {
        type: 'object',
        properties: props,
        required: reqs,
      });
    }
  }, [isEdit, tool, setValue]);

  // Handler para agregar/editar parámetro
  const handleSaveParam = () => {
    if (!paramEdit?.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramEdit.name)) {
      setParamError('El nombre es requerido y debe ser válido (letras, números, guion bajo, sin espacios)');
      return;
    }
    if (!paramEdit.description) {
      setParamError('La descripción es requerida');
      return;
    }
    if (paramList.some((p) => p.name === paramEdit.name) && (!paramEdit._editing || paramEdit._editing !== paramEdit.name)) {
      setParamError('El nombre del parámetro debe ser único');
      return;
    }
    setParamError(null);
    // Procesa enumText a array solo al guardar
    const enumArray =
      typeof paramEdit.enumText === 'string'
        ? paramEdit.enumText.split(',').map((s: string) => s.trim()).filter(Boolean)
        : paramEdit.enum || [];
    if (paramEdit._editing) {
      setParamList(
        paramList.map((p) =>
          p.name === paramEdit._editing
            ? { ...paramEdit, enum: enumArray, enumText: undefined, _editing: undefined }
            : p
        )
      );
    } else {
      setParamList([
        ...paramList,
        { ...paramEdit, enum: enumArray, enumText: undefined },
      ]);
    }
    setParamEdit(null);
  };

  const handleEditParam = (name: string) => {
    const p = paramList.find((p) => p.name === name);
    if (p) setParamEdit({ ...p, enumText: (p.enum || []).join(','), _editing: name });
  };
  const handleDeleteParam = (name: string) => {
    setParamList(paramList.filter((p) => p.name !== name));
  };

  if (toolLoading) {
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

  if (aiConfigLoading) {
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

  if (!hasAIConfig) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          action={
            <Button 
              color="inherit" 
              size={isMobile ? "small" : "medium"}
              onClick={() => navigate('/ia')}
            >
              Configurar IA
            </Button>
          }
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
          >
            IA no configurada
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Para crear herramientas dinámicas, primero debes configurar una IA en la sección de configuración de IA.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      minHeight: { xs: '100vh', md: '85vh' }
    }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", md: "center" }}
        mb={4}
        flexDirection={{ xs: "column", md: "row" }}
        gap={{ xs: 2, md: 0 }}
      >
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
            {isEdit ? 'Editar Herramienta' : 'Nueva Herramienta'}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            {isEdit ? 'Modifica la configuración de la herramienta' : 'Crea una nueva herramienta dinámica para tu IA'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/herramientas')}
          size={isMobile ? "small" : "medium"}
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' },
            width: { xs: '100%', md: 'auto' }
          }}
        >
          Cancelar
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Stepper */}
        <Grid item xs={12} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stepper 
                activeStep={activeStep} 
                orientation={isMobile ? "horizontal" : "vertical"}
                sx={{
                  '& .MuiStepLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {isMobile ? `${index + 1}` : step.label}
                      </Typography>
                    </StepLabel>
                    {!isMobile && (
                      <StepContent>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                        >
                          {step.description}
                        </Typography>
                      </StepContent>
                    )}
                  </Step>
                ))}
              </Stepper>
              {isMobile && (
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {steps[activeStep]?.label}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {steps[activeStep]?.description}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Form Content */}
        <Grid item xs={12} md={9}>
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 0: Información Básica */}
                {activeStep === 0 && (
                  <Box>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                        fontWeight: 600
                      }}
                    >
                      Información Básica
                    </Typography>
                    <Grid container spacing={{ xs: 2, md: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="displayName"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nombre para mostrar"
                              error={!!errors.displayName}
                              helperText={errors.displayName?.message}
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
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nombre interno"
                              placeholder="nombre_herramienta"
                              error={!!errors.name}
                              helperText={errors.name?.message || "Solo letras, números, guiones y guiones bajos"}
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
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Descripción"
                              multiline
                              rows={isMobile ? 3 : 4}
                              error={!!errors.description}
                              helperText={errors.description?.message}
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
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <FormControl 
                              fullWidth 
                              error={!!errors.category}
                              size={isMobile ? "small" : "medium"}
                            >
                              <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                                Categoría
                              </InputLabel>
                              <Select
                                {...field}
                                label="Categoría"
                                sx={{
                                  '& .MuiSelect-select': {
                                    fontSize: { xs: '0.875rem', md: '1rem' }
                                  }
                                }}
                              >
                                {mockCategories.map((cat) => (
                                  <MenuItem key={cat._id} value={cat.name}>
                                    {cat.displayName}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.category && (
                                <Typography 
                                  variant="caption" 
                                  color="error"
                                  sx={{ 
                                    mt: 0.5, 
                                    ml: 1.75,
                                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                                  }}
                                >
                                  {errors.category.message}
                                </Typography>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Step 1: Configuración de Endpoint */}
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Configuración de Endpoint
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="config.environment"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Environment</InputLabel>
                              <Select {...field} label="Environment">
                                {ENV_OPTIONS.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      {/* Si elige 'Otro', muestra un TextField para escribir el nombre */}
                      {watch('config.environment') === 'other' && (
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name="config.environment"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Nombre del Environment"
                                placeholder="Ej: qa, test, local"
                              />
                            )}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        {/* Selector de tabla dinámica */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Selecciona una tabla dinámica</InputLabel>
                          <Select
                            value={selectedTable?.slug || ''}
                            label="Selecciona una tabla dinámica"
                            onChange={e => handleSelectTable(e.target.value)}
                            disabled={loadingTables}
                          >
                            <MenuItem value="">Ninguna (endpoint manual)</MenuItem>
                            {dynamicTables.map((table) => (
                              <MenuItem key={table.slug} value={table.slug}>
                                {table.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* Switch para modo avanzado */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={advancedMode}
                              onChange={(_, checked) => {
                                setAdvancedMode(checked);
                                if (checked) {
                                  setSelectedTable(null);
                                  setValue('config.endpoint', '');
                                  setValue('parameters', defaultValues.parameters);
                                }
                              }}
                              color="primary"
                            />
                          }
                          label="Modo avanzado (endpoint manual)"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required disabled={functionTypesLoading} error={!!functionTypesError} sx={{ mb: 2 }}>
                          <InputLabel>Tipo de Función</InputLabel>
                          <Select
                            value={functionType}
                            label="Tipo de Función"
                            onChange={e => setFunctionType(e.target.value)}
                          >
                            {functionTypes.length === 0 && !functionTypesLoading ? (
                              <MenuItem value="" disabled>No hay tipos de función disponibles</MenuItem>
                            ) : (
                              functionTypes.map((ft) => (
                                <MenuItem key={ft.type} value={ft.type}>{ft.displayName || ft.type}</MenuItem>
                              ))
                            )}
                          </Select>
                          {functionTypesError && <Typography color="error" variant="caption">{functionTypesError}</Typography>}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="config.endpoint"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="URL del Endpoint"
                              placeholder="https://api.example.com/endpoint"
                              error={!!errors.config?.endpoint}
                              helperText={errors.config?.endpoint?.message}
                              disabled={!!selectedTable && !advancedMode}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="config.method"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Método HTTP</InputLabel>
                              <Select {...field} label="Método HTTP">
                                <MenuItem value="GET">GET</MenuItem>
                                <MenuItem value="POST">POST</MenuItem>
                                <MenuItem value="PUT">PUT</MenuItem>
                                <MenuItem value="DELETE">DELETE</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="config.timeout"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Timeout (ms)"
                              InputProps={{ inputProps: { min: 1000, max: 60000 } }}
                              error={!!errors.config?.timeout}
                              helperText={errors.config?.timeout?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                    {loadingFields && <CircularProgress size={24} sx={{ mt: 2 }} />}
                  </Box>
                )}

                {/* Step 2: Parámetros */}
                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Parámetros
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Agrega los parámetros que tu herramienta necesita. Puedes definir tipo, validaciones y valores por defecto.
                    </Typography>
                    {/* Formulario de edición/agregado */}
                    {paramEdit ? (
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              label="Nombre"
                              value={paramEdit.name}
                              onChange={e => setParamEdit({ ...paramEdit, name: e.target.value.replace(/\s+/g, '_') })}
                              fullWidth
                              required
                              helperText="Sin espacios, solo letras, números y guion bajo"
                              disabled={!!paramEdit._editing}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo</InputLabel>
                              <Select
                                value={paramEdit.type}
                                label="Tipo"
                                onChange={e => setParamEdit({ ...paramEdit, type: e.target.value, enum: [], format: '' })}
                              >
                                {PARAM_TYPES.map(t => (
                                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              label="Descripción"
                              value={paramEdit.description}
                              onChange={e => setParamEdit({ ...paramEdit, description: e.target.value })}
                              fullWidth
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <FormControlLabel
                              control={<Switch checked={!!paramEdit.required} onChange={e => setParamEdit({ ...paramEdit, required: e.target.checked })} />}
                              label="Requerido"
                            />
                          </Grid>
                          {/* Enum solo si tipo es 'string' o 'number' */}
                          {(paramEdit.type === 'string' || paramEdit.type === 'number') && (
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Enum (opciones, separadas por coma)"
                                value={paramEdit.enumText ?? ''}
                                onChange={e => setParamEdit({ ...paramEdit, enumText: e.target.value })}
                                fullWidth
                                helperText="Opcional"
                              />
                            </Grid>
                          )}
                          {/* Format solo si tipo es 'string' */}
                          {paramEdit.type === 'string' && (
                            <Grid item xs={12} sm={2}>
                              <FormControl fullWidth>
                                <InputLabel>Formato</InputLabel>
                                <Select
                                  value={paramEdit.format || ''}
                                  label="Formato"
                                  onChange={e => setParamEdit({ ...paramEdit, format: e.target.value })}
                                >
                                  <MenuItem value="">Ninguno</MenuItem>
                                  {STRING_FORMATS.map(f => (
                                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          )}
                          <Grid item xs={12} sm={12}>
                            {paramError && <Alert severity="error">{paramError}</Alert>}
                          </Grid>
                          <Grid item xs={12} sm={12} sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveParam}>Guardar</Button>
                            <Button variant="outlined" color="secondary" startIcon={<CancelIcon />} onClick={() => { setParamEdit(null); setParamError(null); }}>Cancelar</Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ) : null}
                    {/* Tabla de parámetros */}
                    {paramList.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          No hay parámetros definidos
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setParamEdit({ name: '', type: 'string', description: '', required: false, enum: [], format: '' })}>
                          Agregar Parámetro
                        </Button>
                      </Box>
                    ) : (
                      <>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Requerido</TableCell>
                                <TableCell>Enum</TableCell>
                                <TableCell>Formato</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paramList.map((p) => (
                                <TableRow key={p.name}>
                                  <TableCell>{p.name}</TableCell>
                                  <TableCell>{PARAM_TYPES.find(t => t.value === p.type)?.label || p.type}</TableCell>
                                  <TableCell>{p.description}</TableCell>
                                  <TableCell>{p.required ? <MuiChip label="Sí" color="success" size="small" /> : <MuiChip label="No" color="default" size="small" />}</TableCell>
                                  <TableCell>{p.enum?.length ? p.enum.join(', ') : '-'}</TableCell>
                                  <TableCell>{p.format || '-'}</TableCell>
                                  <TableCell align="right">
                                    <Tooltip title="Editar"><MuiIconButton onClick={() => handleEditParam(p.name)}><EditIcon fontSize="small" /></MuiIconButton></Tooltip>
                                    <Tooltip title="Eliminar"><MuiIconButton onClick={() => handleDeleteParam(p.name)}><DeleteIcon fontSize="small" color="error" /></MuiIconButton></Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setParamEdit({ name: '', type: 'string', description: '', required: false, enum: [], format: '' })}>
                          Agregar Parámetro
                        </Button>
                      </>
                    )}
                  </Box>
                )}

                {/* Step 3: Seguridad */}
                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Configuración de Seguridad
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Esta funcionalidad estará disponible en la próxima versión.
                    </Typography>
                    <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Rate limiting y configuración de seguridad
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Límites de uso, dominios permitidos y timeouts
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Step 4: Vista Previa */}
                {activeStep === 4 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Vista Previa
                    </Typography>
                    <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Resumen de la Herramienta
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                          <Typography variant="body1">{watchedValues.displayName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Categoría:</Typography>
                          <Typography variant="body1">
                            {categories.find((c: any) => c.name === watchedValues.category)?.displayName || watchedValues.category}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Descripción:</Typography>
                          <Typography variant="body1">{watchedValues.description}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Endpoint:</Typography>
                          <Typography variant="body1">{watchedValues.config.endpoint}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Método:</Typography>
                          <Typography variant="body1">{watchedValues.config.method}</Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ 
                  mt: 4, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    startIcon={<BackIcon />}
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      order: { xs: 2, sm: 1 }
                    }}
                  >
                    Anterior
                  </Button>
                  <Box sx={{ order: { xs: 1, sm: 2 } }}>
                    {/* Log de errores de validación para debug */}
                    {Object.keys(errors).length > 0 && !isMobile && (
                      <pre style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                        {JSON.stringify(errors, null, 2)}
                      </pre>
                    )}
                    {activeStep === steps.length - 1 && Object.keys(watch('parameters.properties') || {}).length === 0 && (
                      <Alert 
                        severity="warning" 
                        sx={{ 
                          mb: 2,
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                      >
                        Debes agregar al menos un parámetro para que la herramienta funcione correctamente.
                      </Alert>
                    )}
                    {activeStep === steps.length - 1 ? (
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!isValid || createToolMutation.isPending || updateToolMutation.isPending}
                        size={isMobile ? "medium" : "large"}
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        {createToolMutation.isPending || updateToolMutation.isPending
                          ? 'Guardando...'
                          : isEdit
                          ? 'Actualizar'
                          : 'Crear Herramienta'
                        }
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<NextIcon />}
                        size={isMobile ? "medium" : "large"}
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        Siguiente
                      </Button>
                    )}
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Función utilitaria para obtener function-types desde el backend
export async function fetchFunctionTypes(c_name: string): Promise<any[]> {
  const res = await fetch(`/api/tools/function-types/${c_name}`);
  if (!res.ok) throw new Error('No se pudieron obtener los tipos de función');
  const data = await res.json();
  return data.functionTypes || [];
}

export default ToolForm;