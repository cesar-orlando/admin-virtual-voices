// src/api/saveAiConfig.ts
export async function saveAiConfig(config: any) {
  const response = await fetch('http://localhost:3001/api/ia-configs/test_company', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}
