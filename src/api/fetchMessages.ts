// src/api/fetchMessages.ts

export async function fetchMessages(user:any) {
  const response = await fetch(`http://localhost:3001/api/whatsapp/messages/${user.c_name}`);
  if (!response.ok) throw new Error('No se pudieron obtener mensajes');
  return response.json();
}
