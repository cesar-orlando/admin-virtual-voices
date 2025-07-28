import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
  Fade,
  Zoom,
  Collapse,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Comment as CommentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Campaign as CampaignIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';


interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: any;
  tableFields: any[];
  asesores: any[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  success?: boolean;
  tableChanged?: boolean;
  reloadingTableParams?: boolean;
  onTableSlugChange?: (newTableSlug: string) => Promise<void>;
  missingFields?: string[];
}

// Configuración de tipos de tabla con iconos y colores
const TABLE_TYPES = [
  { value: 'prospectos', label: 'Prospecto', icon: '🎯', color: '#FF6B6B', description: 'Cliente potencial' },
  { value: 'nuevo_ingreso', label: 'Nuevo Ingreso', icon: '🆕', color: '#4ECDC4', description: 'Cliente recién registrado' },
  { value: 'alumno', label: 'Alumno', icon: '🎓', color: '#45B7D1', description: 'Estudiante activo' },
  { value: 'sin_contestar', label: 'Sin Contestar', icon: '⏰', color: '#FFA726', description: 'Pendiente de respuesta' }
];

// Categorías de campos
const FIELD_CATEGORIES = {
  personal: {
    title: 'Información Personal',
    icon: <PersonIcon />,
    fields: ['nombre', 'email', 'telefono', 'ciudad']
  },
  classification: {
    title: 'Clasificación',
    icon: <AssignmentIcon />,
    fields: ['tableSlug', 'clasificacion', 'asesor']
  },
  financial: {
    title: 'Información Financiera',
    icon: <MoneyIcon />,
    fields: ['monto', 'adelanto', 'campana', 'consecutivo']
  },
  academic: {
    title: 'Información Académica',
    icon: <SchoolIcon />,
    fields: ['curso', 'comentario']
  },
  tracking: {
    title: 'Seguimiento',
    icon: <ScheduleIcon />,
    fields: ['ultimo_mensaje', 'lastMessageDate', 'aiEnabled', 'medio']
  }
};

