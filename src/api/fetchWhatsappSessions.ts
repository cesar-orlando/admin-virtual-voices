// src/api/fetchWhatsappSessions.ts

export async function fetchSessions(user:any) {
  const response = await fetch(`http://localhost:3001/api/whatsapp/session/${user.c_name}/${user.id}`);
  if (!response.ok) throw new Error('No se pudieron obtener las sesiones');
  return response.json();
}
