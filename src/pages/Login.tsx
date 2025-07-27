import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BusinessIcon from "@mui/icons-material/Business";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import LogoVoice2 from '../assets/LogoVoice2.svg';
import type { LoginRequest } from '../types';

// Fuente Montserrat desde Google Fonts (solo para el login)
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

declare module "@mui/material/styles" {
  interface TypographyVariants {
    logo: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    logo?: React.CSSProperties;
  }
}

type LoginFormsInputs = {
  email: string;
  password: string;
  companySlug: string;
}

const validation = yup.object().shape({
  email: yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: yup.string().min(10, "Mínimo 10 caracteres").required("La contraseña es obligatoria"),
  companySlug: yup.string().required("Debe seleccionar una empresa"),
});

const Login = () => {
  const { loginUser, currentCompany } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [cardVisible, setCardVisible] = useState(false);
  const location = useLocation();
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  React.useEffect(() => {
    setTimeout(() => setCardVisible(true), 100); // Animación de entrada
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormsInputs>({
    resolver: yupResolver(validation),
    defaultValues: {
      companySlug: "" // Default to regular company
    }
  });

  const watchedEmail = watch("email");
  const watchedCompanySlug = watch("companySlug");

  const handleLogin = async (form: LoginFormsInputs) => {
    // Limpiar mensajes previos
    setSnackbar(s => ({ ...s, open: false }));
    setServerError("");
    setLoading(true);
    try {
      const loginData: LoginRequest = {
        email: form.email,
        password: form.password,
        companySlug: form.companySlug
      };
      await loginUser(loginData);
    } catch (error: any) {
      let errorMessage = "Credenciales incorrectas, por favor verifica tus datos.";
      // Si es un error de axios con response y data.message
      if (error && error.response && error.response.data && error.response.data.message) {
        if (error.response.data.message === "Invalid credentials") {
          errorMessage = "Credenciales incorrectas, por favor verifica tus datos.";
        } else if (error.response.data.message.length > 0 && error.response.data.message.length < 100) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error && error.message) {
        if (error.message === "Invalid credentials") {
          errorMessage = "Credenciales incorrectas, por favor verifica tus datos.";
        } else if (error.message.length > 0 && error.message.length < 100) {
          errorMessage = error.message;
        }
      }
      setServerError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1300,
        overflow: "hidden",
        fontFamily: 'Montserrat, Arial, sans-serif',
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 2, sm: 3 },
        // Fondo animado tipo aurora
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          background: `radial-gradient(circle at 20% 30%, #E05EFF 0%, transparent 60%),
                       radial-gradient(circle at 80% 20%, #3B82F6 0%, transparent 60%),
                       radial-gradient(circle at 60% 80%, #8B5CF6 0%, transparent 60%),
                       linear-gradient(120deg, #181A20 0%, #23243a 100%)`,
          animation: "auroraMove 12s ease-in-out infinite alternate",
          backgroundSize: "cover",
        },
        "@keyframes auroraMove": {
          "0%": { filter: "blur(0px)" },
          "100%": { filter: "blur(8px)" },
        },
      }}
    >
      <Box sx={{ 
        width: { xs: '100%', sm: 400, md: 420 }, 
        maxWidth: { xs: '100%', sm: 400, md: 420 },
        mx: 'auto'
      }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: { xs: 3, sm: 4, md: 5 },
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            background: "rgba(30, 30, 40, 0.65)",
            backdropFilter: "blur(16px)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            color: "#fff",
            fontFamily: 'Montserrat, Arial, sans-serif',
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)',
          }}
        >
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            mb: { xs: 2, md: 3 }
          }}>
            <img
              src={LogoVoice2}
              alt="Logo Virtual Voices"
              style={{
                width: isMobile ? 140 : isTablet ? 160 : 180,
                height: 'auto',
                marginBottom: isMobile ? 4 : 8,
                display: 'block',
                filter: 'drop-shadow(0 2px 8px #8B5CF6AA)'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "#BDBDBD",
                fontFamily: 'Montserrat, Arial, sans-serif',
                fontWeight: 400,
                fontSize: { xs: 12, sm: 13, md: 14 },
                textAlign: "center"
              }}
            >
              Sistema Multi-Empresa
            </Typography>
          </Box>

          {/* Alerta de sesión expirada */}

          <form onSubmit={handleSubmit(handleLogin)} noValidate autoComplete="off">
            <TextField
              label="Empresa"
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              {...register("companySlug")}
              error={!!errors.companySlug}
              helperText={errors.companySlug?.message}
              inputProps={{ "aria-label": "Empresa", "aria-invalid": !!errors.companySlug }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                },
                label: { 
                  color: "#BDBDBD",
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                fieldset: { borderColor: errors.companySlug ? "#E05EFF" : "#8B5CF6" },
                mb: { xs: 1, md: 2 },
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ 
                style: { 
                  color: "#BDBDBD",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                } 
              }}
              FormHelperTextProps={{
                sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } }
              }}
            />
            <TextField
              label="Correo"
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              autoComplete="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              inputProps={{ "aria-label": "Correo electrónico", "aria-invalid": !!errors.email }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                },
                label: { 
                  color: "#BDBDBD",
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                fieldset: { borderColor: errors.email ? "#E05EFF" : "#8B5CF6" },
                mb: { xs: 1, md: 2 },
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ 
                style: { 
                  color: "#BDBDBD",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                } 
              }}
              FormHelperTextProps={{
                id: "email-error-text",
                role: errors.email ? "alert" : undefined,
                "aria-live": errors.email ? "assertive" : undefined,
                sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } }
              }}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              autoComplete="current-password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              inputProps={{ "aria-label": "Contraseña", "aria-invalid": !!errors.password }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                },
                label: { 
                  color: "#BDBDBD",
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                fieldset: { borderColor: errors.password ? "#E05EFF" : "#8B5CF6" },
                mb: { xs: 1, md: 2 },
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ 
                style: { 
                  color: "#BDBDBD",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                } 
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size={isMobile ? "small" : "medium"}
                      sx={{ color: "#8B5CF6" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              FormHelperTextProps={{
                id: "password-error-text",
                role: errors.password ? "alert" : undefined,
                "aria-live": errors.password ? "assertive" : undefined,
                sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } }
              }}
            />
            {serverError && (
              // <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: "center" }} role="alert" aria-live="assertive">
              //   {serverError}
              // </Typography>
              null
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? "medium" : "large"}
              sx={{
                mt: { xs: 2, md: 3 },
                mb: { xs: 1, md: 2 },
                fontWeight: 700,
                fontSize: { xs: 16, sm: 17, md: 18 },
                letterSpacing: 1,
                background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 50%, #1976D2 100%)",
                color: "#fff",
                boxShadow: "0 2px 8px #3B82F6AA",
                borderRadius: { xs: 2, md: 3 },
                py: { xs: 1.2, md: 1.5 },
                transition: "all 0.2s, box-shadow 0.3s",
                '&:hover': {
                  background: "linear-gradient(90deg, #1976D2 0%, #3B82F6 50%, #8B5CF6 100%)",
                  boxShadow: "0 4px 24px #E05EFF99, 0 2px 8px #3B82F6AA",
                  transform: 'scale(1.03)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
              disabled={loading}
              endIcon={!loading && <Visibility sx={{ opacity: 0 }} />} // para mantener altura
            >
              {loading ? <CircularProgress size={isMobile ? 20 : 24} color="inherit" /> : "Entrar"}
            </Button>
          </form>
        </Paper>
        <Box sx={{ 
          mt: { xs: 2, md: 3 }, 
          textAlign: "center",
          px: { xs: 1, md: 0 }
        }}>
          <Button
            component={RouterLink}
            to="/register"
            variant="text"
            sx={{
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "none",
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: { xs: 14, sm: 15 },
              "&:hover": { textDecoration: "underline", background: "none" },
            }}
          >
            ¿No tienes cuenta? Regístrate aquí
          </Button>
        </Box>
        <Box sx={{ 
          mt: { xs: 2, md: 3 }, 
          textAlign: "center", 
          color: "#BDBDBD", 
          fontSize: { xs: 11, sm: 12, md: 13 }, 
          fontFamily: 'Montserrat, Arial, sans-serif',
          px: { xs: 1, md: 0 }
        }}>
          © {new Date().getFullYear()} Virtual Voices. Todos los derechos reservados.
        </Box>
      </Box>
      {/* Snackbar para errores y sesión expirada */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor:
              snackbar.severity === 'success'
                ? '#8B5CF6'
                : snackbar.severity === 'warning'
                ? '#F59E42'
                : undefined,
            color: '#fff',
            fontWeight: 600,
            fontSize: { xs: 14, md: 16 },
            letterSpacing: 0.5,
            minWidth: { xs: 280, sm: 320 },
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 

export default Login;