export default function ClientEditModal({
  open,
  onClose,
  onSave,
  initialData,
  tableFields,
  asesores,
  loading = false,
  saving = false,
  error = null,
  success = false,
  tableChanged = false,
  reloadingTableParams = false,
  onTableSlugChange,
  missingFields: externalMissingFields = []
}: ClientEditModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<any>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Inicializar datos del formulario
  useEffect(() => {
    if (initialData) {
      console.log('ClientEditModal - initialData:', initialData);
      setFormData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [initialData]);

  // Actualizar formData cuando cambien los tableFields (nueva tabla seleccionada)
  useEffect(() => {
    if (tableFields.length > 0 && formData) {
      // Crear nuevos datos con los campos de la nueva tabla
      const newData: any = {};
      tableFields.forEach((field: any) => {
        // Mantener valores existentes si el campo existe en ambos
        newData[field.name] = formData[field.name] ?? '';
      });

      // Mantener campos especiales que no están en la estructura de tabla
      newData.tableSlug = formData.tableSlug || '';
      newData.aiEnabled = formData.aiEnabled || false;
      newData.lastMessageDate = formData.lastMessageDate || '';

      // Asegurar que los campos especiales tengan valores por defecto
      if (!newData.asesor && formData.asesor) {
        newData.asesor = formData.asesor;
      }

      if (!newData.curso) {
        newData.curso = formData.curso || 'virtual';
      }

      // Agregar campos específicos de Quick Learning
      newData.campana = formData.campana || '';
      newData.medio = formData.medio || '';
      newData.comentario = formData.comentario || '';
      newData.consecutivo = formData.consecutivo || '';

      setFormData(newData);
    }
  }, [tableFields]);

  // Sincronizar campos faltantes externos
  useEffect(() => {
    setMissingFields(externalMissingFields);
  }, [externalMissingFields]);

  // Validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Manejar cambios en el formulario
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Manejar cambio de tipo de tabla
  const handleTypeChange = async (newType: string) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    
    // Actualizar formData inmediatamente
    const updatedFormData = { ...formData, tableSlug: newType };
    setFormData(updatedFormData);
    setHasUnsavedChanges(true);
    
    // Llamar a la función para recargar parámetros si está disponible
    if (onTableSlugChange) {
      try {
        await onTableSlugChange(newType);
      } catch (error) {
        console.error('Error al recargar parámetros de tabla:', error);
      }
    }
  };



  // Guardar cambios
  const handleSave = async () => {
    try {
      await onSave(formData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (hasUnsavedChanges) {
      // Mostrar confirmación antes de cerrar
      if (window.confirm('¿Deseas cerrar sin guardar los cambios?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Obtener badge de tipo
  const getTypeBadge = (type: string) => {
    const tableType = TABLE_TYPES.find(t => t.value === type);
    return tableType || TABLE_TYPES[0];
  };

  // Filtrar campos por categoría y búsqueda
  const getFilteredFields = () => {
    let fields = tableFields;
    
    if (searchTerm) {
      fields = fields.filter(field => 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      const categoryFields = FIELD_CATEGORIES[selectedCategory as keyof typeof FIELD_CATEGORIES]?.fields || [];
      fields = fields.filter(field => categoryFields.includes(field.name));
    }
    
    return fields;
  };

  // Renderizar campo según su tipo
  const renderField = (field: any) => {
    const value = formData[field.name] || '';
    const isMissing = missingFields.includes(field.name);
    const isRequired = field.required;

    // Estilo para campos faltantes
    const missingFieldStyle = isMissing ? {
      border: `2px solid ${theme.palette.error.main}`,
      borderRadius: 2,
      backgroundColor: theme.palette.error.light + '10',
      '& .MuiInputLabel-root': {
        color: theme.palette.error.main,
        fontWeight: 600
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: theme.palette.error.main,
        },
        '&:hover fieldset': {
          borderColor: theme.palette.error.dark,
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.error.main,
        }
      }
    } : {};

    // Campo especial: Tipo de tabla
    if (field.name === 'tableSlug') {
      return (
        <Box key={field.name} sx={{ mb: 3, position: 'relative' }}>
          <FormControl fullWidth error={isMissing} sx={missingFieldStyle}>
            <InputLabel id="tipo-cliente-label">
              Tipo de Cliente {isRequired && '*'}
            </InputLabel>
            <Select
              labelId="tipo-cliente-label"
              value={value}
              label="Tipo de Cliente"
              onChange={e => handleTypeChange(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  {TABLE_TYPES.find(t => t.value === value)?.icon || <PersonIcon color="action" />}
                </InputAdornment>
              }
            >
              {TABLE_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>{type.description}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isMissing && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
              ⚠️ Campo obligatorio
            </Typography>
          )}
        </Box>
      );
    }

    // Campo especial: Asesor
    if (field.name === 'asesor') {
      // Parsear el valor del asesor si es JSON string
      let asesorData: any = null;
      let asesorValue = '';
      
      try {
        if (value && typeof value === 'string' && value.startsWith('{')) {
          // Es un JSON string, parsearlo
          asesorData = JSON.parse(value);
          // Buscar el asesor en la lista por email o nombre
          const foundAsesor = asesores.find((a: any) => 
            (a.email && asesorData?.email && a.email === asesorData.email) ||
            (a.name && asesorData?.name && a.name === asesorData.name) ||
            (a.nombre && asesorData?.name && a.nombre === asesorData.name)
          );
          if (foundAsesor) {
            asesorValue = String(foundAsesor._id || foundAsesor.id || foundAsesor.value || '');
          }
        } else if (value) {
          // Es un ID directo
          asesorValue = String(value);
        }
      } catch (e) {
        console.warn('Error parsing asesor JSON:', e);
        asesorValue = value ? String(value) : '';
      }
      
      console.log('Asesor field - original value:', value, 'parsed data:', asesorData, 'final value:', asesorValue);
      
      return (
        <Box key={field.name} sx={{ mb: 3, position: 'relative' }}>
          <FormControl fullWidth error={isMissing} sx={missingFieldStyle}>
            <InputLabel>
              Asesor {isRequired && '*'}
            </InputLabel>
            <Select
              value={asesorValue}
              label="Asesor"
              onChange={(e) => {
                const selectedId = e.target.value;
                if (selectedId === '') {
                  // Sin asesor
                  handleFieldChange(field.name, '');
                } else {
                  // Encontrar el asesor completo para crear el JSON
                  const selectedAsesor = asesores.find((a: any) => 
                    String(a._id || a.id || a.value || '') === selectedId
                  );
                  if (selectedAsesor) {
                    // Crear objeto JSON consistente
                    const asesorJson = JSON.stringify({
                      name: selectedAsesor.nombre || selectedAsesor.name || selectedAsesor.label,
                      email: selectedAsesor.email
                    });
                    console.log('Saving asesor as JSON:', asesorJson);
                    handleFieldChange(field.name, asesorJson);
                  } else {
                    // Fallback: guardar solo el ID
                    handleFieldChange(field.name, selectedId);
                  }
                }
              }}
              startAdornment={
                <InputAdornment position="start">
                  <GroupIcon color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <em>Sin asesor asignado</em>
              </MenuItem>
              {asesores.map((asesor: any) => {
                const asesorId = String(asesor._id || asesor.id || asesor.value || '');
                return (
                  <MenuItem key={asesorId} value={asesorId}>
                    {asesor.nombre || asesor.name || asesor.label || asesor.email}
                    {asesor.apellido ? ` ${asesor.apellido}` : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {isMissing && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
              ⚠️ Campo obligatorio
            </Typography>
          )}
        </Box>
      );
    }

    // Campo especial: Email con validación
    if (field.name === 'email') {
      return (
        <Box key={field.name} sx={{ mb: 3, position: 'relative' }}>
          <TextField
            label={`${field.label || field.name} ${isRequired ? '*' : ''}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            fullWidth
            error={isMissing || (value && !isValidEmail(value))}
            helperText={isMissing ? '⚠️ Campo obligatorio' : (value && !isValidEmail(value) ? 'Email inválido' : '')}
            sx={missingFieldStyle}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: value && (
                <InputAdornment position="end">
                  {isValidEmail(value) ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </InputAdornment>
              )
            }}
          />
        </Box>
      );
    }

    // Campo especial: Teléfono
    if (field.name === 'telefono') {
      return (
        <TextField
          key={field.name}
          label={field.label || field.name}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          fullWidth
          error={isMissing}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            )
          }}
        />
      );
    }

    // Campo especial: Curso
    if (field.name === 'curso') {
      return (
        <FormControl fullWidth key={field.name} error={isMissing}>
          <InputLabel>Curso</InputLabel>
          <Select
            value={value || ''}
            label="Curso"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SchoolIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="virtual">Virtual</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="presencial">Presencial</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // Campo especial: Medio
    if (field.name === 'medio') {
      return (
        <FormControl fullWidth key={field.name} error={isMissing}>
          <InputLabel>Medio</InputLabel>
          <Select
            value={value || ''}
            label="Medio"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <CampaignIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="Meta">Meta</MenuItem>
            <MenuItem value="Google">Google</MenuItem>
            <MenuItem value="Interno">Interno</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // Campo especial: Monto
    if (field.name === 'monto' || field.name === 'adelanto') {
      return (
        <TextField
          key={field.name}
          label={field.label || field.name}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          fullWidth
          type="number"
          error={isMissing}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MoneyIcon color="action" />
              </InputAdornment>
            )
          }}
        />
      );
    }

    // Campo especial: Comentario
    if (field.name === 'comentario') {
      return (
        <TextField
          key={field.name}
          label={field.label || field.name}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          fullWidth
          multiline
          rows={3}
          error={isMissing}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CommentIcon color="action" />
              </InputAdornment>
            )
          }}
        />
      );
    }

    // Campo especial: Fecha
    if (field.name === 'lastMessageDate') {
      return (
        <TextField
          key={field.name}
          label={field.label || field.name}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          fullWidth
          error={isMissing}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ScheduleIcon color="action" />
              </InputAdornment>
            )
          }}
        />
      );
    }

    // Campo especial: Boolean (AI Enabled)
    if (field.name === 'aiEnabled') {
      // Normalizar el valor boolean a string
      const aiValue = value === true || value === 'true' ? 'true' : 'false';
      console.log('aiEnabled field - original value:', value, 'normalized:', aiValue);
      
      return (
        <FormControl fullWidth key={field.name} error={isMissing}>
          <InputLabel>IA Habilitada</InputLabel>
          <Select
            value={aiValue}
            label="IA Habilitada"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <AutoAwesomeIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="true">Sí</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // Campo genérico
    return (
      <Box key={field.name} sx={{ mb: 3, position: 'relative' }}>
        <TextField
          label={`${field.label || field.name} ${isRequired ? '*' : ''}`}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          fullWidth
          error={isMissing}
          helperText={isMissing ? '⚠️ Campo obligatorio' : ''}
          sx={missingFieldStyle}
        />
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: '#fff',
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>
            Información del Cliente
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {formData.tableSlug && (
            <Chip
              label={getTypeBadge(formData.tableSlug).label}
              sx={{
                background: getTypeBadge(formData.tableSlug).color,
                color: '#fff',
                fontWeight: 600
              }}
            />
          )}
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Alertas */}
        <Box sx={{ p: 3, pb: 0 }}>
          {success && (
            <Fade in={success}>
              <Alert severity="success" sx={{ mb: 2 }}>
                {tableChanged ? (
                  <>
                    ¡Información guardada exitosamente! 
                    <br />
                    <strong>El registro se movió a la tabla: {formData.tableSlug}</strong>
                  </>
                ) : (
                  '¡Información guardada exitosamente!'
                )}
              </Alert>
            </Fade>
          )}
          
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          
          {reloadingTableParams && (
            <Fade in={reloadingTableParams}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  Recargando parámetros de la nueva tabla...
                </Box>
              </Alert>
            </Fade>
          )}

          {hasUnsavedChanges && (
            <Fade in={hasUnsavedChanges}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para conservarlos.
              </Alert>
            </Fade>
          )}

          {missingFields.length > 0 && (
            <Fade in={missingFields.length > 0}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    ⚠️ Campos obligatorios faltantes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {missingFields.map((fieldName, index) => {
                      const field = tableFields.find((f: any) => f.name === fieldName);
                      const fieldLabel = field?.label || fieldName;
                      return (
                        <Chip
                          key={index}
                          label={fieldLabel}
                          color="error"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Alert>
            </Fade>
          )}
        </Box>

        {/* Contenido principal */}
        <Box sx={{ p: 3, pt: 0 }}>
          {/* Búsqueda y filtros */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Buscar campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Todos"
                onClick={() => setSelectedCategory('all')}
                color={selectedCategory === 'all' ? 'primary' : 'default'}
                variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              />
              {Object.entries(FIELD_CATEGORIES).map(([key, category]) => (
                <Chip
                  key={key}
                  label={category.title}
                  onClick={() => setSelectedCategory(key)}
                  color={selectedCategory === key ? 'primary' : 'default'}
                  variant={selectedCategory === key ? 'filled' : 'outlined'}
                  icon={category.icon}
                />
              ))}
            </Box>
          </Box>

          {/* Campos del formulario */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr',
              lg: '1fr 1fr 1fr'
            },
            gap: 3,
            maxHeight: '60vh',
            overflowY: 'auto',
            p: 2,
            borderRadius: 2,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}>
            {getFilteredFields().map(renderField)}
          </Box>
        </Box>
      </DialogContent>

      {/* Footer con botones */}
      <Box sx={{ 
        p: 3, 
        pt: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasUnsavedChanges && (
            <Chip
              label="Cambios sin guardar"
              color="warning"
              size="small"
              icon={<RefreshIcon />}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            startIcon={<CancelIcon />}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #7B61FF 0%, #9B7DFF 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6B51EF 0%, #8B6DEF 100%)'
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
} 