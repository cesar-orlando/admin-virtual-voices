// src/api/fetchAiConfig.ts
export async function fetchAiConfig() {
  const response = await fetch('http://localhost:3001/api/ia-configs/683f524c092ca12fc2482905');
  if (!response.ok) throw new Error('No se pudo obtener la configuración de AI');
  return response.json();
}
