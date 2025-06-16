import { createContext } from "react";
import type { UserProfile } from "../Models/User";

export type UserContextType = {
    user: UserProfile | null;
    token: string | null;
    registerUser: (email: string, name: string, password: string, c_name: string) => void;
    loginUser: (email: string, password: string) => void;
    logoutUser: () => void;
    isLoggedIn: () => boolean;
};

export const UserContext = createContext<UserContextType>({} as UserContextType); 