import axios from "axios";
import { handleError } from "../Helpers/ErrorHandler";
import type { UserProfileToken } from "../Models/User";

/*export async function login(email: string, password: string): Promise<{ token: string; user: any }> {
  // Simulación de login exitoso para desarrollo
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: "fake-token",
        user: {
          name: "Orlando",
          email,
          role: "admin",
        },
      });
    }, 500);
  });
} */

  const API_URL = "http://localhost:3001/api/";

  export const loginAPI = async (email: string, password: string) => {
    try {
      const data = await axios.post<UserProfileToken>(API_URL + "users/login", {
        email: email,
        password: password,
      });
      return data;
    } catch (error){
      handleError(error);
    }
  };

  export const registerAPI = async (name: string, email: string, password: string, c_name: string) => {
    try {
      const data = await axios.post<UserProfileToken>(API_URL + "users/register", {
        name: name,
        email: email,
        password: password,
        c_name: c_name,
      });
      return data;
    } catch (error){
      handleError(error);
    }
  };