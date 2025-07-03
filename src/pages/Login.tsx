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
  Alert,
} from "@mui/material";
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
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [cardVisible, setCardVisible] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const expired = params.get("expired");

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
      companySlug: "test" // Default to regular company
    }
  });

  const watchedEmail = watch("email");
  const watchedCompanySlug = watch("companySlug");

  const handleLogin = async (form: LoginFormsInputs) => {
    setLoading(true);
    setServerError("");
    
    try {
      const loginData: LoginRequest = {
        email: form.email,
        password: form.password,
        companySlug: form.companySlug
      };
      
      await loginUser(loginData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Credenciales incorrectas o error al iniciar sesión.";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Predefined test accounts for easy access
  const testAccounts = [
    {
      name: "Quick Learning Admin",
      email: "admin@quicklearning.com",
      password: "QuickLearning2024!",
      companySlug: "quicklearning",
      type: "Enterprise"
    },
    {
      name: "Usuario Regular",
      email: "korina@gmail.com",
      password: "Korina1234567890.",
      companySlug: "test",
      type: "Regular"
    }
  ];

  const fillTestAccount = (account: typeof testAccounts[0]) => {
    setValue("email", account.email);
    setValue("password", account.password);
    setValue("companySlug", account.companySlug);
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
      <Box sx={{ width: isMobile ? '98vw' : 420, maxWidth: "98vw" }}>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2 : 4,
            borderRadius: 5,
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
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
            <img
              src={LogoVoice2}
              alt="Logo Virtual Voices"
              style={{
                width: 180,
                height: 'auto',
                marginBottom: 8,
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
                fontSize: 14,
                textAlign: "center"
              }}
            >
              Sistema Multi-Empresa
            </Typography>
          </Box>

          {/* Alerta de sesión expirada */}
          {expired && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning">
                Tu sesión ha expirado. Por favor, inicia sesión de nuevo.
              </Alert>
            </Box>
          )}

          {/* Quick access test accounts */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#BDBDBD', mb: 1, display: 'block' }}>
              Acceso rápido para pruebas:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {testAccounts.map((account, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  onClick={() => fillTestAccount(account)}
                  sx={{
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    borderColor: account.type === 'Enterprise' ? '#E05EFF' : '#8B5CF6',
                    color: account.type === 'Enterprise' ? '#E05EFF' : '#8B5CF6',
                    '&:hover': {
                      backgroundColor: account.type === 'Enterprise' ? 'rgba(224, 94, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    }
                  }}
                >
                  {account.name}
                </Button>
              ))}
            </Box>
          </Box>

          <form onSubmit={handleSubmit(handleLogin)} noValidate autoComplete="off">
            <TextField
              label="Empresa"
              fullWidth
              margin="normal"
              {...register("companySlug")}
              error={!!errors.companySlug}
              helperText={errors.companySlug?.message || 'Nombre corto de la empresa (ej: quicklearning, test, etc.)'}
              inputProps={{ "aria-label": "Empresa", "aria-invalid": !!errors.companySlug }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                },
                label: { color: "#BDBDBD" },
                fieldset: { borderColor: errors.companySlug ? "#E05EFF" : "#8B5CF6" },
                mb: 2,
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ style: { color: "#BDBDBD" } }}
            />
            <TextField
              label="Correo"
              fullWidth
              margin="normal"
              autoComplete="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              inputProps={{ "aria-label": "Correo electrónico", "aria-invalid": !!errors.email }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                },
                label: { color: "#BDBDBD" },
                fieldset: { borderColor: errors.email ? "#E05EFF" : "#8B5CF6" },
                mb: 2,
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ style: { color: "#BDBDBD" } }}
              FormHelperTextProps={{
                id: "email-error-text",
                role: errors.email ? "alert" : undefined,
                "aria-live": errors.email ? "assertive" : undefined,
              }}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              autoComplete="current-password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              inputProps={{ "aria-label": "Contraseña", "aria-invalid": !!errors.password }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                },
                label: { color: "#BDBDBD" },
                fieldset: { borderColor: errors.password ? "#E05EFF" : "#8B5CF6" },
                mb: 2,
                transition: 'box-shadow 0.3s',
                '& .Mui-focused fieldset': {
                  borderColor: "#E05EFF",
                  boxShadow: "0 0 8px 2px #E05EFF55",
                },
              }}
              InputLabelProps={{ style: { color: "#BDBDBD" } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
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
              }}
            />
            {serverError && (
              <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: "center" }} role="alert" aria-live="assertive">
                {serverError}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 1,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1,
                background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 50%, #1976D2 100%)",
                color: "#fff",
                boxShadow: "0 2px 8px #3B82F6AA",
                borderRadius: 3,
                py: 1.5,
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
              {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
            </Button>
          </form>
        </Paper>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            component={RouterLink}
            to="/register"
            variant="text"
            sx={{
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "none",
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: 15,
              "&:hover": { textDecoration: "underline", background: "none" },
            }}
          >
            ¿No tienes cuenta? Regístrate aquí
          </Button>
        </Box>
        <Box sx={{ mt: 3, textAlign: "center", color: "#BDBDBD", fontSize: 13, fontFamily: 'Montserrat, Arial, sans-serif' }}>
          © {new Date().getFullYear()} Virtual Voices. Todos los derechos reservados.
        </Box>
      </Box>
    </Box>
  );
} 

export default Login;