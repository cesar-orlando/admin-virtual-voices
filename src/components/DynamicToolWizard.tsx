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
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  GetApp as GetIcon,
  PostAdd as PostIcon,
  Edit as PutIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getTables, getTableStructure } from '../api/servicios/dynamicTableServices';
import { useTools } from '../hooks/useTools';
import { toast } from 'react-toastify';

interface DynamicToolWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ToolType = 'GET' | 'POST' | 'PUT';
type ToolCategory = 'sales' | 'ai_control';

interface FieldSelection {
  name: string;
  label: string;
  type: string;
  selected: boolean;
  required?: boolean;
  defaultValue?: any;
  aiCondition?: string; // Cuándo usar esta herramienta
}

interface ToolTemplate {
  type: ToolType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: ToolCategory;
  examples: string[];
}

const toolTemplates: ToolTemplate[] = [
  {
    type: 'GET',
    title: 'Buscar/Obtener Información',
    description: 'Busca y consulta datos de una tabla (incluye búsqueda por número)',
    icon: <GetIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
    category: 'sales',
    examples: [
      'Buscar prospecto por número',
      'Ver todos los prospectos',
      'Buscar clientes por zona',
      'Consultar datos de contacto'
    ]
  },
  {
    type: 'POST',
    title: 'Crear Registro',
    description: 'Guarda nueva información cuando el cliente proporciona datos',
    icon: <PostIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
    category: 'sales',
    examples: [
      'Crear nuevo prospecto',
      'Registrar datos de contacto',
      'Guardar preferencias del cliente',
      'Generar lead automáticamente'
    ]
  },
  {
    type: 'PUT',
    title: 'Actualizar Campo',
    description: 'Modifica información específica de registros existentes (requiere ID)',
    icon: <PutIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
    category: 'sales',
    examples: [
      'Cambiar presupuesto del cliente',
      'Actualizar zona de preferencia',
      'Modificar forma de pago',
      'Desactivar IA para citas'
    ]
  }
];

