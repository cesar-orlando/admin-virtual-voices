import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile } from "../../Models/User";

export const updateUser = async (userId: string, userData: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  status?: string;
  c_name: string;
}) => {
  try{
  const response = await api.put<UserProfile>(`/users/${userId}`, userData);
  return response.data;
} catch (error) {
  handleError(error as any);
}
};

export const fetchCompanyUsers = async (companySlug: string) => {
  try {
    const response = await api.get(`/core/users?companySlug=${companySlug}`);
    return response.data.users || [];
  } catch (error) {
    handleError(error as any);
    return [];
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

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  c_name: string;
}) => {
  console.log('createUser called with:', userData);
  const response = await api.post('/users/register', userData);
  console.log('createUser response:', response);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
  }
};

export const fetchAllUsers = async () => {
  try {
    const response = await api.get(`/core/users/all`);
    return response.data.users || [];
  } catch (error) {
    handleError(error as any);
    return [];
  }
};