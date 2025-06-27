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
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as TimeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { useTools } from '../hooks/useTools';
import type { ITool, ToolTestRequest, ParameterProperty } from '../types';

interface TestResult {
  success: boolean;
  executionTime: number;
  response?: any;
  error?: string;
}

interface TestHistory {
  id: string;
  parameters: Record<string, any>;
  result: TestResult;
}

const ToolTester: React.FC = () => {
  const { toolId } = useParams();
  const navigate = useNavigate();
  
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { useToolById, useTestTool, useToolsList } = useTools();
  
  // Queries
  const { data: toolData, isLoading: toolLoading } = useToolById(toolId || '');
  const { data: toolsList } = useToolsList({ page: 1, limit: 100 });
  
  // Mutations
  const testToolMutation = useTestTool();

  const tool = (toolData as any)?.tool;
  const availableTools = (toolsList as any)?.tools || [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Record<string, any>>({
    defaultValues: {},
  });

  // Efecto para cargar parámetros por defecto cuando cambia la herramienta
  useEffect(() => {
    if (tool) {
      const defaultParams: Record<string, any> = {};
      
      Object.entries(tool.parameters.properties).forEach(([key, param]) => {
        const typedParam = param as ParameterProperty;
        if (typedParam.default !== undefined) {
          defaultParams[key] = typedParam.default;
        } else {
          // Valores por defecto según el tipo
          switch (typedParam.type) {
            case 'string':
              defaultParams[key] = typedParam.enum && typedParam.enum.length > 0 ? typedParam.enum[0] : '';
              break;
            case 'number':
              defaultParams[key] = 0;
              break;
            case 'boolean':
              defaultParams[key] = false;
              break;
            case 'array':
              defaultParams[key] = [];
              break;
          }
        }
      });
      
      reset(defaultParams);
    }
  }, [tool, reset]);

  const onSubmit = async (data: Record<string, any>) => {
    if (!tool) return;

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const testRequest: ToolTestRequest = {
        testParameters: data,
      };

      const result = await testToolMutation.mutateAsync({
        toolId: tool._id,
        data: testRequest,
      });
      
      const apiResult = (result as any).result;

      const testResult: TestResult = {
        success: apiResult?.success || false,
        executionTime: apiResult?.executionTime || 0,
        response: apiResult,
        error: apiResult?.success ? undefined : (apiResult?.error || 'Error en la ejecución'),
      };

      setCurrentResult(testResult);

      // Agregar al historial
      const historyEntry: TestHistory = {
        id: Date.now().toString(),
        parameters: { ...data },
        result: testResult,
      };

      setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Mantener últimos 10

      if (testResult.success) {
        toast.success('Prueba ejecutada correctamente');
      } else {
        toast.error('Error en la ejecución de la prueba');
      }
    } catch (error: any) {
      const errorResult: TestResult = {
        success: false,
        executionTime: 0,
        error: error?.response?.data?.message || 'Error de conexión o configuración',
      };
      
      setCurrentResult(errorResult);
      toast.error('Error al ejecutar la prueba');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderParameterField = (paramName: string, param: any) => {
    const typedParam = param as ParameterProperty;
    const fieldProps = {
      fullWidth: true,
      size: 'small' as const,
      label: typedParam.description || paramName,
      error: !!(errors as any)[paramName],
      helperText: (errors as any)[paramName]?.message,
    };

    switch (typedParam.type) {
      case 'string':
        if (typedParam.enum && typedParam.enum.length > 0) {
          return (
            <Controller
              name={paramName}
              control={control}
              rules={{ required: typedParam.required }}
              render={({ field }) => (
                <FormControl {...fieldProps}>
                  <InputLabel>{typedParam.description || paramName}</InputLabel>
                  <Select {...field} label={typedParam.description || paramName}>
                    {typedParam.enum?.map((option: string) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          );
        }
        return (
          <Controller
            name={paramName}
            control={control}
            rules={{ required: typedParam.required }}
            render={({ field }) => (
              <TextField
                {...field}
                {...fieldProps}
                type={typedParam.format === 'email' ? 'email' : 'text'}
                placeholder={typedParam.format === 'email' ? 'ejemplo@email.com' : `Ingresa ${paramName}`}
              />
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={paramName}
            control={control}
            rules={{ required: typedParam.required }}
            render={({ field }) => (
              <TextField
                {...field}
                {...fieldProps}
                type="number"
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value || ''}
              />
            )}
          />
        );

      case 'boolean':
        return (
          <Controller
            name={paramName}
            control={control}
            render={({ field }) => (
              <FormControl {...fieldProps}>
                <InputLabel>{typedParam.description || paramName}</InputLabel>
                <Select {...field} label={typedParam.description || paramName}>
                  <MenuItem value="true">Verdadero</MenuItem>
                  <MenuItem value="false">Falso</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        );

      default:
        return (
          <Controller
            name={paramName}
            control={control}
            rules={{ required: typedParam.required }}
            render={({ field }) => (
              <TextField
                {...field}
                {...fieldProps}
                multiline
                rows={2}
                placeholder="Ingresa un valor JSON válido"
              />
            )}
          />
        );
    }
  };

  if (toolLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!tool && toolId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Herramienta no encontrada
        </Alert>
      </Box>
    );
  }

  if (availableTools.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Box textAlign="center" py={8}>
          <WarningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No hay herramientas para probar
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Crea herramientas primero para poder probarlas aquí
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<BuildIcon />}
            onClick={() => navigate('/herramientas/nueva')}
          >
            Crear Herramienta
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tester de Herramientas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Prueba el funcionamiento de tus herramientas en tiempo real
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/herramientas')}
        >
          Volver a Herramientas
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Tool Selection & Parameters */}
        <Grid item xs={12} md={6}>
          {/* Tool Selection */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seleccionar Herramienta
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Herramienta</InputLabel>
                <Select
                  value={toolId || ''}
                  onChange={(e) => navigate(`/herramientas/${e.target.value}/test`)}
                  label="Herramienta"
                >
                  {availableTools.map((t: any) => (
                    <MenuItem key={t._id} value={t._id}>
                      <Box>
                        <Typography variant="body2">{t.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.name} - {t.category}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Tool Info */}
          {tool && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6">{tool.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tool.name}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={tool.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={tool.config.method}
                      size="small"
                      color="secondary"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {tool.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Endpoint: {tool.config.endpoint}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Parameters Form */}
          {tool && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Parámetros de Prueba
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={2}>
                    {Object.entries(tool.parameters.properties).map(([paramName, param]) => (
                      <Grid item xs={12} key={paramName}>
                        {renderParameterField(paramName, param)}
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isLoading ? <CircularProgress size={20} /> : <PlayIcon />}
                      disabled={isLoading}
                      fullWidth
                    >
                      {isLoading ? 'Ejecutando...' : 'Ejecutar Prueba'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Results & History */}
        <Grid item xs={12} md={6}>
          {/* Current Result */}
          {currentResult && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Resultado de la Prueba
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {currentResult.success ? (
                      <SuccessIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                    <Chip 
                      icon={<TimeIcon />}
                      label={`${currentResult.executionTime}ms`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {currentResult.success ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Prueba ejecutada correctamente
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {currentResult.error || 'Error en la ejecución'}
                  </Alert>
                )}

                {currentResult.response && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2">Respuesta:</Typography>
                      <Tooltip title="Copiar respuesta">
                        <IconButton 
                          size="small"
                          onClick={() => copyToClipboard(formatJson(currentResult.response))}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: 'grey.50',
                        maxHeight: 300,
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ 
                        fontSize: '12px', 
                        margin: 0,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {formatJson(currentResult.response)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test History */}
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Historial de Pruebas
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => setTestHistory([])}
                >
                  Limpiar
                </Button>
              </Box>

              {testHistory.length > 0 ? (
                <Box>
                  {testHistory.map((entry) => (
                    <Accordion key={entry.id} elevation={1}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                          {entry.result.success ? (
                            <SuccessIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {new Date().toLocaleTimeString()}
                          </Typography>
                          <Chip 
                            label={`${entry.result.executionTime}ms`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Parámetros:
                            </Typography>
                            <Paper elevation={1} sx={{ p: 1, backgroundColor: 'grey.50' }}>
                              <pre style={{ fontSize: '11px', margin: 0 }}>
                                {formatJson(entry.parameters)}
                              </pre>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Resultado:
                            </Typography>
                            <Paper elevation={1} sx={{ p: 1, backgroundColor: 'grey.50' }}>
                              <pre style={{ fontSize: '11px', margin: 0 }}>
                                {formatJson(entry.result.response || { error: entry.result.error })}
                              </pre>
                            </Paper>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No hay pruebas ejecutadas aún
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ToolTester;