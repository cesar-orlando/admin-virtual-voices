import axios from "axios";
import { handleError } from "../Helpers/ErrorHandler";
import type { UserProfile } from "../Models/User";

  const API_URL = "http://localhost:3001/api/";

  export const updateUser = async (name: string, email: string, password: string, c_name: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
    try {
      const data = await axios.put<UserProfile>(API_URL + `users/${user.id}`, {
        c_name: user.c_name,
        name: name,
        email: email,
        password: password,
      });
      return data;
    } catch (error) {
      handleError(error as any);
    }
  };