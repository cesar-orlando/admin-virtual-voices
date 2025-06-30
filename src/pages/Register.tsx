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
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BusinessIcon from "@mui/icons-material/Business";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import LogoVoice2 from '../assets/LogoVoice2.svg';
import { CompanySelector } from '../components/CompanySelector';
import { RegisterRequest, CompanyConfig, UserRole } from '../types';

// Fuente Montserrat desde Google Fonts (solo para el registro)
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

type RegisterFormsInputs = {
  name: string;
  email: string;
  password: string;
  role: string;
  c_name: string;
  companySlug: string;
}

const validation = yup.object().shape({
  name: yup.string().required("El nombre es obligatorio"),
  email: yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: yup.string().min(10, "Mínimo 10 caracteres").required("La contraseña es obligatoria"),
  role: yup.string().required("El rol es obligatorio"),
  c_name: yup.string().required("El nombre de la compañía es obligatorio"),
  companySlug: yup.string().required("Debe seleccionar una empresa"),
});

const Register = () => {
  const { registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyConfig | null>(null);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [cardVisible, setCardVisible] = useState(false);

  React.useEffect(() => {
    setTimeout(() => setCardVisible(true), 100); // Animación de entrada
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormsInputs>({
    resolver: yupResolver(validation),
    defaultValues: {
      companySlug: "test",
      role: "Usuario",
      c_name: "test"
    }
  });

  const watchedEmail = watch("email");
  const watchedCompanySlug = watch("companySlug");
  const watchedRole = watch("role");

  const handleCompanyChange = (companySlug: string, company: CompanyConfig | null) => {
    setValue("companySlug", companySlug);
    setValue("c_name", companySlug);
    setSelectedCompany(company);
    setShowCompanyInfo(!!company);
    
    // Auto-adjust role based on company type
    if (company?.isEnterprise) {
      // For Quick Learning Enterprise, default to Admin if not set
      if (!watchedRole || watchedRole === "Usuario") {
        setValue("role", "Admin");
      }
      setServerError(""); // Clear any previous errors when switching to enterprise
    } else {
      // For regular companies, default to Usuario
      setValue("role", "Usuario");
    }
  };

  const handleRegister = async (form: RegisterFormsInputs) => {
    setLoading(true);
    setServerError("");
    
    try {
      const registerData: RegisterRequest = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        c_name: form.c_name,
        companySlug: form.companySlug
      };
      
      await registerUser(registerData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrar usuario.";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Available roles based on company type
  const getAvailableRoles = () => {
    if (selectedCompany?.isEnterprise) {
      return [
        { value: "Admin", label: "Administrador Enterprise", icon: <AdminPanelSettingsIcon /> },
        { value: "Usuario", label: "Usuario Enterprise", icon: null }
      ];
    }
    return [
      { value: "Usuario", label: "Usuario", icon: null },
      { value: "Admin", label: "Administrador", icon: <AdminPanelSettingsIcon /> }
    ];
  };

  // Predefined test accounts for easy registration
  const testAccounts = [
    {
      name: "Quick Learning Admin",
      email: "admin@quicklearning.com",
      password: "QuickLearning2024!",
      role: "Admin",
      companySlug: "quicklearning",
      c_name: "quicklearning",
      type: "Enterprise"
    },
    {
      name: "Usuario Test",
      email: "test@example.com",
      password: "password1234567890",
      role: "Usuario",
      companySlug: "test",
      c_name: "test",
      type: "Regular"
    }
  ];

  const fillTestAccount = (account: typeof testAccounts[0]) => {
    setValue("name", account.name);
    setValue("email", account.email);
    setValue("password", account.password);
    setValue("role", account.role);
    setValue("companySlug", account.companySlug);
    setValue("c_name", account.c_name);
    
    handleCompanyChange(account.companySlug, 
      account.companySlug === "quicklearning" 
        ? { slug: "quicklearning", name: "Quick Learning", displayName: "Quick Learning Enterprise", isEnterprise: true, features: {}, database: { type: 'external' } }
        : { slug: "test", name: "Empresa Regular", displayName: "Empresa Regular", isEnterprise: false, features: {}, database: { type: 'local' } }
    );
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
      <Box sx={{ width: isMobile ? '98vw' : 460, maxWidth: "98vw" }}>
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
                width: 160,
                height: 'auto',
                marginBottom: 8,
                display: 'block',
                filter: 'drop-shadow(0 2px 8px #8B5CF6AA)'
              }}
            />
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                color: "#fff",
                fontFamily: 'Montserrat, Arial, sans-serif',
                letterSpacing: 1,
                textShadow: "0 2px 8px #3B82F6AA",
                mb: 0.5
              }}
            >
              REGISTRO
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#BDBDBD",
                fontFamily: 'Montserrat, Arial, sans-serif',
                textAlign: "center"
              }}
            >
              Sistema Multi-Empresa
            </Typography>
          </Box>

          {/* Quick access test accounts */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#BDBDBD', mb: 1, display: 'block' }}>
              Registro rápido para pruebas:
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
                  {account.type} - {account.role}
                </Button>
              ))}
            </Box>
          </Box>

          <form onSubmit={handleSubmit(handleRegister)} noValidate autoComplete="off">
            {/* Company Selector */}
            <CompanySelector
              value={watchedCompanySlug}
              onChange={handleCompanyChange}
              email={watchedEmail}
              error={!!errors.companySlug}
              helperText={errors.companySlug?.message}
            />

            {/* Enterprise Info Alert */}
            <Collapse in={showCompanyInfo && selectedCompany?.isEnterprise}>
              <Alert 
                severity="info" 
                icon={<BusinessIcon />}
                sx={{ 
                  mb: 2, 
                  backgroundColor: 'rgba(224, 94, 255, 0.1)',
                  color: '#fff',
                  '& .MuiAlert-icon': { color: '#E05EFF' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Registro Quick Learning Enterprise
                </Typography>
                <Typography variant="caption">
                  Se creará tu cuenta en la base de datos enterprise externa con funciones avanzadas
                </Typography>
              </Alert>
            </Collapse>

            <TextField
              label="Nombre completo"
              fullWidth
              margin="normal"
              autoFocus
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{ "aria-label": "Nombre", "aria-invalid": !!errors.name }}
              sx={{
                input: {
                  color: "#fff",
                  fontFamily: 'Montserrat, Arial, sans-serif',
                },
                label: { color: "#BDBDBD" },
                fieldset: { borderColor: errors.name ? "#E05EFF" : "#8B5CF6" },
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
              label="Correo electrónico"
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
            />

            {/* Role Selector */}
            <FormControl 
              fullWidth 
              margin="normal"
              error={!!errors.role}
            >
              <InputLabel 
                id="role-selector-label"
                sx={{ color: "#BDBDBD" }}
              >
                Rol de usuario
              </InputLabel>
              <Select
                labelId="role-selector-label"
                {...register("role")}
                value={watchedRole}
                label="Rol de usuario"
                onChange={(e) => setValue("role", e.target.value)}
                sx={{
                  color: "#fff",
                  fieldset: { 
                    borderColor: errors.role ? "#E05EFF" : "#8B5CF6" 
                  },
                  '& .Mui-focused fieldset': {
                    borderColor: "#E05EFF",
                    boxShadow: "0 0 8px 2px #E05EFF55",
                  },
                  '& .MuiSelect-icon': {
                    color: "#8B5CF6"
                  }
                }}
              >
                {getAvailableRoles().map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {role.icon && <Box sx={{ mr: 1 }}>{role.icon}</Box>}
                      <Typography>{role.label}</Typography>
                      {selectedCompany?.isEnterprise && role.value === "Admin" && (
                        <Typography variant="caption" sx={{ ml: 1, color: '#E05EFF' }}>
                          (Recomendado)
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.role && (
                <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, px: 1 }}>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              autoComplete="new-password"
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
            />

            {/* Hidden company name field that syncs with companySlug */}
            <input type="hidden" {...register("c_name")} />

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
                background: selectedCompany?.isEnterprise 
                  ? "linear-gradient(90deg, #E05EFF 0%, #8B5CF6 50%, #3B82F6 100%)"
                  : "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 50%, #1976D2 100%)",
                color: "#fff",
                boxShadow: "0 2px 8px #3B82F6AA",
                borderRadius: 3,
                py: 1.5,
                transition: "all 0.2s, box-shadow 0.3s",
                '&:hover': {
                  background: selectedCompany?.isEnterprise
                    ? "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #E05EFF 100%)"
                    : "linear-gradient(90deg, #1976D2 0%, #3B82F6 50%, #8B5CF6 100%)",
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 
                selectedCompany?.isEnterprise ? "Registrar en Enterprise" : "Registrarse"
              }
            </Button>
          </form>
        </Paper>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            component={RouterLink}
            to="/login"
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
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Button>
        </Box>
        <Box sx={{ mt: 3, textAlign: "center", color: "#BDBDBD", fontSize: 13, fontFamily: 'Montserrat, Arial, sans-serif' }}>
          © {new Date().getFullYear()} Virtual Voices. Todos los derechos reservados.
          {selectedCompany?.isEnterprise && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#E05EFF' }}>
              Quick Learning Enterprise Edition
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
} 

export default Register;