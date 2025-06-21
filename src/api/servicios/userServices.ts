import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile } from "../../Models/User";

export const updateUser = async (name: string, email: string, password: string, c_name: string) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
  try {
    const response = await api.put<UserProfile>(`/users/${user.id}`, {
      c_name: user.c_name,
      name,
      email,
      password,
    });
    return response;
  } catch (error) {
    handleError(error as any);
  }
};

export const fetchCompanyUsers = async (user: UserProfile) => {
  try {
    const response = await api.get(`/users/company/${user.c_name}`);
    return response;
  } catch (error) {
    handleError(error as any);
  }
};

export const fetchClientData = async (user: UserProfile) => {
  try {
    const response = await api.get(`/companies/${user.c_name}`);
    return response;
  } catch (error) {
    handleError(error as any);
  }
};