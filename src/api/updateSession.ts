// src/api/saveAiConfig.ts
export async function updateSession(update: any) {
    //const companyId="684f69a90358ee11c4a344b7"
    const c_name="test_company"
    const response = await fetch(`http://localhost:3001/api/whatsapp/session/${c_name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de la sesión');
  return response.json();
}