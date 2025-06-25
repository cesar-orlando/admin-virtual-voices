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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Warning as WarningIcon,
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
  { _id: '4', name: 'analytics', displayName: 'Analytics' },
];

const ToolForm: React.FC = () => {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const isEdit = !!toolId;
  
  const [activeStep, setActiveStep] = useState(0);
  const [hasAIConfig, setHasAIConfig] = useState(false);
  const [aiConfigLoading, setAiConfigLoading] = useState(true);
   
  const { useCreateTool, useUpdateTool, useToolById, useTestTool } = useTools();
  const { useCategoriesList } = useCategories();
  const { useValidateEndpoint, useValidateSchema } = useValidation();
  const { user } = useAuth();
  const [dynamicTables, setDynamicTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Queries
  const { data: toolData, isLoading: toolLoading } = useToolById(toolId || '');
  const { data: categoriesData } = useCategoriesList();
  
  // Mutations
  const createToolMutation = useCreateTool();
  const updateToolMutation = useUpdateTool();
  const testToolMutation = useTestTool();
  const validateEndpointMutation = useValidateEndpoint();
  const validateSchemaMutation = useValidateSchema();

  const tool = (toolData as any)?.tool;
  const categories = (categoriesData as any)?.categories || [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
    reset,
  } = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Verificar si hay IA configurada
  useEffect(() => {
    const checkAIConfig = async () => {
      try {
        setAiConfigLoading(true);
        // Aquí deberías hacer una llamada al backend para verificar si hay IA configurada
        // Por ahora, simulamos que siempre hay IA configurada
        setHasAIConfig(true);
      } catch (error) {
        setHasAIConfig(false);
      } finally {
        setAiConfigLoading(false);
      }
    };

    checkAIConfig();
  }, []);

  // Cargar datos de la herramienta si es edición
  useEffect(() => {
    if (isEdit && tool) {
      reset({
        name: tool.name,
        displayName: tool.displayName,
        description: tool.description,
        category: tool.category,
        config: tool.config,
        parameters: tool.parameters,
        security: tool.security,
      });
    }
  }, [isEdit, tool, reset]);

  useEffect(() => {
    if (activeStep === 1 && user) {
      setLoadingTables(true);
      getTables(user)
        .then(res => setDynamicTables(res.tables || []))
        .catch(() => setDynamicTables([]))
        .finally(() => setLoadingTables(false));
    }
  }, [activeStep, user]);

  const watchedValues = watch();

  // --- Generador de nombre técnico ---
  function normalizeTechnicalName(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // todo lo que no sea letra/num a _
      .replace(/^_+|_+$/g, ''); // quita _ al inicio/fin
  }

  useEffect(() => {
    // Solo si no es edición (para no sobreescribir en modo edición)
    if (!isEdit) {
      const displayName = watch('displayName');
      if (displayName) {
        let technical = normalizeTechnicalName(displayName);
        setValue('name', technical);
      } else {
        setValue('name', '');
      }
    }
  }, [watch('displayName'), isEdit, setValue]);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      if (activeStep === 1) {
        // Validar endpoint antes de continuar
        await validateEndpoint();
      }
      setActiveStep((prev) => prev + 1);
    }
  };

  const validateEndpoint = async () => {
    try {
      const result = await validateEndpointMutation.mutateAsync({
        endpoint: watchedValues.config.endpoint,
        method: watchedValues.config.method,
        timeout: watchedValues.config.timeout,
      });
      
      if (!result.data?.isValid) {
        toast.error('El endpoint no es válido');
        return false;
      }
      
      toast.success('Endpoint validado correctamente');
      return true;
    } catch (error) {
      toast.error('Error al validar el endpoint');
      return false;
    }
  };

  const validateParametersSchema = async () => {
    try {
      const result = await validateSchemaMutation.mutateAsync({
        parameters: watchedValues.parameters,
      });
      
      if (!result.data?.isValid) {
        toast.error('Los parámetros no son válidos');
        return false;
      }
      
      return true;
    } catch (error) {
      toast.error('Error al validar los parámetros');
      return false;
    }
  };

  const onSubmit = async (data: ToolFormData) => {
    try {
      if (isEdit && tool) {
        await updateToolMutation.mutateAsync({
          toolId: tool._id,
          data: data as UpdateToolRequest,
        });
        toast.success('Herramienta actualizada correctamente');
      } else {
        await createToolMutation.mutateAsync(data as CreateToolRequest);
        toast.success('Herramienta creada correctamente');
      }
      navigate('/herramientas');
    } catch (error) {
      toast.error('Error al guardar la herramienta');
    }
  };

  const getFieldsForStep = (step: number): (keyof ToolFormData)[] => {
    switch (step) {
      case 0:
        return ['name', 'displayName', 'description', 'category'];
      case 1:
        return ['config'];
      case 2:
        return ['parameters'];
      case 3:
        return ['security'];
      default:
        return [];
    }
  };

  // Cuando selecciona una tabla
  const handleSelectTable = async (slug: string) => {
    if (!slug || !user) {
      setSelectedTable(null);
      setValue('config.endpoint', '');
      setValue('parameters', defaultValues.parameters);
      return;
    }
    setLoadingFields(true);
    const table = dynamicTables.find(t => t.slug === slug);
    setSelectedTable(table);
    // Endpoint autogenerado
    setValue('config.endpoint', `/records/table/${user.c_name}/${slug}`);
    // Obtener estructura y mapear a parámetros
    try {
      const structure = await getTableStructure(slug, user);
      const properties: any = {};
      const required: string[] = [];
      (structure.fields || []).forEach((field: any) => {
        properties[field.name] = {
          type: field.type === 'int' ? 'number' : field.type, // Ajusta según tus tipos
          description: field.label || field.name,
          required: !!field.required,
          default: field.defaultValue,
          enum: field.options || undefined,
        };
        if (field.required) required.push(field.name);
      });
      setValue('parameters', {
        type: 'object',
        properties,
        required,
      });
    } catch {
      setValue('parameters', defaultValues.parameters);
    } finally {
      setLoadingFields(false);
    }
  };

  if (toolLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (aiConfigLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!hasAIConfig) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/ia')}
            >
              Configurar IA
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            IA no configurada
          </Typography>
          <Typography>
            Para crear herramientas dinámicas, primero debes configurar una IA en la sección de configuración de IA.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {isEdit ? 'Editar Herramienta' : 'Nueva Herramienta'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isEdit ? 'Modifica la configuración de la herramienta' : 'Crea una nueva herramienta dinámica para tu IA'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/herramientas')}
        >
          Cancelar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Stepper */}
        <Grid item xs={12} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Typography variant="body2" fontWeight="medium">
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Content */}
        <Grid item xs={12} md={9}>
          <Card elevation={2}>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 0: Información Básica */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Información Básica
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="displayName"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nombre para Mostrar"
                              placeholder="Obtener Datos del Cliente"
                              error={!!errors.displayName}
                              helperText={errors.displayName?.message}
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
                              label="Nombre Técnico"
                              placeholder="get_customer_data"
                              error={!!errors.name}
                              helperText={errors.name?.message || 'Se genera automáticamente a partir del nombre para mostrar'}
                              disabled
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
                              multiline
                              rows={3}
                              label="Descripción"
                              placeholder="Describe qué hace esta herramienta..."
                              error={!!errors.description}
                              helperText={errors.description?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.category}>
                              <InputLabel>Categoría</InputLabel>
                              <Select {...field} label="Categoría">
                                {categories.map((cat: any) => (
                                  <MenuItem key={cat.name} value={cat.name}>
                                    {cat.displayName}
                                  </MenuItem>
                                ))}
                              </Select>
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
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Esta funcionalidad estará disponible en la próxima versión.
                    </Typography>
                    <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Constructor de parámetros dinámico
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permite definir tipos, validaciones y valores por defecto
                      </Typography>
                    </Box>
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
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    startIcon={<BackIcon />}
                  >
                    Anterior
                  </Button>
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!isValid || createToolMutation.isPending || updateToolMutation.isPending}
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

export default ToolForm;