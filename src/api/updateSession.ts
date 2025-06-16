// src/api/saveAiConfig.ts
export async function updateSession(update: any, user: any) {
    const response = await fetch(`http://localhost:3001/api/whatsapp/session/${user.c_name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de la sesión');
  return response.json();
}