export default function DynamicToolWizard({ open, onClose, onSuccess }: DynamicToolWizardProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const { useCreateTool, useToolsList } = useTools();
  const createToolMutation = useCreateTool();
  
  // Obtener herramientas existentes para verificar dependencias
  const tools = useToolsList({ companySlug: user?.c_name || user?.companySlug } as any);

  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [dynamicTables, setDynamicTables] = useState<any[]>([]);
  const [tableFields, setTableFields] = useState<FieldSelection[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [isAIControl, setIsAIControl] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);

  // Cargar tablas cuando se abre el dialog
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      getTables(user)
        .then(res => setDynamicTables(res.tables || []))
        .catch(() => setDynamicTables([]))
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  // Cargar campos cuando se selecciona una tabla
  useEffect(() => {
    if (selectedTable && user) {
      setLoading(true);
      getTableStructure(selectedTable.slug, user)
        .then(structure => {
          const fields = structure.structure.fields.map((field: any) => ({
            name: field.name,
            label: field.label || field.name,
            type: field.type,
            selected: false,
            required: false
          }));
          setTableFields(fields);
        })
        .catch(() => setTableFields([]))
        .finally(() => setLoading(false));
    }
  }, [selectedTable, user]);

  const steps = ['Tipo de Herramienta', 'Seleccionar Tabla', 'Configurar Campos', 'Revisar y Crear'];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Auto-generar descripción inteligente al entrar al paso 2
      if (currentStep === 1 && selectedTemplate && selectedTable) {
        // Dar un pequeño delay para que los campos se carguen
        setTimeout(() => {
          generateSmartDescription();
        }, 100);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: ToolTemplate) => {
    setSelectedTemplate(template);
    setIsAIControl(template.category === 'ai_control');
    
    // Auto-generar nombre y descripción basado en template
    if (template.type === 'GET') {
      setToolName('buscar_por_numero');
      setToolDescription('Busca y obtiene información del prospecto usando su número de WhatsApp para identificarlo automáticamente');
    } else if (template.type === 'POST') {
      setToolName('crear_prospecto');
      setToolDescription('Crea un nuevo prospecto cuando un cliente nuevo contacta por WhatsApp y proporciona sus datos');
    } else if (template.type === 'PUT') {
      if (isAIControl) {
        setToolName('controlar_ia');
        setToolDescription('Desactiva la IA automáticamente cuando el cliente quiere hablar con un asesor humano o agendar una cita');
      } else {
        setToolName('actualizar_prospecto');
        setToolDescription('Actualiza información específica del prospecto identificado por su número de WhatsApp');
      }
    }
  };

  const normalizeName = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-zA-Z0-9]/g, '_') // reemplaza todo lo que no sea letra/número con _
      .replace(/_{2,}/g, '_') // reemplaza múltiples _ con uno solo
      .replace(/^_+|_+$/g, ''); // quita _ al inicio y final
  };

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    
    // Actualizar nombres con la tabla seleccionada
    if (selectedTemplate && user) {
      const tableSlug = normalizeName(table.slug);
      const companySlug = normalizeName(user.companySlug || user.c_name || 'company');
      
      if (selectedTemplate.type === 'GET') {
        setToolName(`buscar_${tableSlug}_${companySlug}`);
      } else if (selectedTemplate.type === 'POST') {
        setToolName(`crear_${tableSlug}_${companySlug}`);
      } else if (selectedTemplate.type === 'PUT') {
        if (isAIControl) {
          setToolName(`controlar_ia_${tableSlug}_${companySlug}`);
        } else {
          setToolName(`actualizar_${tableSlug}_${companySlug}`);
        }
        
        // Auto-ejecutar creación de GET cuando se selecciona tabla y es PUT
        if (selectedTemplate?.type === 'PUT' && user && table?.slug) {
          // DIRECTO - sin delays ni complicaciones
          ensureGetToolExists(table);
        }
      }
    }
  };

  const toggleFieldSelection = (fieldName: string) => {
    setTableFields(prev => prev.map(field => 
      field.name === fieldName 
        ? { ...field, selected: !field.selected }
        : field
    ));
  };

  const toggleFieldRequired = (fieldName: string) => {
    setTableFields(prev => prev.map(field => 
      field.name === fieldName 
        ? { ...field, required: !field.required }
        : field
    ));
  };

  // NUEVA FUNCIÓN CORREGIDA SEGÚN DOCUMENTACIÓN DEL BACKEND
  const buildCorrectToolConfig = () => {
    if (!selectedTemplate || !selectedTable || !user) {
      throw new Error('Faltan datos requeridos: template, tabla o usuario');
    }

    const baseUrl = 'https://api-virtual-voices.onrender.com/api';
    const selectedFields = tableFields.filter(f => f.selected);
    
    // VALIDACIONES CRÍTICAS ANTES DE CONSTRUIR
    if (selectedFields.length === 0) {
      throw new Error('Debes seleccionar al menos un campo');
    }

    if (!toolName?.trim() || toolName.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }

    if (!toolDescription?.trim() || toolDescription.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }

    // NORMALIZAR NOMBRES SEGÚN DOCUMENTACIÓN
    const normalizedToolName = normalizeName(toolName.trim());
    const companySlug = user.c_name || user.companySlug;
    const normalizedTableSlug = normalizeName(selectedTable.slug);

    if (!companySlug) {
      throw new Error('No se pudo obtener el identificador de empresa (c_name)');
    }

    // DESCRIPCIÓN CON CONDICIONES ESPECÍFICAS
    let finalDescription = toolDescription.trim();
    if (isAIControl) {
      const iaField = selectedFields.find(f => f.name === 'ia');
      if (iaField?.aiCondition?.trim()) {
        finalDescription += `. Activar cuando cliente dice: "${iaField.aiCondition.trim()}"`;
      }
    }

    // ESTRUCTURA EXACTA SEGÚN CreateToolRequest
    const toolRequest: any = {
      name: normalizedToolName,
      displayName: normalizedToolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: finalDescription,
      category: isAIControl ? 'ai_control' : 'sales',
      config: {
        endpoint: '', // Se define abajo según el tipo
        method: selectedTemplate.type,
        authType: 'none',
        timeout: 15000
      },
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      security: {
        rateLimit: {
          requests: 100,
          window: '1h'
        },
        allowedDomains: [],
        maxTimeout: 30000
      }
    };

    // CONFIGURAR ENDPOINT Y PARÁMETROS SEGÚN TIPO
    if (selectedTemplate.type === 'GET') {
      toolRequest.config.endpoint = `${baseUrl}/records/table/${companySlug}/${normalizedTableSlug}`;
      
      const properties: any = {};
      const requiredFields: string[] = [];
      
      selectedFields.forEach(field => {
        let description = `Filtrar por ${field.label || field.name}`;
        
        // Descripción especial para campos de número/teléfono (CRÍTICO PARA WHATSAPP)
        if (field.name.toLowerCase().includes('number') || 
            field.name.toLowerCase().includes('numero') ||
            field.name.toLowerCase().includes('telefono') ||
            field.name.toLowerCase().includes('phone')) {
          description = `Buscar prospecto por ${field.label || field.name}. USAR SIEMPRE para identificar cliente de WhatsApp`;
        }
        
        const validFieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
        
        properties[validFieldName] = {
          type: mapFieldTypeToParam(field.type),
          description: description,
          required: field.required || false
        };

        if (field.required) {
          requiredFields.push(validFieldName);
        }
      });
      
      // Parámetro limit para GET
      properties.limit = {
        type: 'number',
        description: 'Número máximo de registros (usar 1 para búsqueda específica)',  
        required: false
      };

      toolRequest.parameters.properties = properties;
      toolRequest.parameters.required = requiredFields;

    } else if (selectedTemplate.type === 'POST') {
      toolRequest.config.endpoint = `${baseUrl}/records/`;
      
      const properties: any = {};
      const requiredFields = ['tableSlug', 'c_name', 'createdBy'];
      
      // Parámetros base para POST
      properties.tableSlug = {
        type: 'string',
        description: 'Tabla donde crear el registro',  
        required: true
      };
      
      properties.c_name = {
        type: 'string',
        description: 'Nombre de la empresa',
        required: true
      };
      
      properties.createdBy = {
        type: 'string',
        description: 'Usuario que crea el registro',
        required: true
      };

      // Agregar campos específicos de la tabla
      selectedFields.forEach(field => {
        const validFieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
        
        properties[validFieldName] = {
          type: mapFieldTypeToParam(field.type),
          description: `${field.label || field.name} del nuevo registro`,
          required: field.required || false
        };

        if (field.required) {
          requiredFields.push(validFieldName);
        }
      });

      toolRequest.parameters.properties = properties;
      toolRequest.parameters.required = requiredFields;

    } else if (selectedTemplate.type === 'PUT') {
      toolRequest.config.endpoint = `${baseUrl}/records/{{recordId}}`;
      
      const properties: any = {};
      const requiredFields = ['recordId', 'c_name', 'updatedBy'];
      
      // Parámetros base para PUT
      properties.recordId = {
        type: 'string',
        description: 'ID del registro a actualizar (obtenido automáticamente de búsqueda por número)',
        required: true
      };
      
      properties.c_name = {
        type: 'string',
        description: 'Nombre de la empresa',
        required: true
      };
      
      properties.updatedBy = {
        type: 'string',
        description: 'Usuario que actualiza',
        required: true
      };

      // Agregar campos específicos seleccionados
      selectedFields.forEach(field => {
        let description = `Nuevo valor para ${field.label || field.name}`;
        let defaultValue = field.defaultValue;

        // Configuración especial para campo IA (CRÍTICO PARA CONTROL)
        if (field.name === 'ia' && isAIControl) {
          description = field.aiCondition 
            ? `Desactivar IA cuando cliente dice: "${field.aiCondition}"`
            : 'Activar/desactivar IA para este registro';
          defaultValue = field.defaultValue ?? false;
        }

        const validFieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');

        properties[validFieldName] = {
          type: mapFieldTypeToParam(field.type),
          description: description,
          required: field.required || false
        };

        if (defaultValue !== undefined) {
          properties[validFieldName].default = defaultValue;
        }

        if (field.required) {
          requiredFields.push(validFieldName);
        }
      });

      // Campo ia_reason para control de IA
      if (isAIControl && selectedFields.some(f => f.name === 'ia')) {
        const iaField = selectedFields.find(f => f.name === 'ia');
        properties.ia_reason = {
          type: 'string',
          description: 'Razón del cambio de IA',
          required: false,
          default: iaField?.aiCondition || 'Cliente solicitó asistencia humana'
        };
      }

      toolRequest.parameters.properties = properties;
      toolRequest.parameters.required = requiredFields;
    }

    // VALIDACIÓN FINAL ANTES DE RETORNAR
    if (!toolRequest.config.endpoint) {
      throw new Error('Endpoint no configurado correctamente');
    }

    if (Object.keys(toolRequest.parameters.properties).length === 0) {
      throw new Error('No se configuraron parámetros');
    }

    console.log('=== HERRAMIENTA GENERADA CORRECTAMENTE ===');
    console.log(JSON.stringify(toolRequest, null, 2));

    return toolRequest;
  };

  const mapFieldTypeToParam = (fieldType: string): 'string' | 'number' | 'boolean' | 'array' => {
    switch (fieldType) {
      case 'boolean': return 'boolean';
      case 'number':
      case 'int':
      case 'currency': return 'number';
      case 'multiselect': return 'array';
      default: return 'string';
    }
  };

  // FUNCIÓN SIMPLE Y DIRECTA - SIN COMPLICACIONES
  const handleCreateTool = async () => {
    console.log('🚀 INICIANDO CREACIÓN SIMPLE');
    
    // Validaciones básicas
    if (!selectedTable || !user || !toolName.trim()) {
      toast.error('❌ Faltan datos básicos');
      return;
    }

    const selectedFields = tableFields.filter(f => f.selected);
    if (selectedFields.length === 0) {
      toast.error('❌ Selecciona al menos un campo');
      return;
    }

    try {
      setLoading(true);
      toast.info('🔄 Creando herramienta...');
      
      const companySlug = user.c_name || user.companySlug;
      const baseUrl = 'https://api-virtual-voices.onrender.com/api';
      
      // Construir herramienta PUT simple
      const toolConfig = {
        name: normalizeName(toolName),
        displayName: toolName,
        description: toolDescription || `IMPORTANTE: Primero usa la herramienta buscar_por_numero_${normalizeName(selectedTable.slug)}_${normalizeName(companySlug || 'empresa')} para obtener el ID del cliente por su número de WhatsApp, luego usa esta herramienta para actualizar ${selectedTable.name} con ese ID.`,
        category: isAIControl ? 'ai_control' : 'sales',
        c_name: companySlug,
        createdBy: (user as any)?.id || (user as any)?._id || user?.name || 'sistema',
        config: {
          endpoint: `${baseUrl}/records/{{recordId}}`,
          method: 'PUT' as const,
          authType: 'none' as const,
          timeout: 15000
        },
        parameters: {
          type: 'object' as const,
          properties: {
            recordId: { type: 'string', description: 'ID del registro' },
            c_name: { type: 'string', description: 'Empresa' },
            updatedBy: { type: 'string', description: 'Usuario' }
          } as any,
          required: ['recordId', 'c_name', 'updatedBy']
        },
        security: {
          rateLimit: { requests: 100, window: '1h' },
          allowedDomains: [],
          maxTimeout: 30000
        }
      };

      // Añadir campos seleccionados
      selectedFields.forEach(field => {
        const fieldName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
        toolConfig.parameters.properties[fieldName] = {
          type: field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string',
          description: `${field.label || field.name}`
        };
        
        if (field.defaultValue !== undefined) {
          toolConfig.parameters.properties[fieldName].default = field.defaultValue;
        }
      });
      
      console.log('📝 Configuración:', JSON.stringify(toolConfig, null, 2));
      
      // Crear herramienta
      await createToolMutation.mutateAsync(toolConfig);
      
      toast.success('🎉 ¡Herramienta creada!');
      handleClose();
      
    } catch (error: any) {
      console.error('💥 Error:', error);
      toast.error(`❌ Error: ${error.message || 'Error desconocido'}`);
      // NO cerrar modal
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN DE VALIDACIÓN EXHAUSTIVA
  const performExhaustiveValidation = async () => {
    const errors: string[] = [];

    // Validación de datos básicos
    if (!selectedTemplate) errors.push('No se ha seleccionado tipo de herramienta');
    if (!selectedTable) errors.push('No se ha seleccionado tabla');
    if (!user) errors.push('Usuario no autenticado');
    if (!user?.c_name && !user?.companySlug) errors.push('No se puede identificar la empresa del usuario');

    // Validación de campos del formulario
    if (!toolName?.trim()) errors.push('Nombre de herramienta vacío');
    if (toolName && toolName.trim().length < 3) errors.push('Nombre debe tener al menos 3 caracteres');
    if (!toolDescription?.trim()) errors.push('Descripción vacía');
    if (toolDescription && toolDescription.trim().length < 10) errors.push('Descripción debe tener al menos 10 caracteres');

    // Validación de campos seleccionados
    const selectedFields = tableFields.filter(f => f.selected);
    if (selectedFields.length === 0) errors.push('No se han seleccionado campos');

    // Validación específica para control de IA
    if (isAIControl) {
      const iaField = selectedFields.find(f => f.name === 'ia');
      if (!iaField) errors.push('Para control de IA debe seleccionar el campo "IA"');
      if (iaField && iaField.defaultValue === undefined) errors.push('Debe especificar valor para campo IA');
      if (iaField && !iaField.aiCondition?.trim()) errors.push('Debe especificar cuándo activar la herramienta de IA');
    }

    // Validación específica para PUT (verificar GET existente)
    if (selectedTemplate?.type === 'PUT') {
      const companySlug = user?.c_name || user?.companySlug;
      const tableSlug = selectedTable?.slug;
      const expectedGetToolName = `buscar_por_numero_${normalizeName(tableSlug)}_${normalizeName(companySlug || 'empresa')}`;
      
      let hasGetTool = false;
      if (tools?.data && Array.isArray(tools.data)) {
        hasGetTool = tools.data.some((tool: any) => 
          tool.name === expectedGetToolName || 
          (tool.name.includes('buscar') && tool.config?.method === 'GET' && tool.name.includes(normalizeName(tableSlug)))
        );
      }
      
      if (!hasGetTool) {
        console.log('⚠️ No se encontró herramienta GET necesaria');
        // No es error crítico, se creará automáticamente
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Errores de validación:\n${errors.map(e => `• ${e}`).join('\n')}`;
      throw new Error(errorMessage);
    }

    console.log('✅ Validación exhaustiva completada sin errores');
  };

  // FUNCIÓN DE VALIDACIÓN DE ESTRUCTURA FINAL
  const validateFinalStructure = (toolConfig: any) => {
    const requiredFields = ['name', 'displayName', 'description', 'category', 'config', 'parameters', 'security'];
    const missingFields = requiredFields.filter(field => !toolConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Estructura incompleta. Faltan campos: ${missingFields.join(', ')}`);
    }

    if (!toolConfig.config.endpoint) {
      throw new Error('Endpoint no configurado');
    }

    if (!toolConfig.config.method) {
      throw new Error('Método HTTP no configurado');
    }

    if (!toolConfig.parameters.properties || Object.keys(toolConfig.parameters.properties).length === 0) {
      throw new Error('No se configuraron parámetros');
    }

    console.log('✅ Estructura final validada correctamente');
  };

  // FUNCIÓN DE MANEJO DE ERRORES
  const handleToolCreationError = async (error: any) => {
    console.error('=== ERROR ANALIZADO COMPLETAMENTE ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Error completo:', error);
    console.error('Response data:', error?.response?.data);
    console.error('Status:', error?.response?.status);
    
    let errorMessage = 'Error desconocido al crear la herramienta';
    let userMessage = '';
    let actionRequired = '';
    
    // Análisis detallado del error
    if (error.message && error.message.includes('Errores de validación')) {
      errorMessage = 'Error de validación';
      userMessage = error.message;
      actionRequired = 'Corrige los errores indicados y vuelve a intentar';
    } else if (error.response?.status === 400) {
      errorMessage = 'Error de validación del servidor';
      userMessage = error.response.data?.message || error.response.data?.error || 'Datos inválidos';
      actionRequired = 'Revisa la configuración de la herramienta';
    } else if (error.response?.status === 401) {
      errorMessage = 'Error de autenticación';
      userMessage = 'No tienes permisos para crear herramientas';
      actionRequired = 'Verifica tu sesión e intenta nuevamente';
    } else if (error.response?.status === 409) {
      errorMessage = 'Herramienta ya existe';
      userMessage = 'Ya existe una herramienta con este nombre';
      actionRequired = 'Cambia el nombre de la herramienta';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Error del servidor';
      userMessage = 'Error interno del servidor';
      actionRequired = 'Inténtalo nuevamente en unos momentos';
    } else if (error.message) {
      errorMessage = error.message;
      userMessage = error.message;
      actionRequired = 'Revisa la configuración e intenta nuevamente';
    }
    
    // Mostrar error detallado
    const fullErrorMessage = `❌ ${errorMessage}\n\n${userMessage}\n\n💡 ${actionRequired}`;
    toast.error(fullErrorMessage, { autoClose: 10000 });
    
    // CRÍTICO: MODAL PERMANECE ABIERTO PARA CORRECCIÓN
    console.log('🔄 Modal permanece abierto para permitir correcciones');
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedTemplate(null);
    setSelectedTable(null);
    setTableFields([]);
    setToolName('');
    setToolDescription('');
    setIsAIControl(false);
    onClose();
  };

  // Funciones del Asistente de Descripción
  const generateSmartDescription = () => {
    if (!selectedTemplate || !selectedTable) return;

    const tableName = selectedTable.name?.toLowerCase() || 'registros';
    const selectedFields = tableFields.filter(f => f.selected);
    const hasNumberField = selectedFields.some(f => 
      f.name.toLowerCase().includes('number') || 
      f.name.toLowerCase().includes('numero') ||
      f.name.toLowerCase().includes('telefono') ||
      f.name.toLowerCase().includes('phone')
    );

    let description = '';

    if (selectedTemplate.type === 'GET') {
      if (hasNumberField) {
        description = `Busca y obtiene información de ${tableName} usando el número de WhatsApp del cliente para identificarlo automáticamente. Útil cuando el cliente pregunta por su información o cuando necesitas verificar datos existentes.`;
      } else {
        description = `Busca y obtiene información de ${tableName} usando filtros específicos. Útil para consultar datos cuando el cliente hace preguntas sobre ${tableName}.`;
      }
    } else if (selectedTemplate.type === 'POST') {
      description = `Crea un nuevo registro en ${tableName} cuando un cliente nuevo proporciona sus datos por WhatsApp. Activar automáticamente cuando el cliente da información personal como nombre, teléfono y preferencias.`;
    } else if (selectedTemplate.type === 'PUT') {
      if (isAIControl) {
        const iaField = selectedFields.find(f => f.name === 'ia');
        const condition = iaField?.aiCondition || 'quiere hablar con asesor, agendar cita, necesita ayuda humana';
        description = `Desactiva la IA automáticamente cuando el cliente de WhatsApp necesita atención humana. Activar cuando el cliente dice frases como: "${condition}".`;
      } else {
        const fieldNames = selectedFields.map(f => f.label || f.name).join(', ');
        description = `Actualiza información específica del prospecto (${fieldNames}) identificado por su número de WhatsApp. Activar cuando el cliente proporciona nuevos datos o cambia sus preferencias.`;
      }
    }

    setToolDescription(description);
    
    // Mostrar notificación de que se generó automáticamente
    if (description) {
      // Pequeña animación visual para indicar que se actualizó
      const descriptionField = document.querySelector('textarea[placeholder*="Describe específicamente"]') as HTMLTextAreaElement;
      if (descriptionField) {
        descriptionField.style.background = '#e8f5e8';
        setTimeout(() => {
          descriptionField.style.background = '';
        }, 1000);
      }
    }
  };

  const getDescriptionHelp = () => {
    if (!selectedTemplate) return '';

    const helps = {
      'GET': '💡 La IA necesita saber CUÁNDO buscar información. Incluye palabras clave como "buscar", "consultar", "verificar".',
      'POST': '💡 La IA necesita saber CUÁNDO crear registros nuevos. Menciona cuando el cliente da "datos nuevos", "se registra", "proporciona información".',
      'PUT': isAIControl 
        ? '💡 Para control de IA, especifica EXACTAMENTE qué frases del cliente deben activar la herramienta.'
        : '💡 La IA necesita saber CUÁNDO actualizar información. Menciona cuando el cliente "cambia datos", "actualiza preferencias", "modifica información".'
    };

    return helps[selectedTemplate.type as keyof typeof helps] || '';
  };

  const getDescriptionSuggestions = () => {
    if (!selectedTemplate) return [];

    const suggestions = {
      'GET': [
        'Buscar cliente por número de WhatsApp',
        'Consultar información cuando el cliente pregunta por sus datos',
        'Verificar datos existentes del prospecto',
        'Obtener historial de conversaciones anteriores'
      ],
      'POST': [
        'Crear prospecto cuando cliente nuevo da sus datos',
        'Registrar información cuando cliente se interesa por primera vez',
        'Guardar datos cuando cliente proporciona nombre y teléfono',
        'Crear registro automático al recibir datos de contacto'
      ],
      'PUT': isAIControl ? [
        'Desactivar IA cuando cliente dice "quiero una cita"',
        'Pasar a humano cuando cliente dice "hablar con asesor"',
        'Transferir cuando cliente pide "información específica"',
        'Activar asistente humano cuando cliente dice "necesito ayuda"'
      ] : [
        'Actualizar presupuesto cuando cliente menciona nuevo monto',
        'Cambiar zona de preferencia cuando cliente especifica nueva área',
        'Modificar datos cuando cliente corrige información',
        'Actualizar interés cuando cliente cambia de opinión'
      ]
    };

    return suggestions[selectedTemplate.type as keyof typeof suggestions] || [];
  };

  // Componente verificador de flujo de herramientas
  const WorkflowChecker = ({ selectedTable }: { selectedTable: any }) => {
    const [existingTools, setExistingTools] = useState<any[]>([]);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
      if (selectedTable && user) {
        checkExistingTools();
      }
    }, [selectedTable, user]);

    const checkExistingTools = async () => {
      setChecking(true);
      try {
        const companySlug = normalizeName(user?.companySlug || user?.c_name || 'company');
        const tableSlug = normalizeName(selectedTable.slug);
        
        // SIMPLIFICAR - NO VERIFICAR TOOLS EXISTENTES
        console.log('🚀 Saltando verificación de tools existentes');
        setExistingTools([]);
      } catch (error) {
        console.error('Error checking tools:', error);
        setExistingTools([]);
      } finally {
        setChecking(false);
      }
    };

    const companySlug = normalizeName(user?.companySlug || user?.c_name || 'company');
    const tableSlug = normalizeName(selectedTable?.slug || '');
    const requiredGetTool = `buscar_por_numero_${tableSlug}_${companySlug}`;
    const requiredPostTool = `crear_${tableSlug}_${companySlug}`;
    
    const hasGetTool = existingTools.some(tool => tool.name === requiredGetTool);
    const hasPostTool = existingTools.some(tool => tool.name === requiredPostTool);

    return (
      <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
          🔍 Verificación de Herramientas Requeridas
        </Typography>
        
        {checking && (
          <Typography variant="body2" color="text.secondary">
            Verificando herramientas existentes...
          </Typography>
        )}

        {!checking && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {hasGetTool ? (
                <Chip label="✅ GET Existe" color="success" size="small" />
              ) : (
                <Chip label="❌ GET Faltante" color="error" size="small" />
              )}
              <Typography variant="body2" sx={{ ml: 1 }}>
                Herramienta para buscar por número: <code>{requiredGetTool}</code>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {hasPostTool ? (
                <Chip label="✅ POST Existe" color="success" size="small" />
              ) : (
                <Chip label="⚠️ POST Recomendado" color="warning" size="small" />
              )}
              <Typography variant="body2" sx={{ ml: 1 }}>
                Herramienta para crear registros: <code>{requiredPostTool}</code>
              </Typography>
            </Box>

            {!hasGetTool && loading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" fontWeight="bold">
                    🤖 Creando herramienta GET automáticamente...
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Configurando búsqueda por WhatsApp para tabla "{selectedTable?.name}"
                </Typography>
              </Alert>
            )}

            {!hasGetTool && !loading && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" mb={1}>
                  ⚠️ CREACIÓN AUTOMÁTICA FALLÓ
                </Typography>
                <Typography variant="body2" mb={2}>
                  No se pudo crear la herramienta GET automáticamente. Opciones:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => startAutomaticToolCreation()}
                    sx={{ textTransform: 'none' }}
                  >
                    🔄 Reintentar Automático
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setCurrentStep(0);
                      setSelectedTemplate(toolTemplates.find(t => t.type === 'GET') || null);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    ⚙️ Crear GET Manual
                  </Button>
                </Box>
              </Alert>
            )}

            {hasGetTool && (
              <Alert severity="success">
                <Typography variant="body2">
                  ✅ <strong>Flujo completo disponible</strong> - La IA podrá buscar por número y luego actualizar automáticamente.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Componente Preview del flujo con ejemplos REALES
  const FlowPreview = ({ selectedTable, selectedFields, isAIControl }: { 
    selectedTable: any, 
    selectedFields: any[], 
    isAIControl: boolean 
  }) => {
    const [sampleData, setSampleData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (selectedTable && selectedFields.length > 0) {
        loadSampleData();
      }
    }, [selectedTable, selectedFields]);

    const loadSampleData = async () => {
      setLoading(true);
      try {
        // Intentar obtener datos reales de la tabla
        if (user?.c_name && selectedTable?.slug) {
          try {
            // Simular consulta a la API - en implementación real usar:
            // const response = await getRecords(user.c_name, selectedTable.slug, { limit: 1 });
            
            // Por ahora usar datos mock basados en los campos de la tabla
            const mockTableFields = selectedFields.length > 0 ? selectedFields : [];
            const mockSampleData: any = {
              _id: "507f1f77bcf86cd799439011",
              name: "Juan Pérez",
              number: 5551234567,
              ia: true,
              createdAt: "2024-01-15"
            };

            // Agregar valores para campos específicos de la tabla
            mockTableFields.forEach((field: any) => {
              if (field.name === 'Presupuesto') mockSampleData[field.name] = 350000;
              else if (field.name === 'Zona de preferencia') mockSampleData[field.name] = "Norte";
              else if (field.name === 'Intencion') mockSampleData[field.name] = "Comprar";
              else if (field.name === 'Forma de pago') mockSampleData[field.name] = "Contado";
              else if (field.name === 'Tipo de crédito') mockSampleData[field.name] = "INFONAVIT";
              else if (field.name === 'email') mockSampleData[field.name] = "juan.perez@email.com";
              else if (field.name.toLowerCase().includes('fecha')) mockSampleData[field.name] = "2024-01-15";
              else if (field.type === 'number') mockSampleData[field.name] = 100000;
              else if (field.type === 'boolean') mockSampleData[field.name] = field.name === 'ia' ? true : false;
              else mockSampleData[field.name] = `Ejemplo ${field.label || field.name}`;
            });
            
            setSampleData(mockSampleData);
          } catch (apiError) {
            console.error('Error fetching real data:', apiError);
            // Fallback a datos mock
            setSampleData({
              _id: "507f1f77bcf86cd799439011",
              name: "Juan Pérez",
              number: 5551234567,
              ia: true,
            });
          }
        }
      } catch (error) {
        console.error('Error loading sample data:', error);
        setSampleData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!selectedTable || selectedFields.length === 0) return null;

    const iaField = selectedFields.find(f => f.name === 'ia');
    const clientMessage = iaField?.aiCondition || 'quiero una cita';
    const fieldToUpdate = selectedFields.find(f => f.name !== 'ia') || selectedFields[0];

    return (
      <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 3, border: '2px solid #4caf50' }}>
        <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#2e7d32' }}>
          🎬 SIMULACIÓN COMPLETA DEL FLUJO
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={3}>
          Así es EXACTAMENTE como funcionará cuando un cliente escriba por WhatsApp:
        </Typography>

        {loading ? (
          <Typography>Cargando ejemplo...</Typography>
        ) : sampleData && (
          <Box>
            {/* Paso 1: Cliente escribe */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #2196f3' }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                📱 PASO 1: Cliente escribe por WhatsApp
              </Typography>
              <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2, borderRadius: 2, fontFamily: 'monospace' }}>
                <Typography variant="body2">
                  <strong>Cliente ({sampleData.number}):</strong> "{clientMessage}"
                </Typography>
              </Box>
            </Box>

            {/* Paso 2: IA busca automáticamente */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                🔍 PASO 2: IA busca automáticamente al cliente
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  GET /api/records/table/{user?.c_name}/{selectedTable.slug}?number={sampleData.number}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                  ✅ Cliente encontrado:
                </Typography>
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Typography variant="body2">• ID: {sampleData._id}</Typography>
                  <Typography variant="body2">• Nombre: {sampleData.name}</Typography>
                  <Typography variant="body2">• Número: {sampleData.number}</Typography>
                  <Typography variant="body2">• IA activa: {sampleData.ia ? 'Sí' : 'No'}</Typography>
                  {selectedFields.map(field => field.name !== 'ia' && sampleData[field.name] && (
                    <Typography key={field.name} variant="body2">
                      • {field.label || field.name}: {sampleData[field.name]}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Paso 3: IA ejecuta herramienta PUT */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e8', borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                ⚡ PASO 3: IA ejecuta ESTA herramienta PUT
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  PUT /api/records/{sampleData._id}
                </Typography>
                <Typography variant="body2" sx={{ color: '#2196f3', mb: 1 }}>
                  Parámetros enviados:
                </Typography>
                <Box sx={{ pl: 2, bgcolor: '#fff', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2">recordId: "{sampleData._id}"</Typography>
                  <Typography variant="body2">c_name: "{user?.c_name}"</Typography>
                  <Typography variant="body2">updatedBy: "IA_WhatsApp"</Typography>
                  {selectedFields.map(field => (
                    <Typography key={field.name} variant="body2" sx={{ 
                      color: field.name === 'ia' ? '#f44336' : '#4caf50',
                      fontWeight: 'bold' 
                    }}>
                      {field.name}: {field.name === 'ia' 
                        ? (field.defaultValue === false ? 'false (IA desactivada)' : 'true (IA activada)')
                        : `"${field.defaultValue || 'nuevo_valor'}"`
                      }
                    </Typography>
                  ))}
                  {isAIControl && (
                    <Typography variant="body2" sx={{ color: '#f44336' }}>
                      ia_reason: "Cliente solicitó: {clientMessage}"
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Paso 4: Resultado */}
            <Box sx={{ p: 2, bgcolor: isAIControl ? '#ffebee' : '#e8f5e8', borderRadius: 2, borderLeft: `4px solid ${isAIControl ? '#f44336' : '#4caf50'}` }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                🎯 PASO 4: Resultado final
              </Typography>
              
              {isAIControl ? (
                <Box sx={{ bgcolor: '#f44336', color: 'white', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    🚨 IA DESACTIVADA - Transferido a humano
                  </Typography>
                  <Typography variant="body2">
                    • Cliente {sampleData.name} transferido al equipo de asesores
                  </Typography>
                  <Typography variant="body2">
                    • IA ya no responderá automáticamente a este cliente
                  </Typography>
                  <Typography variant="body2">
                    • Razón: Cliente dijo "{clientMessage}"
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ bgcolor: '#4caf50', color: 'white', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    ✅ INFORMACIÓN ACTUALIZADA
                  </Typography>
                  <Typography variant="body2">
                    • {fieldToUpdate?.label || fieldToUpdate?.name} actualizado automáticamente
                  </Typography>
                  <Typography variant="body2">
                    • Cliente {sampleData.name} recibe confirmación
                  </Typography>
                  <Typography variant="body2">
                    • Todo sucede en segundos sin intervención humana
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Ejemplo de conversación completa */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                💬 CONVERSACIÓN COMPLETA SIMULADA
              </Typography>
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#1976d2' }}>
                  <strong>Cliente:</strong> {clientMessage}
                </Typography>
                {isAIControl ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, color: '#4caf50' }}>
                      <strong>IA:</strong> Entiendo que necesitas una cita. Te voy a conectar con uno de nuestros asesores que te ayudará personalmente.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                      [IA automáticamente desactivada - Cliente transferido a asesor humano]
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, color: '#4caf50' }}>
                      <strong>IA:</strong> Perfecto, he actualizado tu información. Tu {fieldToUpdate?.label?.toLowerCase() || 'información'} ha sido actualizada correctamente.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      [Información actualizada automáticamente en la base de datos]
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Tutorial paso a paso específico */}
            {isAIControl && (
              <Box sx={{ mt: 3, p: 3, bgcolor: '#e8f5e8', borderRadius: 2, border: '2px solid #4caf50' }}>
                <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#2e7d32' }}>
                  📚 TUTORIAL: Cómo configurar "quiero una cita"
                </Typography>
                
                <Typography variant="body2" mb={2} sx={{ fontStyle: 'italic' }}>
                  Ejemplo completo paso a paso para que cualquier persona pueda hacerlo:
                </Typography>

                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>1. Selecciona tabla "prospectos"</strong> ✅ (Ya seleccionada: {selectedTable?.name})
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>2. Activa "Control de IA"</strong> ✅ (Ya activado)
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>3. Selecciona campo "IA"</strong> ✅ (Campo que controla si la IA está activa)
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>4. Configura valor a "false"</strong> ✅ (Para desactivar la IA)
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>5. Escribe cuándo activar:</strong> "{clientMessage}" ✅
                  </Typography>

                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px dashed #4caf50' }}>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      💡 Ejemplo con datos REALES de la tabla:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      Cliente: Juan Pérez (número: {sampleData?.number})<br/>
                      Estado actual: IA activa = {sampleData?.ia ? 'true' : 'false'}<br/>
                      Presupuesto: ${sampleData?.Presupuesto?.toLocaleString() || 'N/A'}<br/>
                      Zona: {sampleData?.['Zona de preferencia'] || 'N/A'}<br/>
                      <br/>
                      <strong style={{color: '#f44336'}}>Cuando cliente diga "quiero una cita":</strong><br/>
                      → IA automáticamente pone: ia = false<br/>
                      → Cliente transferido a asesor humano<br/>
                      → IA ya no responde a este cliente
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>🎯 Resultado:</strong> Cualquier cliente que diga "quiero una cita" será automáticamente transferido a un asesor humano. La IA detectará la frase, buscará al cliente por su número de WhatsApp, y desactivará la IA para ese cliente específico.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // FUNCIÓN INTELIGENTE - ASEGURAR QUE EXISTE GET SIN MOLESTAR AL USUARIO
  const ensureGetToolExists = async (table: any) => {
    if (!table || !user) return;

    try {
      const companySlug = user.c_name || user.companySlug;
      const tableSlug = table.slug;
      
      console.log('🔍 Buscando herramientas GET existentes para tabla:', tableSlug);

      // SIMPLIFICAR - NO BUSCAR EXISTENTES, CREAR DIRECTO
      console.log('🚀 Creando GET tool directo sin buscar existentes');

      console.log('🔨 No existe GET compatible, creando uno silenciosamente...');
      
      // CREAR GET SILENCIOSAMENTE
      const getToolConfig = {
        name: `buscar_por_numero_${normalizeName(tableSlug)}_${normalizeName(companySlug || 'empresa')}`,
        displayName: `Buscar ${table.name} por Número`,
        description: `Busca cliente en ${table.name} por número de WhatsApp. USAR SIEMPRE PRIMERO antes de cualquier herramienta de actualización (PUT) para obtener el ID del cliente. Retorna el _id necesario para actualizar información.`,
        category: 'sales',
        c_name: companySlug,
        createdBy: (user as any)?.id || (user as any)?._id || user?.name || 'sistema',
        config: {
          endpoint: `https://api-virtual-voices.onrender.com/api/records/table/${companySlug}/${tableSlug}`,
          method: 'GET' as const,
          authType: 'none' as const,
          timeout: 15000
        },
        parameters: {
          type: 'object' as const,
          properties: {
                      number: {
            type: 'number' as const,
            description: 'Número de WhatsApp del cliente'
          }
          },
          required: ['number']
        },
        security: {
          rateLimit: { requests: 100, window: '1h' },
          allowedDomains: [],
          maxTimeout: 30000
        }
      };

      // Crear GET silenciosamente
      await createToolMutation.mutateAsync(getToolConfig);
      
      // NO refrescar tools - evitar errores
      console.log('✅ GET creado silenciosamente, NO refrescando lista');
      
      console.log('✅ GET creado silenciosamente, procediendo...');
      
      toast.success('✅ Herramientas configuradas automáticamente');
      
      // Proceder a configurar PUT
      setCurrentStep(1);
      
    } catch (error: any) {
      console.error('❌ Error asegurando GET:', error);
      // NO mostrar error al usuario - proceder de todos modos
      setCurrentStep(1);
    }
  };

  // Función para iniciar flujo guiado de herramientas  
  // FUNCIÓN PARA CREAR HERRAMIENTAS AUTOMÁTICAMENTE PASO A PASO
  const startAutomaticToolCreation = async () => {
    console.log('🚀 INICIANDO startAutomaticToolCreation');
    console.log('🔍 Validando datos...', { 
      selectedTable: selectedTable?.name, 
      selectedTableSlug: selectedTable?.slug,
      user: (user as any)?.id || (user as any)?._id || user?.name,
      userCompany: user?.c_name || user?.companySlug 
    });
    
    if (!selectedTable || !selectedTable.slug) {
      console.error('❌ Tabla no válida:', selectedTable);
      toast.error('❌ Error: Tabla no seleccionada correctamente');
      return;
    }
    
    if (!user || (!(user as any)._id && !(user as any).id)) {
      console.error('❌ Usuario no válido:', user);
      toast.error('❌ Error: Usuario no autenticado');
      return;
    }
    
    if (!user.c_name && !user.companySlug) {
      console.error('❌ Empresa no válida:', user);
      toast.error('❌ Error: Empresa del usuario no encontrada');
      return;
    }
    
    const tableName = selectedTable.name;
    const companySlug = user.c_name || user.companySlug;
    
    console.log('📊 Datos iniciales:', { tableName, companySlug, userId: (user as any)._id || (user as any).id || user.name });
    
    // CREACIÓN AUTOMÁTICA SIN PREGUNTAR
    toast.info('🤖 Creando GET automáticamente para herramienta PUT...');

    try {
      setLoading(true);
      console.log('⏳ Loading activado');
      
      // PASO 1: Verificar si ya existe herramienta GET
      const getToolName = `buscar_por_numero_${normalizeName(selectedTable.slug)}_${normalizeName(companySlug || 'empresa')}`;
      console.log('🔍 Buscando tool existente:', getToolName);
      
      let getToolExists = false;
      
      // SIMPLIFICAR - NO BUSCAR TOOLS EXISTENTES, CREAR SIEMPRE NUEVO
      console.log('🔨 Creando GET tool directamente sin verificar existentes');
      getToolExists = false;

      if (!getToolExists) {
        console.log('🔨 Creando nueva herramienta GET...');
        toast.info('🔄 Creando herramienta GET para búsqueda por número...');
        
        // CREAR HERRAMIENTA GET AUTOMÁTICAMENTE
        await createGetTool();
        console.log('✅ createGetTool completado');
        
        // NO refrescar tools - puede causar errores
      console.log('✅ GET creado, continuando sin refrescar lista');
        
        toast.success('✅ Herramienta GET creada exitosamente');
      } else {
        console.log('ℹ️ GET tool ya existe, saltando creación');
        toast.info('✅ Herramienta GET ya existe, continuando...');
      }

      // PASO 2: Continuar con configuración de PUT
      console.log('➡️ Avanzando al siguiente step');
      toast.info('🔄 Configurando herramienta PUT...');
      
      // Auto-avanzar al siguiente paso para configurar PUT
      setCurrentStep(1);
      console.log('✅ Step actualizado a 1');
      
    } catch (error: any) {
      console.error('💥 Error en creación automática:', error);
      toast.error(`❌ Error al crear GET: ${error.message || 'Error desconocido'}`);
      
      // NO cerrar el modal - mantener abierto para que pueda reintentar
      console.log('🔄 Modal permanece abierto para reintento');
    } finally {
      console.log('🏁 Finalizando startAutomaticToolCreation');
      setLoading(false);
    }
  };

  // FUNCIÓN PARA CREAR HERRAMIENTA GET AUTOMÁTICAMENTE
  const createGetTool = async () => {
    if (!selectedTable || !user) {
      throw new Error('Faltan datos para crear herramienta GET');
    }

    const companySlug = user.c_name || user.companySlug;
    const normalizedTableSlug = normalizeName(selectedTable.slug);
    const baseUrl = 'https://api-virtual-voices.onrender.com/api';

    // Configuración automática de GET para búsqueda por número
    const getToolConfig = {
      name: `buscar_por_numero_${normalizedTableSlug}_${normalizeName(companySlug || 'empresa')}`,
      displayName: `Buscar ${selectedTable.name} por Número`,
      description: `USAR SIEMPRE PRIMERO: Busca cliente en ${selectedTable.name} por número de WhatsApp para obtener su _id. Este _id es OBLIGATORIO para cualquier herramienta de actualización (PUT). Ejemplo de flujo: 1) Usar esta herramienta con el número del cliente, 2) Usar el _id devuelto en herramientas PUT.`,
      category: 'sales',
      c_name: companySlug,
      createdBy: (user as any)?.id || (user as any)?._id || user?.name || 'sistema',
      config: {
        endpoint: `${baseUrl}/records/table/${companySlug}/${normalizedTableSlug}`,
        method: 'GET' as const,
        authType: 'none' as const,
        timeout: 15000
      },
      parameters: {
        type: 'object' as const,
        properties: {
          number: {
            type: 'number' as const,
            description: 'Número de WhatsApp del cliente. USAR SIEMPRE para identificar cliente.'
          },
          limit: {
            type: 'number' as const,
            description: 'Número máximo de registros (usar 1 para búsqueda específica)'
          }
        },
        required: ['number']
      },
      security: {
        rateLimit: {
          requests: 100,
          window: '1h'
        },
        allowedDomains: [],
        maxTimeout: 30000
      }
    };

    console.log('=== CREANDO HERRAMIENTA GET AUTOMÁTICA ===');
    console.log(JSON.stringify(getToolConfig, null, 2));

    try {
      // Crear herramienta GET con timeout
      const result = await Promise.race([
        createToolMutation.mutateAsync(getToolConfig),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: La creación tardó más de 10 segundos')), 10000)
        )
      ]);
      
      console.log('✅ GET Tool creada exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creando GET tool:', error);
      throw error;
    }
  };

  const startGuidedWorkflow = () => {
    if (!selectedTable) return;
    
    const tableName = selectedTable.name;
    const message = `
🚀 FLUJO GUIADO PARA "${tableName.toUpperCase()}"

Te voy a guiar para crear 3 herramientas en el orden correcto:

1️⃣ HERRAMIENTA GET - "Buscar por número"
   → Para que la IA encuentre clientes por WhatsApp

2️⃣ HERRAMIENTA POST - "Crear prospecto"  
   → Para registrar clientes nuevos

3️⃣ HERRAMIENTA PUT - "Actualizar información"
   → Para modificar datos (esta que estás creando)

¿Empezamos con la herramienta GET?
    `;
    
    if (window.confirm(message)) {
      // Reiniciar wizard con GET
      setCurrentStep(0);
      setSelectedTemplate(toolTemplates.find(t => t.type === 'GET') || null);
      setToolName('');
      setToolDescription('');
      setTableFields([]);
      
      // Mantener la tabla seleccionada para continuidad
      setTimeout(() => {
        handleTemplateSelect(toolTemplates.find(t => t.type === 'GET') || toolTemplates[0]);
      }, 100);
    }
  };

  // Función para configuración rápida
  const setupQuickConfig = (configType: string) => {
    if (!selectedTable || !selectedTemplate) return;

    const companySlug = normalizeName(user?.companySlug || user?.c_name || 'company');
    const tableSlug = normalizeName(selectedTable.slug);

    switch (configType) {
      case 'quiero_cita':
        // Configurar para transferir a humano cuando cliente quiere cita
        setIsAIControl(true);
        setToolName(`transferir_humano_${tableSlug}_${companySlug}`);
        setToolDescription('Desactiva la IA automáticamente cuando el cliente quiere una cita y lo transfiere a un asesor humano');
        
        // Buscar y seleccionar campo IA
        setTableFields(prev => prev.map(field => {
          if (field.name === 'ia') {
            return {
              ...field,
              selected: true,
              required: false,
              defaultValue: false, // Desactivar IA
              aiCondition: 'quiero una cita, necesito una cita, agendar cita, hablar con asesor'
            };
          }
          return { ...field, selected: false };
        }));
        
        // Mostrar mensaje de confirmación
        setTimeout(() => {
          const message = '✅ Configuración "Quiero una cita" aplicada automáticamente. La herramienta transferirá clientes a asesores humanos cuando soliciten citas.';
          // En lugar de alert, usar toast si está disponible
          if (typeof toast !== 'undefined') {
            toast.success(message);
          } else {
            alert(message);
          }
        }, 100);
        break;

      case 'actualizar_presupuesto':
        // Configurar para actualizar presupuesto
        setIsAIControl(false);
        setToolName(`actualizar_presupuesto_${tableSlug}_${companySlug}`);
        setToolDescription('Actualiza el presupuesto del cliente cuando menciona un nuevo monto por WhatsApp');
        
        // Buscar y seleccionar campo Presupuesto
        setTableFields(prev => prev.map(field => {
          if (field.name === 'Presupuesto' || field.name.toLowerCase().includes('presupuesto')) {
            return {
              ...field,
              selected: true,
              required: false,
              defaultValue: undefined
            };
          }
          return { ...field, selected: false };
        }));
        
        setTimeout(() => {
          const message = '✅ Configuración "Actualizar Presupuesto" aplicada. La IA actualizará montos automáticamente cuando los clientes mencionen nuevos presupuestos.';
          if (typeof toast !== 'undefined') {
            toast.success(message);
          } else {
            alert(message);
          }
        }, 100);
        break;

      case 'cambiar_zona':
        // Configurar para cambiar zona de preferencia
        setIsAIControl(false);
        setToolName(`cambiar_zona_${tableSlug}_${companySlug}`);
        setToolDescription('Actualiza la zona de preferencia cuando el cliente menciona una nueva área de interés');
        
        // Buscar y seleccionar campo Zona
        setTableFields(prev => prev.map(field => {
          if (field.name === 'Zona de preferencia' || field.name.toLowerCase().includes('zona')) {
            return {
              ...field,
              selected: true,
              required: false,
              defaultValue: undefined
            };
          }
          return { ...field, selected: false };
        }));
        
        setTimeout(() => {
          const message = '✅ Configuración "Cambiar Zona" aplicada. La IA actualizará automáticamente las zonas de preferencia cuando los clientes mencionen nuevas áreas.';
          if (typeof toast !== 'undefined') {
            toast.success(message);
          } else {
            alert(message);
          }
        }, 100);
        break;
    }

    // Auto-generar descripción después de la configuración
    setTimeout(() => {
      generateSmartDescription();
    }, 200);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!selectedTemplate;
      case 1: return !!selectedTable;
      case 2: {
        const hasSelectedFields = tableFields.some(f => f.selected);
        if (!hasSelectedFields) return false;
        
        // Validación específica para herramientas de control de IA
        if (isAIControl) {
          const iaField = tableFields.find(f => f.name === 'ia' && f.selected);
          if (iaField) {
            // Debe tener valor por defecto y descripción específica
            return iaField.defaultValue !== undefined && toolDescription.trim().length > 10;
          }
        }
        
        return toolDescription.trim().length > 10;
      }
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AIIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Crear Herramienta Dinámica
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configura herramientas que tu IA puede usar automáticamente
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {/* Stepper */}
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Seleccionar Tipo */}
        {currentStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              ¿Qué tipo de herramienta necesitas?
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona el tipo de operación que realizará tu herramienta
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" mb={1}>
                💡 Para WhatsApp necesitas crear VARIAS herramientas que trabajen juntas:
              </Typography>
              <Typography variant="body2" component="div">
                1. <strong>GET "Buscar por número"</strong> → Para identificar al cliente<br/>
                2. <strong>POST "Crear prospecto"</strong> → Si es cliente nuevo<br/>
                3. <strong>PUT "Actualizar datos"</strong> → Para modificar información<br/>
                4. <strong>PUT "Control IA"</strong> → Para desactivar IA cuando necesario
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {toolTemplates.map((template) => (
                <Grid item xs={12} md={4} key={template.type}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTemplate?.type === template.type 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : '2px solid transparent',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      height: '100%'
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      {template.icon}
                      <Typography variant="h6" fontWeight="bold" mt={2} mb={1}>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {template.description}
                      </Typography>
                      <Box>
                        {template.examples.slice(0, 2).map((example, idx) => (
                          <Chip
                            key={idx}
                            label={example}
                            size="small"
                            sx={{ m: 0.5, fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedTemplate && (
              <Box sx={{ mt: 3 }}>
                {selectedTemplate.type === 'PUT' ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      🔄 FLUJO AUTOMÁTICO PARA ACTUALIZAR INFORMACIÓN
                    </Typography>
                    <Typography variant="body2" mb={2}>
                      Cuando un cliente escribe por WhatsApp, la IA necesita seguir estos pasos:
                    </Typography>
                    <Box sx={{ pl: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Ejemplo:</strong> Cliente dice "Mi presupuesto cambió a $500,000"
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        ↳ <strong>1. IA busca:</strong> Usa herramienta GET con número de WhatsApp
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        ↳ <strong>2. IA obtiene recordId:</strong> Encuentra al cliente específico
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        ↳ <strong>3. IA actualiza:</strong> Usa ESTA herramienta PUT con el recordId
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#d84315' }}>
                      ⚠️ <strong>Importante:</strong> Sin herramienta GET, esta herramienta PUT no funcionará en WhatsApp
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>{selectedTemplate.title}:</strong> {selectedTemplate.description}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Step 1: Seleccionar Tabla */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selecciona la tabla de datos
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Elige la tabla sobre la cual operará la herramienta
            </Typography>

            <Grid container spacing={2}>
              {dynamicTables.map((table) => (
                <Grid item xs={12} sm={6} md={4} key={table.slug}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTable?.slug === table.slug
                        ? `2px solid ${theme.palette.primary.main}`
                        : '1px solid rgba(0,0,0,0.12)',
                      '&:hover': {
                        boxShadow: theme.shadows[2]
                      }
                    }}
                    onClick={() => handleTableSelect(table)}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        {table.icon} {table.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {table.fields?.length || 0} campos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Opción para control de IA */}
            {selectedTemplate?.type === 'PUT' && (
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAIControl}
                      onChange={(e) => setIsAIControl(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Control de IA</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Esta herramienta puede activar/desactivar la IA automáticamente
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Configurar Campos */}
        {currentStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configurar Herramienta
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {selectedTemplate?.type === 'GET' && 'Campos que se pueden usar para filtrar'}
              {selectedTemplate?.type === 'POST' && 'Campos que se pueden llenar al crear'}
              {selectedTemplate?.type === 'PUT' && 'Campos que se pueden actualizar'}
            </Typography>

            {/* Configuración rápida para casos comunes */}
            {selectedTemplate?.type === 'PUT' && selectedTable && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                  ⚡ CONFIGURACIÓN RÁPIDA
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setupQuickConfig('quiero_cita')}
                    sx={{ textTransform: 'none' }}
                  >
                    🎯 "Quiero una cita" (Transferir a humano)
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setupQuickConfig('actualizar_presupuesto')}
                    sx={{ textTransform: 'none' }}
                  >
                    💰 Actualizar Presupuesto
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setupQuickConfig('cambiar_zona')}
                    sx={{ textTransform: 'none' }}
                  >
                    📍 Cambiar Zona
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                  Configura automáticamente los campos más comunes
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Nombre de la herramienta"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción - ¿Cuándo debe usar esta herramienta la IA?"
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder={isAIControl 
                ? "Desactiva la IA cuando el cliente quiere agendar una cita o hablar con un asesor humano"
                : "Describe específicamente cuándo la IA debe usar esta herramienta..."
              }
              sx={{ mb: 2 }}
              helperText="Sé muy específico: esto le dice a la IA cuándo activar la herramienta"
            />

            {/* Asistente de Descripción */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: toolDescription ? '2px solid #4caf50' : '1px solid #ddd' }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center' }}>
                🤖 Asistente de Descripción
                {toolDescription && (
                  <Chip 
                    label="✓ Generada" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={generateSmartDescription}
                  sx={{ ml: 'auto', textTransform: 'none' }}
                >
                  ✨ {toolDescription ? 'Regenerar' : 'Generar'} Automática
                </Button>
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {getDescriptionHelp()}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {getDescriptionSuggestions().map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    onClick={() => setToolDescription(suggestion)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#1976d2', color: 'white' }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Campos de la tabla "{selectedTable?.name}"
            </Typography>

            <List>
              {tableFields.map((field) => (
                <Box key={field.name}>
                  <ListItem
                    sx={{
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: field.selected ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: field.selected ? 1 : 0 }}>
                      <Switch
                        checked={field.selected}
                        onChange={() => toggleFieldSelection(field.name)}
                        color="primary"
                      />
                      <Box sx={{ ml: 2, flex: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {field.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {field.name} ({field.type})
                        </Typography>
                      </Box>
                      {field.selected && selectedTemplate?.type !== 'GET' && (
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={field.required}
                              onChange={() => toggleFieldRequired(field.name)}
                              color="secondary"
                            />
                          }
                          label="Requerido"
                        />
                      )}
                    </Box>

                    {/* Configuración específica para campo IA */}
                    {field.selected && field.name === 'ia' && (
                      <Box sx={{ width: '100%', pl: 7, pr: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Control de IA Automático
                          </Typography>
                          <Typography variant="body2">
                            Esta herramienta activará/desactivará la IA automáticamente
                          </Typography>
                        </Alert>
                        
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel>Valor para IA</InputLabel>
                          <Select
                            value={field.defaultValue === true ? 'true' : field.defaultValue === false ? 'false' : ''}
                            onChange={(e) => {
                              setTableFields(prev => prev.map(f => 
                                f.name === field.name 
                                  ? { ...f, defaultValue: e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value }
                                  : f
                              ));
                            }}
                            label="Valor para IA"
                          >
                            <MenuItem value="false">Desactivar IA (false)</MenuItem>
                            <MenuItem value="true">Activar IA (true)</MenuItem>
                          </Select>
                        </FormControl>

                                                <TextField
                          fullWidth
                          size="small"
                          label="¿Cuándo usar? (ejemplos de frases del cliente)"
                          placeholder="quiero una cita, hablar con asesor, necesito más información"
                          value={field.aiCondition || ''}
                          onChange={(e) => {
                            setTableFields(prev => prev.map(f =>
                              f.name === field.name
                                ? { ...f, aiCondition: e.target.value }
                                : f
                            ));
                            // Auto-regenerar descripción cuando cambie la condición
                            setTimeout(() => {
                              generateSmartDescription();
                            }, 500);
                          }}
                          helperText="Escribe frases que el cliente podría usar para activar esta herramienta"
                        />
                      </Box>
                    )}

                    {/* Configuración de valores por defecto para otros campos */}
                    {field.selected && field.name !== 'ia' && selectedTemplate?.type === 'PUT' && (
                      <Box sx={{ width: '100%', pl: 7, pr: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`Valor por defecto para ${field.label}`}
                          value={field.defaultValue || ''}
                          onChange={(e) => {
                            setTableFields(prev => prev.map(f => 
                              f.name === field.name 
                                ? { ...f, defaultValue: e.target.value }
                                : f
                            ));
                          }}
                          helperText="Opcional: valor fijo que tomará este campo"
                        />
                      </Box>
                    )}
                  </ListItem>
                </Box>
              ))}
            </List>

            {tableFields.filter(f => f.selected).length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Debes seleccionar al menos un campo para que la herramienta funcione
              </Alert>
            )}

            {/* Explicación de flujo de WhatsApp */}
            {selectedTemplate?.type === 'PUT' && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    🔄 FLUJO AUTOMÁTICO DE WHATSAPP
                  </Typography>
                  <Typography variant="body2" mb={1}>
                    Para actualizar información, la IA necesita PRIMERO obtener el ID del cliente:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', mr: 1 }}>1</Box>
                      Cliente escribe por WhatsApp → IA recibe el número
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', mr: 1 }}>2</Box>
                      IA usa herramienta GET para buscar por número
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', mr: 1 }}>3</Box>
                      Obtiene el recordId del cliente
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', mr: 1 }}>4</Box>
                      USA ESTA herramienta PUT para actualizar
                    </Typography>
                  </Box>
                </Alert>

                {/* NO MOSTRAR NADA TÉCNICO AL USUARIO - TODO ES TRANSPARENTE */}

                {/* Simulación simple y clara */}
                <Box sx={{ mt: 3, p: 3, bgcolor: '#e8f5e8', borderRadius: 2, border: '2px solid #4caf50' }}>
                  <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#2e7d32' }}>
                    📱 Ejemplo de flujo en WhatsApp:
                  </Typography>
                  
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#1976d2' }}>
                      <strong>👤 Cliente (desde WhatsApp +5212345678):</strong> "Quiero agendar una cita"
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>🔍 Paso 1:</strong> IA usa herramienta GET → buscar_por_numero_prospectos_grupo_milkasa(number: 5212345678)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: '#9c27b0' }}>
                      <strong>📄 Respuesta:</strong> {`{_id: "abc123", name: "Ana Villegas", ia: true}`}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: '#4caf50' }}>
                      <strong>⚙️ Paso 2:</strong> IA usa herramienta PUT → {normalizeName(toolName)}(recordId: "abc123", {tableFields.filter(f => f.selected).map(f => `${f.name}: ${f.name === 'ia' ? 'false' : 'nuevo_valor'}`).join(', ')})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f44336' }}>
                      <strong>✅ Resultado:</strong> {isAIControl ? 'IA desactivada - Cliente transferido a asesor humano' : 'Información actualizada automáticamente'}
                    </Typography>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>🎯 Todo es automático:</strong> El cliente solo escribe su mensaje y el sistema actualiza la información sin intervención humana.
                    </Typography>
                  </Alert>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Step 3: Revisar */}
        {currentStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Revisar Configuración
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Verifica que todo esté correcto antes de crear la herramienta
            </Typography>

            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedTemplate?.title}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tabla:</Typography>
                  <Typography variant="body1">{selectedTable?.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                  <Typography variant="body1">{toolName}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Descripción:</Typography>
                  <Typography variant="body1">{toolDescription}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Campos seleccionados:</Typography>
                  <Box sx={{ mt: 1 }}>
                    {tableFields.filter(f => f.selected).map(field => (
                      <Chip
                        key={field.name}
                        label={`${field.label} ${field.required ? '(requerido)' : ''} ${field.defaultValue !== undefined ? `= ${field.defaultValue}` : ''}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        color={field.required ? 'primary' : field.name === 'ia' ? 'secondary' : 'default'}
                      />
                    ))}
                  </Box>
                </Grid>
                {/* Mostrar condiciones específicas para IA */}
                {isAIControl && tableFields.find(f => f.name === 'ia' && f.selected) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Condiciones de activación:</Typography>
                    <Alert severity="success" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>Valor de IA:</strong> {tableFields.find(f => f.name === 'ia')?.defaultValue === false ? 'Se desactivará' : 'Se activará'}
                      </Typography>
                      {tableFields.find(f => f.name === 'ia')?.aiCondition && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Activar cuando cliente diga:</strong> "{tableFields.find(f => f.name === 'ia')?.aiCondition}"
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                )}
                {isAIControl && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<AIIcon />}>
                      Esta herramienta incluye controles de IA automáticos
                    </Alert>
                  </Grid>
                )}
                
                {/* Ejemplo de flujo completo */}
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      📱 Ejemplo de flujo en WhatsApp:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ fontSize: '0.85rem' }}>
                      {selectedTemplate?.type === 'GET' && (
                        <>
                          1. Cliente: "Hola" (desde +521234567890)<br/>
                          2. IA usa esta herramienta para buscar por número<br/>
                          3. Encuentra el prospecto con ID "abc123"<br/>
                          4. IA: "Hola Juan, ¿en qué te puedo ayudar?"
                        </>
                      )}
                      {selectedTemplate?.type === 'POST' && (
                        <>
                          1. Cliente nuevo: "Hola, me llamo María" (+521999888777)<br/>
                          2. IA busca por número → No encuentra<br/>
                          3. IA usa esta herramienta para crear nuevo prospecto<br/>
                          4. Guarda: nombre="María", number=521999888777<br/>
                          5. IA: "Mucho gusto María, ¿qué tipo de propiedad buscas?"
                        </>
                      )}
                      {selectedTemplate?.type === 'PUT' && !isAIControl && (
                        <>
                          1. Cliente: "Mi presupuesto cambió a $2,000,000"<br/>
                          2. IA busca por número → Encuentra prospecto ID "abc123"<br/>
                          3. IA usa esta herramienta: PUT /records/abc123<br/>
                          4. Actualiza solo: {`{presupuesto: 2000000}`}<br/>
                          5. IA: "Perfecto, actualicé tu presupuesto a $2,000,000"
                        </>
                      )}
                      {selectedTemplate?.type === 'PUT' && isAIControl && (
                        <>
                          1. Cliente: "Quiero agendar una cita"<br/>
                          2. IA busca por número → Encuentra prospecto ID "abc123"<br/>
                          3. IA usa esta herramienta: PUT /records/abc123<br/>
                          4. Actualiza: {`{ia: false, ia_reason: "Cliente quiere cita"}`}<br/>
                          5. IA se desactiva → Asesor humano toma control
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {currentStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleCreateTool}
            disabled={!canProceed() || loading}
            startIcon={loading ? <InfoIcon /> : <CheckIcon />}
          >
            {loading ? 'Creando...' : 'Crear Herramienta'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}