import axios from "axios";

export async function login(email: string, password: string): Promise<{ token: string; user: any }> {
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
} 