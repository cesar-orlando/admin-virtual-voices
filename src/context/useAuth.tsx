import { useEffect, useState } from "react";
import type { UserProfile, LoginRequest, RegisterRequest, CompanyConfig, UserRole } from "../types";
import { useNavigate } from "react-router-dom";
import { 
  loginAPI, 
  registerAPI, 
  quickLearningLoginAPI,
  quickLearningRegisterAPI,
  getAvailableCompaniesAPI,
  detectCompanyByEmailAPI,
  // Legacy support
  loginAPI_Legacy,
  registerAPI_Legacy
} from "../api/servicios";
import { toast } from "react-toastify";
import React from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

type Props = { children: React.ReactNode };

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentCompany, setCurrentCompany] = useState<CompanyConfig | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyConfig[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const savedCompany = localStorage.getItem("currentCompany");
    
    if (savedUser && savedToken) {
      try {
        const userObj = JSON.parse(savedUser);
        setUser(userObj);
        setToken(savedToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        
        if (savedCompany) {
          setCurrentCompany(JSON.parse(savedCompany));
        }
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Clear corrupted data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("currentCompany");
      }
    }
    
    // Load available companies
    loadAvailableCompanies();
    setIsReady(true);
  }, []);

  const loadAvailableCompanies = async () => {
    try {
      const response = await getAvailableCompaniesAPI();
      setAvailableCompanies(response.data.companies);
    } catch (error) {
      console.error("Error loading companies:", error);
      // Set default companies if API fails
      setAvailableCompanies([
        {
          slug: "quicklearning",
          name: "Quick Learning",
          displayName: "Quick Learning Enterprise",
          isEnterprise: true,
          features: {
            quickLearning: true,
            controlMinutos: true,
            elevenLabs: true,
            autoAssignment: true
          },
          database: { type: 'external' }
        },
        {
          slug: "test",
          name: "Empresa Regular",
          displayName: "Empresa Regular",
          isEnterprise: false,
          features: {},
          database: { type: 'local' }
        }
      ]);
    }
  };

  const setCurrentCompanyHandler = (company: CompanyConfig | null) => {
    setCurrentCompany(company);
    if (company) {
      localStorage.setItem("currentCompany", JSON.stringify(company));
    } else {
      localStorage.removeItem("currentCompany");
    }
  };

  const registerUser = async (registerData: RegisterRequest) => {
    try {
      let response;
      
      // Use Quick Learning specific API if it's a Quick Learning registration
      if (registerData.companySlug === "quicklearning") {
        response = await quickLearningRegisterAPI({
          ...registerData,
          companySlug: "quicklearning",
          role: (registerData.role === "Admin" || registerData.role === "Usuario") ? registerData.role : "Usuario"
        });
        
        // Set company context for Quick Learning
        const quickLearningCompany = availableCompanies.find((c: CompanyConfig) => c.slug === "quicklearning");
        if (quickLearningCompany) {
          setCurrentCompanyHandler(quickLearningCompany);
        }
      } else {
        response = await registerAPI(registerData);
        
        // Set regular company context
        const regularCompany = availableCompanies.find((c: CompanyConfig) => c.slug === "test");
        if (regularCompany) {
          setCurrentCompanyHandler(regularCompany);
        }
      }

      if (response) {
        toast.success("Usuario registrado exitosamente. Por favor inicia sesión.");
        navigate("/login");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al registrar el usuario";
      toast.error(`Error al registrar: ${errorMessage}`);
      throw error;
    }
  };

  const loginUser = async (loginData: LoginRequest) => {
    try {
      let response;
      
      // Use Quick Learning specific API if it's a Quick Learning login
      if (loginData.companySlug === "quicklearning") {
        response = await quickLearningLoginAPI({
          ...loginData,
          companySlug: "quicklearning"
        });
        
        // Set company context for Quick Learning
        const quickLearningCompany = availableCompanies.find((c: CompanyConfig) => c.slug === "quicklearning");
        if (quickLearningCompany) {
          setCurrentCompanyHandler(quickLearningCompany);
        }
      } else {
        response = await loginAPI(loginData);
        
        // Set regular company context
        const regularCompany = availableCompanies.find((c: CompanyConfig) => c.slug === loginData.companySlug || "test");
        if (regularCompany) {
          setCurrentCompanyHandler(regularCompany);
        }
      }

      if (response) {
        const token = response.data.token;
        const userObj: UserProfile = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role as UserRole,
          companySlug: response.data.companySlug,
          status: 'active'
        };

        // Save to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userObj));
        
        // Update state
        setToken(token);
        setUser(userObj);
        
        // Set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Success message with company context
        const companyName = currentCompany?.displayName || userObj.companySlug || "Virtual Voices";
        toast.success(`¡Bienvenido a ${companyName}!`);
        
        navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Credenciales incorrectas";
      toast.error(`Error al iniciar sesión: ${errorMessage}`);
      throw error;
    }
  };

  const isLoggedIn = () => {
    return !!user && !!token;
  };

  const isEnterprise = () => {
    return currentCompany?.isEnterprise || user?.companySlug === "quicklearning" || false;
  };

  const logoutUser = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentCompany");
    
    // Clear state
    setToken(null);
    setUser(null);
    setCurrentCompany(null);
    
    // Clear axios header
    delete axios.defaults.headers.common["Authorization"];
    
    toast.info("Sesión cerrada correctamente");
    navigate("/login");
  };

  // Legacy support functions for backwards compatibility
  const registerUser_Legacy = async (
    name: string,
    email: string,
    password: string,
    role: string,
    companySlug: string
  ) => {
    try {
      await registerAPI_Legacy(name, email, password, role, companySlug);
      toast.success("Usuario registrado exitosamente");
      navigate("/login");
    } catch (error: any) {
      const errorMessage = error.message || "Error al registrar el usuario";
      toast.error(errorMessage);
      throw error;
    }
  };

  const loginUser_Legacy = async (
    email: string,
    password: string,
  ) => {
    try {
      const response = await loginAPI_Legacy(email, password);
      if (response) {
        const token = response.data.token;
        const userObj: UserProfile = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role as UserRole,
          companySlug: response.data.companySlug,
          status: 'active'
        };
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userObj));
        setToken(token);
        setUser(userObj);
        toast.success("Inicio de sesión exitoso");
        navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Credenciales incorrectas";
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        token, 
        currentCompany,
        isEnterprise: isEnterprise(),
        registerUser, 
        loginUser, 
        logoutUser, 
        isLoggedIn,
        setCurrentCompany: setCurrentCompanyHandler,
        // Legacy support
        registerUser_Legacy,
        loginUser_Legacy
      }}
    >
      {isReady ? children : null}
    </UserContext.Provider>
  );
};