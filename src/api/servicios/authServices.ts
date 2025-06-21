import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfileToken } from "../../Models/User";

export const loginAPI = async (email: string, password: string) => {
  try {
    const response = await api.post<UserProfileToken>("/users/login", {
      email,
      password,
    });
    return response;
  } catch (error) {
    handleError(error as any);
  }
};

export const registerAPI = async (name: string, email: string, password: string, c_name: string) => {
  try {
    const response = await api.post<UserProfileToken>("/users/register", {
      name,
      email,
      password,
      c_name,
    });
    return response;
  } catch (error) {
    handleError(error as any);
  }
};