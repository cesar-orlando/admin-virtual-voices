import { createContext } from "react";
import type { 
  UserProfile, 
  LoginRequest, 
  RegisterRequest,
  CompanyConfig
} from "../types";

export type UserContextType = {
    user: UserProfile | null;
    token: string | null;
    currentCompany: CompanyConfig | null;
    isEnterprise: boolean;
    registerUser: (registerData: RegisterRequest) => Promise<void>;
    loginUser: (loginData: LoginRequest) => Promise<void>;
    logoutUser: () => void;
    isLoggedIn: () => boolean;
    setCurrentCompany: (company: CompanyConfig | null) => void;
    // Legacy support
    registerUser_Legacy: (name: string, email: string, password: string, role: string, companySlug: string) => Promise<void>;
    loginUser_Legacy: (email: string, password: string) => Promise<void>;
};

export const UserContext = createContext<UserContextType>({} as UserContextType); 