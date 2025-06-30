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
    registerUser_Legacy: (email: string, name: string, password: string, c_name: string) => Promise<void>;
    loginUser_Legacy: (email: string, password: string) => Promise<void>;
};

export const UserContext = createContext<UserContextType>({} as UserContextType); 