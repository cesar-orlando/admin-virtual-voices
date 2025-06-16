import axios from "axios";
import { handleError } from "../Helpers/ErrorHandler";
import type { UserProfileToken } from "../Models/User";

  const API_URL = "http://localhost:3001/api/";

  export const loginAPI = async (email: string, password: string) => {
    try {
      const data = await axios.post<UserProfileToken>(API_URL + "users/login", {
        email: email,
        password: password,
      });
      return data;
    } catch (error) {
      handleError(error as any);
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
    } catch (error) {
      handleError(error as any);
    }
  };