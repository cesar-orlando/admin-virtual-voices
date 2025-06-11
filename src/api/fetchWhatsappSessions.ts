// src/api/fetchWhatsappSessions.ts

export async function fetchSessions() {
  const response = await fetch('http://localhost:3001/api/whatsapp/session/test_company');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}
