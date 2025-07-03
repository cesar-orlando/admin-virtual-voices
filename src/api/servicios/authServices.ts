import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { 
  UserProfileToken, 
  LoginRequest, 
  RegisterRequest, 
  QuickLearningLoginRequest,
  QuickLearningRegisterRequest,
  CompanyDetectionResponse,
  CompanyConfig
} from "../../types";

// Enhanced login API for multi-company support
export const loginAPI = async (loginData: LoginRequest) => {
  try {
    // Use the new core users endpoint for multi-company support
    const endpoint = loginData.companySlug ? "/core/users/login" : "/users/login";
    
    const response = await api.post<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        companySlug: string;
        status: number;
      };
    }>("/core/users/login", loginData);
    
    // Transform response to match expected UserProfileToken format
    const transformedResponse = {
      ...response,
      data: {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
        companySlug: response.data.user.companySlug,
        token: response.data.token
      }
    };
    
    return transformedResponse;
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Enhanced register API for multi-company support  
export const registerAPI = async (registerData: RegisterRequest) => {
  try {
    // Siempre usar el endpoint multiempresa
    const endpoint = "/core/users/register";
    const response = await api.post(endpoint, registerData);
    // Transform response to match expected UserProfileToken format
    const transformedResponse = {
      ...response,
      data: {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        companySlug: response.data.companySlug,
        token: '' // Register doesn't return token, user needs to login
      }
    };
    return transformedResponse;
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Quick Learning Enterprise specific login
export const quickLearningLoginAPI = async (loginData: QuickLearningLoginRequest) => {
  try {
    const response = await api.post<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        companySlug: string;
        status: number;
      };
    }>("/core/users/login", {
      ...loginData,
      companySlug: "quicklearning"
    });
    
    return {
      ...response,
      data: {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
        companySlug: "quicklearning",
        token: response.data.token
      }
    };
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Quick Learning Enterprise specific register
export const quickLearningRegisterAPI = async (registerData: QuickLearningRegisterRequest) => {
  try {
    const response = await api.post<{
      id: string;
      name: string;
      email: string;
      role: string;
      companySlug: string;
      status: number;
    }>("/core/users/register", {
      ...registerData,
      companySlug: "quicklearning"
    });
    
    return {
      ...response,
      data: {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        companySlug: "quicklearning",
        token: ''
      }
    };
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Get available companies/enterprises
export const getAvailableCompaniesAPI = async () => {
  try {
    // This would typically come from a backend endpoint
    // For now, return predefined company configurations
    const companies: CompanyConfig[] = [
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
        database: {
          type: 'external'
        },
        branding: {
          primaryColor: "#E05EFF",
          secondaryColor: "#8B5CF6"
        }
      },
      {
        slug: "test",
        name: "Empresa Regular",
        displayName: "Empresa Regular",
        isEnterprise: false,
        features: {
          quickLearning: false,
          controlMinutos: false,
          elevenLabs: false,
          autoAssignment: false
        },
        database: {
          type: 'local'
        }
      }
    ];
    
    const response: CompanyDetectionResponse = {
      companies,
      recommended: "quicklearning",
      defaultSlug: "test"
    };
    
    return { data: response };
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Detect company by email domain (future feature)
export const detectCompanyByEmailAPI = async (email: string) => {
  try {
    // Logic to detect company based on email domain
    const domain = email.split('@')[1];
    
    let recommendedCompany = "test"; // default
    
    if (domain === "quicklearning.com") {
      recommendedCompany = "quicklearning";
    }
    
    return {
      data: {
        recommendedCompany,
        isEnterprise: recommendedCompany === "quicklearning"
      }
    };
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Profile API for multi-company
export const getProfileAPI = async () => {
  try {
    const response = await api.get("/core/users/me");
    return response;
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Update profile API for multi-company
export const updateProfileAPI = async (profileData: { name?: string; password?: string }) => {
  try {
    const response = await api.put("/core/users/me/update", profileData);
    return response;
  } catch (error) {
    handleError(error as any);
    throw error;
  }
};

// Legacy support - backwards compatibility
export const loginAPI_Legacy = async (email: string, password: string) => {
  return loginAPI({ email, password });
};

export const registerAPI_Legacy = async (name: string, email: string, password: string, role: string, companySlug: string) => {
  return registerAPI({ name, email, password, role, companySlug });
};