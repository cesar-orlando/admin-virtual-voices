import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface UserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode?: 'create' | 'edit';
  statuses: string[];
  companyName: string;
  currentUserRole: string;
}

const ROLES = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Gerente', label: 'Gerente' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Asesor', label: 'Asesor' },
  { value: 'Asistente', label: 'Asistente' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

export default function UserDrawer({ open, onClose, onSubmit, initialData, mode = 'create', statuses, companyName, currentUserRole }: UserDrawerProps) {
  const mapStatusToValue = (status: string) => {
    if (status === 'Activo') return 'active';
    if (status === 'Inactivo') return 'inactive';
    return status;
  };
  const mapStatusToLabel = (status: string) => {
    if (status === 'active') return 'Activo';
    if (status === 'inactive') return 'Inactivo';
    return status;
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ROLES[0].value,
    status: mapStatusToValue(initialData?.status || STATUS_OPTIONS[0].value)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role: initialData.role || ROLES[0].value,
        status: mapStatusToValue(initialData.status || STATUS_OPTIONS[0].value)
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ROLES[0].value,
        status: STATUS_OPTIONS[0].value
      });
    }
  }, [initialData]);

  const handleDrawerClose = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      status: STATUS_OPTIONS[0].value
    });
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (mode === 'create' && formData.password.length < 10) {
      newErrors.password = 'La contraseña debe tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, status: formData.status, companySlug: companyName });
    } catch (error) {
      console.error('UserDrawer handleFormSubmit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleDrawerClose}>
      <Box sx={{ width: { xs: 320, sm: 400 }, p: 3, position: 'relative' }}>
        <IconButton onClick={handleDrawerClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {mode === 'edit' ? 'Editar usuario' : 'Registrar nuevo usuario'}
        </Typography>
        <form onSubmit={handleFormSubmit} autoComplete="off">
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
          />
          <FormControl fullWidth margin="normal" disabled={!(currentUserRole === 'Administrador' || currentUserRole === 'Gerente')}>
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.role}
              label="Rol"
              onChange={(e) => handleInputChange('role', e.target.value)}
            >
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {mode === 'create' && (
            <TextField
              label="Contraseña"
              fullWidth
              margin="normal"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.status}
              label="Estado"
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={isSubmitting}
          >
            {mode === 'edit' ? 'Guardar Cambios' : 'Registrar Usuario'}
          </Button>
        </form>
      </Box>
    </Drawer>
  );
} 