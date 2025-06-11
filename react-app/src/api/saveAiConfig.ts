// src/api/saveAiConfig.ts
export async function saveAiConfig(config: any) {
  const response = await fetch('http://localhost:3001/api/ia-configs/683f524c092ca12fc2482905', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config })
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}
