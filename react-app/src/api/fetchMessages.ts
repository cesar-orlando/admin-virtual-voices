// src/api/fetchMessages.ts

export async function fetchMessages() {
  const response = await fetch('http://localhost:3001/api/whatsapp/messages');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}
