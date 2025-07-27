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
  useMediaQuery,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
import { useCompanyStatuses } from "../hooks/useCompanyStatuses";

export default function UserProfile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
  const { statuses } = useCompanyStatuses();
  
  const existingUser = {
    name: userFromStorage.name,
    email: userFromStorage.email,
    password: "",
    role: userFromStorage.role,
    company: userFromStorage.c_name,
    status: userFromStorage.status || statuses[0] || 'Activo',
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
      await updateUser(userFromStorage.id, {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        status: user.status,
        c_name: user.company || ''
      });
      setEdit(false);
      setSnackbar({ open: true, message: "Perfil actualizado correctamente", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar el perfil", severity: "error" });
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: { xs: '100vh', md: '80vh' },
        height: { xs: '100%', md: '80vh' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #2a1850 0%, #8B5CF6 100%)'
          : 'linear-gradient(135deg, #E05EFF11 0%, #8B5CF611 100%)',
        overflow: 'hidden',
        position: 'relative',
        borderBottomLeftRadius: { xs: 0, md: 20 },
        borderBottomRightRadius: { xs: 0, md: 20 },
        p: { xs: 1, md: 0 },
      }}
    >
      {/* Header visual */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 80, md: 100 },
          minHeight: { xs: 80, md: 80 },
          background: 'linear-gradient(90deg, #E05EFF 0%, #8B5CF6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderTopLeftRadius: { xs: 0, md: 20 },
          borderTopRightRadius: { xs: 0, md: 20 },
        }}
      >
        <Box
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: { xs: -32, md: -48 },
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
              width: { xs: 64, sm: 80, md: 96 },
              height: { xs: 64, sm: 80, md: 96 },
              border: { xs: '3px solid #fff', md: '4px solid #fff' },
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
                  p: { xs: 0.5, md: 1 },
                  opacity: 0.95,
                  width: { xs: 28, md: 40 },
                  height: { xs: 28, md: 40 },
                }}
              >
                <CameraAltIcon fontSize={isMobile ? "small" : "medium"} />
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
          p: { xs: 1, md: 0 },
        }}
      >
        <Paper
          elevation={1}
          sx={{
            borderRadius: { xs: 8, sm: 12, md: 16 },
            maxWidth: { xs: '100%', sm: 380, md: 400 },
            width: '100%',
            minHeight: 'auto',
            background: theme.palette.mode === 'dark'
              ? 'rgba(30,30,40,0.92)'
              : 'rgba(255,255,255,0.85)',
            color: theme.palette.mode === 'dark' ? '#fff' : '#23243a',
            fontFamily: 'Montserrat, Arial, sans-serif',
            boxShadow: '0 4px 24px 0 rgba(139,92,246,0.08)',
            p: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            border: 'none',
            pt: { xs: '40px', sm: '48px', md: '56px' }, // padding top para el avatar flotante
            m: { xs: 1, md: 2 },
          }}
        >
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 700, 
              letterSpacing: 1, 
              color: '#8B5CF6', 
              mb: 0.5, 
              textAlign: 'center', 
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}
          >
            {user.company}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Box
              sx={{
                px: { xs: 1.5, md: 2 },
                py: 0.5,
                borderRadius: 99,
                background: 'linear-gradient(90deg, #E05EFF11 0%, #8B5CF611 100%)',
                color: '#8B5CF6',
                fontWeight: 600,
                fontSize: { xs: '0.8rem', md: '0.95rem' },
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: 'Montserrat, Arial, sans-serif',
              }}
            >
              {user.role?.toUpperCase() || 'USUARIO'}
            </Box>
            <Box
              sx={{
                px: { xs: 1.5, md: 2 },
                py: 0.5,
                borderRadius: 99,
                background: user.status === 'Activo' 
                  ? 'linear-gradient(90deg, #10B98111 0%, #05966911 100%)'
                  : 'linear-gradient(90deg, #EF444411 0%, #DC262611 100%)',
                color: user.status === 'Activo' ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: { xs: '0.8rem', md: '0.95rem' },
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: 'Montserrat, Arial, sans-serif',
              }}
            >
              {user.status?.toUpperCase() || 'ACTIVO'}
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
              size={isMobile ? "small" : "medium"}
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ 
                      color: '#8B5CF6',
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }} />
                  </InputAdornment>
                ),
                style: { 
                  color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              InputLabelProps={{
                style: { 
                  color: '#8B5CF6', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              sx={{
                mb: { xs: 1.5, md: 2 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 8, md: 12 },
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
              size={isMobile ? "small" : "medium"}
              disabled={!edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ 
                      color: '#8B5CF6',
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }} />
                  </InputAdornment>
                ),
                style: { 
                  color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              InputLabelProps={{
                style: { 
                  color: '#8B5CF6', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              sx={{
                mb: { xs: 1.5, md: 2 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 8, md: 12 },
                  background: 'rgba(255,255,255,0.7)',
                  '& fieldset': { borderColor: '#E05EFF11' },
                  '&:hover fieldset': { borderColor: '#8B5CF6' },
                  '&.Mui-focused fieldset': { borderColor: '#E05EFF' }
                }
              }}
            />
            <FormControl 
              fullWidth 
              margin="normal" 
              disabled={!edit}
              size={isMobile ? "small" : "medium"}
              sx={{ mb: { xs: 1.5, md: 2 } }}
            >
              <InputLabel sx={{ 
                color: '#8B5CF6', 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                Estado
              </InputLabel>
              <Select
                name="status"
                value={user.status}
                onChange={handleChange}
                sx={{
                  borderRadius: { xs: 8, md: 12 },
                  background: 'rgba(255,255,255,0.7)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E05EFF11' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8B5CF6' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E05EFF' },
                  '& .MuiSelect-select': { 
                    color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', 
                    fontWeight: 600,
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Introduce tu contraseña para guardar cambios"
              onChange={handleChange}
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              disabled={!edit}
              required={edit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ 
                      color: '#8B5CF6',
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }} />
                  </InputAdornment>
                ),
                style: { 
                  color: theme.palette.mode === 'dark' ? '#fff' : '#23243a', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              InputLabelProps={{
                style: { 
                  color: '#8B5CF6', 
                  fontWeight: 600,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }
              }}
              sx={{
                mb: { xs: 1.5, md: 2 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 8, md: 12 },
                  background: 'rgba(255,255,255,0.7)',
                  '& fieldset': { borderColor: '#E05EFF11' },
                  '&:hover fieldset': { borderColor: '#8B5CF6' },
                  '&.Mui-focused fieldset': { borderColor: '#E05EFF' }
                }
              }}
            />
            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              mt: { xs: 2, md: 3 } 
            }}>
              {edit ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon fontSize={isMobile ? "small" : "medium"} />}
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    background: "linear-gradient(90deg, #E05EFF 0%, #8B5CF6 50%, #3B82F6 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', md: '1.05rem' },
                    px: { xs: 3, md: 4 },
                    py: { xs: 1, md: 1.2 },
                    borderRadius: 99,
                    boxShadow: '0 2px 8px #E05EFF22',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #E05EFF 100%)",
                      transform: { xs: 'scale(1.02)', md: 'translateY(-2px) scale(1.03)' },
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
                  startIcon={<EditIcon fontSize={isMobile ? "small" : "medium"} />}
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    color: "#8B5CF6",
                    borderColor: "#8B5CF6",
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', md: '1.05rem' },
                    px: { xs: 3, md: 4 },
                    py: { xs: 1, md: 1.2 },
                    borderRadius: 99,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: "#E05EFF11",
                      borderColor: "#E05EFF",
                      transform: { xs: 'scale(1.02)', md: 'translateY(-2px) scale(1.03)' },
                    }
                  }}
                  onClick={() => setEdit(true)}
                >
                  {isMobile ? 'Editar' : 'Editar perfil'}
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
        anchorOrigin={{ 
          vertical: 'top', 
          horizontal: 'center' 
        }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#8B5CF6' : undefined,
            fontSize: { xs: '0.875rem', md: '1rem' },
            minWidth: { xs: 280, md: 320 },
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 