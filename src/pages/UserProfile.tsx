import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Stack,
  Chip,
  Divider,
  Snackbar,
  InputAdornment,
  useTheme,
  Fade
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MuiAlert from '@mui/material/Alert';
import type { UserProfile } from "../types";
import { updateUser } from "../api/servicios";

export default function UserProfile() {
  const theme = useTheme();
  const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
  const existingUser = {
    name: userFromStorage.name,
    email: userFromStorage.email,
    password: "",
    role: userFromStorage.role,
    company: userFromStorage.c_name,
    profilePic: "https://i.pravatar.cc/150?img=3"
  };
  const [user, setUser] = useState(existingUser);
  const [edit, setEdit] = useState(false);
  const [profilePic, setProfilePic] = useState(existingUser.profilePic);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [avatarHover, setAvatarHover] = useState(false);

  interface HandleChangeEvent {
    target: {
      name: string;
      value: string;
    };
  }

  const handleChange = (e: HandleChangeEvent) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          setProfilePic(result);
          setUser({ ...user, profilePic: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user.password || user.password.trim() === "") {
      setSnackbar({ open: true, message: "Debes ingresar tu contraseña para guardar los cambios.", severity: "error" });
      return;
    }
    try {
      await updateUser(
        user.name,
        user.email,
        user.password,
        existingUser.company || ""
      );
      setEdit(false);
      setSnackbar({ open: true, message: "Perfil actualizado correctamente", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar el perfil", severity: "error" });
    }
  };

  // Tamaño del avatar
  const AVATAR_SIZE = 140;
  const HEADER_HEIGHT = 180;

  return (
    <Box
      sx={{
        height: '80vh',
        width: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #2a1850 0%, #8B5CF6 100%)'
          : 'linear-gradient(135deg, #E05EFF11 0%, #8B5CF611 100%)',
        overflow: 'hidden',
        position: 'relative',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      {/* Header visual */}
      <Box
        sx={{
          width: '100%',
          height: 100,
          minHeight: 80,
          background: 'linear-gradient(90deg, #E05EFF 0%, #8B5CF6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <Box
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: -48,
            transform: 'translateX(-50%)',
            zIndex: 10,
            cursor: edit ? 'pointer' : 'default',
            boxShadow: '0 2px 8px #E05EFF22',
            borderRadius: '50%',
          }}
        >
          <Avatar
            src={profilePic}
            alt={user.company}
            sx={{
              width: 96,
              height: 96,
              border: '4px solid #fff',
              background: '#fff',
              transition: 'box-shadow 0.3s',
              boxShadow: avatarHover && edit ? '0 0 0 4px #E05EFF33' : '0 2px 8px #E05EFF22',
              filter: avatarHover && edit ? 'brightness(0.97)' : 'none',
            }}
          />
          {edit && (
            <Fade in={avatarHover}>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: '#fff',
                  color: '#8B5CF6',
                  boxShadow: '0 2px 8px #E05EFF22',
                  '&:hover': { background: '#E05EFF', color: '#fff' },
                  zIndex: 20,
                  p: 1,
                  opacity: 0.95,
                }}
              >
                <CameraAltIcon fontSize="medium" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePicChange}
                />
              </IconButton>
            </Fade>
          )}
        </Box>
      </Box>
      {/* Card principal glassmorphism */}
      <Box
        sx={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            maxWidth: 400,
            width: '100%',
            height: 'auto',
            background: theme.palette.mode === 'dark'
              ? 'rgba(30,30,40,0.92)'
              : 'rgba(255,255,255,0.85)',
            color: theme.palette.mode === 'dark' ? '#fff' : '#23243a',
            fontFamily: 'Montserrat, Arial, sans-serif',
            boxShadow: '0 4px 24px 0 rgba(139,92,246,0.08)',
            p: { xs: 3, sm: 5 },
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            border: 'none',
            pt: '56px', // padding top para el avatar flotante
            m: 2,
            '@media (max-width: 900px)': {
              maxWidth: 340,
              p: 2,
              borderRadius: 14,
              pt: '48px',
            },
            '@media (max-width: 600px)': {
              maxWidth: '98vw',
              p: 1,
              borderRadius: 8,
              pt: '36px',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, color: '#8B5CF6', mb: 0.5, textAlign: 'center', fontFamily: 'Montserrat, Arial, sans-serif' }}>
            {user.company}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 99,
                background: 'linear-gradient(90deg, #E05EFF11 0%, #8B5CF611 100%)',
                color: '#8B5CF6',
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: 'Montserrat, Arial, sans-serif',
              }}
            >
              {user.role?.toUpperCase() || 'USUARIO'}
            </Box>
          </Box>
          <Box component="form" autoComplete="off" sx={{ width: '100%' }}>
            <TextField
              label="Nombre"
              name="name"
              value={user.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#8B5CF6' }} />
                  </InputAdornment>
                ),
                style: { color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', fontWeight: 600 }
              }}
              InputLabelProps={{
                style: { color: '#8B5CF6', fontWeight: 600 }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  '& fieldset': { borderColor: '#E05EFF11' },
                  '&:hover fieldset': { borderColor: '#8B5CF6' },
                  '&.Mui-focused fieldset': { borderColor: '#E05EFF' }
                }
              }}
            />
            <TextField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={user.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#8B5CF6' }} />
                  </InputAdornment>
                ),
                style: { color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', fontWeight: 600 }
              }}
              InputLabelProps={{
                style: { color: '#8B5CF6', fontWeight: 600 }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  '& fieldset': { borderColor: '#E05EFF11' },
                  '&:hover fieldset': { borderColor: '#8B5CF6' },
                  '&.Mui-focused fieldset': { borderColor: '#E05EFF' }
                }
              }}
            />
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Introduce tu contraseña para guardar cambios"
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!edit}
              required={edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#8B5CF6' }} />
                  </InputAdornment>
                ),
                style: { color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', fontWeight: 600 }
              }}
              InputLabelProps={{
                style: { color: '#8B5CF6', fontWeight: 600 }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  '& fieldset': { borderColor: '#E05EFF11' },
                  '&:hover fieldset': { borderColor: '#8B5CF6' },
                  '&.Mui-focused fieldset': { borderColor: '#E05EFF' }
                }
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              {edit ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  sx={{
                    background: "linear-gradient(90deg, #E05EFF 0%, #8B5CF6 50%, #3B82F6 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    px: 4,
                    py: 1.2,
                    borderRadius: 99,
                    boxShadow: '0 2px 8px #E05EFF22',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #E05EFF 100%)",
                      transform: 'translateY(-2px) scale(1.03)',
                      boxShadow: '0 6px 16px #E05EFF22',
                    }
                  }}
                  onClick={handleSave}
                >
                  Guardar
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<EditIcon />}
                  sx={{
                    color: "#8B5CF6",
                    borderColor: "#8B5CF6",
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    px: 4,
                    py: 1.2,
                    borderRadius: 99,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: "#E05EFF11",
                      borderColor: "#E05EFF",
                      transform: 'translateY(-2px) scale(1.03)',
                    }
                  }}
                  onClick={() => setEdit(true)}
                >
                  Editar perfil
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#8B5CF6' : undefined,
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 