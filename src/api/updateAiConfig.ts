// src/api/saveAiConfig.ts
export async function updateAiConfig(config: any) {
  //const companyId="684f69a90358ee11c4a344b7"
  const c_name="test_company"
  const userId="684b20f20a6d0e3c080afa0e"
  const response = await fetch(`http://localhost:3001/api/ia-configs/${c_name}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}