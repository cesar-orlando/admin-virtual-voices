// src/api/fetchAllAiConfigs.ts
export async function fetchAllAiConfigs(user: any) {
  const response = await fetch(`http://localhost:3001/api/ia-configs/${user.c_name}/${user.id}`);
  if (!response.ok) throw new Error('No se pudo obtener la configuración de AI');
  return response.json();
}
