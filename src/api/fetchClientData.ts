// src/api/fetchAiConfig.ts
export async function fetchClientData() {
    const response = await fetch('http://localhost:3001/api/users/test_company/684b20f20a6d0e3c080afa0e');
    if (!response.ok) throw new Error('No se pudo obtener los datos del usuario');
    return response.json();
}
