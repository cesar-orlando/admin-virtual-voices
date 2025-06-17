import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';

interface UserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export default function UserDrawer({ open, onClose, onSubmit, initialData, mode = 'create' }: UserDrawerProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  React.useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    } else {
      reset();
    }
  }, [initialData, reset, setValue]);

  const handleDrawerClose = () => {
    reset();
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleDrawerClose}>
      <Box sx={{ width: { xs: 320, sm: 400 }, p: 3, position: 'relative' }}>
        <IconButton onClick={handleDrawerClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Registrar nuevo usuario</Typography>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            {...register('name', { required: 'El nombre es requerido' })}
            error={!!errors.name}
            helperText={errors.name?.message as string}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            type="email"
            {...register('email', { required: 'El email es requerido' })}
            error={!!errors.email}
            helperText={errors.email?.message as string}
          />
          <TextField
            label="Contraseña"
            fullWidth
            margin="normal"
            type="password"
            {...register('password', { required: 'La contraseña es requerida', minLength: { value: 10, message: 'Mínimo 10 caracteres' } })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
          />
          <TextField
            label="Empresa (c_name)"
            fullWidth
            margin="normal"
            {...register('c_name', { required: 'La empresa es requerida' })}
            error={!!errors.c_name}
            helperText={errors.c_name?.message as string}
          />
          <TextField
            label="Rol"
            fullWidth
            margin="normal"
            {...register('role')}
            helperText="(Opcional, puedes dejarlo vacío o poner admin/user)"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (mode === 'edit' ? 'Guardando...' : 'Registrando...') : (mode === 'edit' ? 'Guardar cambios' : 'Registrar')}
          </Button>
        </form>
      </Box>
    </Drawer>
  );
} 