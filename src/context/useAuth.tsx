/*import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
} */

import { createContext, useEffect, useState } from "react";
import type { UserProfile } from "../Models/User";
import { useNavigate } from "react-router-dom";
import { loginAPI, registerAPI } from "../api/authServices";
import { toast } from "react-toastify";
import React from "react";
import axios from "axios";

type UserContextType = {
    user: UserProfile | null;
    token: string | null;
    registerUser: (email: string, name: string, password: string, c_name: string) => void;
    loginUser: (email: string, password: string) => void;
    logoutUser: () => void;
    isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: Props) => {

  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if(user && token) {
      setUser(JSON.parse(user));
      setToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsReady(true);
  }, []);

  const registerUser = async (
    email: string,
    name: string,
    password: string,
    c_name: string
  ) => {
    await registerAPI(email, name, password, c_name).then((res) => {
      if(res) {
        localStorage.setItem("token", res.data.token);
        const userObj = {
          name: res?.data.name,
          email: res?.data.email,
        }
        localStorage.setItem("user", JSON.stringify(userObj));
        setToken(res?.data.token!);
        setUser(userObj!);
        toast.success("Usuario registrado exitosamente");
        navigate("/login");
      }
    }).catch((e) => toast.warning("Error al registrar el usuario: " + e.message));
  };

  const loginUser = async (
    email: string,
    password: string,
  ) => {
    await loginAPI(email, password).then((res) => {
      if(res) {
        localStorage.setItem("token", res.data.token);
        const userObj = {
          name: res?.data.name,
          email: res?.data.email,
        }
        localStorage.setItem("user", JSON.stringify(userObj));
        setToken(res?.data.token!);
        setUser(userObj!);
        toast.success("Inicio de sesion exitoso");
        navigate("/");
      }
    }).catch((e) => toast.warning("Error al registrar el usuario: " + e.message));
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  return (
    <UserContext.Provider value={{ user, token, registerUser, loginUser, logoutUser, isLoggedIn }}>
      {isReady ? children : null}
    </UserContext.Provider>
  );
};

export const useAuth = () => React.useContext(UserContext);