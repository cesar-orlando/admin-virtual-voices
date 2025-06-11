// src/api/fetchAiConfig.ts
export async function fetchAiConfig() {
  const response = await fetch('http://localhost:3001/api/ia-configs/test_company');
  if (!response.ok) throw new Error('No se pudo obtener la configuración de AI');
  return response.json();
}
