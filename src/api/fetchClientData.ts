// src/api/fetchAiConfig.ts
export async function fetchClientData() {
    const userId="684b20f20a6d0e3c080afa0e"
    const c_name="test_company"
    const response = await fetch(`http://localhost:3001/api/users/${c_name}/${userId}`);
    if (!response.ok) throw new Error('No se pudo obtener los datos del usuario');
    return response.json();
}
