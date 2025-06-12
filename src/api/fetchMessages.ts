// src/api/fetchMessages.ts

export async function fetchMessages() {
  const response = await fetch('http://localhost:3001/api/whatsapp/messages/test_company');
  if (!response.ok) throw new Error('No se pudieron obtener mensajes');
  return response.json();
}
